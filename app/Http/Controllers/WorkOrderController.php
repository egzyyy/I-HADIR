<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendanceSettingOverride;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use App\Models\Student;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderParticipant;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class WorkOrderController extends Controller
{
    private const DOC_RULE = 'file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png,eml,msg';

    private function activeSessionId(int $schoolId): ?int
    {
        return SchoolSession::where('school_id', $schoolId)->where('is_active', true)->value('school_session_id');
    }

    /** Teachers + students the logged-in teacher can add as group participants. */
    public function participants()
    {
        $auth = $this->teacher();
        $sessionId = $this->activeSessionId($auth->school_id);

        $teachers = User::where('school_id', $auth->school_id)
            ->where('user_type', 'teacher')
            ->where('user_id', '!=', $auth->user_id)
            ->orderBy('first_name')
            ->get(['user_id', 'first_name', 'last_name'])
            ->map(fn ($t) => ['id' => $t->user_id, 'name' => $t->full_name])
            ->values();

        $classByStudent = Enrollment::where('school_session_id', $sessionId)
            ->with('classroom:classroom_id,name')
            ->get(['student_id', 'classroom_id'])
            ->mapWithKeys(fn ($e) => [$e->student_id => $e->classroom?->name]);

        $students = Student::where('school_id', $auth->school_id)
            ->orderBy('name')
            ->get(['student_id', 'name'])
            ->map(fn ($s) => [
                'id'    => $s->student_id,
                'name'  => $s->name,
                'class' => $classByStudent[$s->student_id] ?? null,
            ])
            ->values();

        return response()->json(['data' => ['teachers' => $teachers, 'students' => $students]]);
    }

    /** The logged-in teacher's own work orders (created by them or where they are a participant). */
    public function index()
    {
        $auth = $this->teacher();

        $orders = WorkOrder::where('school_id', $auth->school_id)
            ->where(function ($q) use ($auth) {
                $q->where('user_id', $auth->user_id)
                  ->orWhere(function ($q2) use ($auth) {
                      $q2->where('status', 'submitted')
                         ->whereHas('participants', fn ($p) => $p->where('participant_type', 'teacher')
                                                             ->where('participant_id', $auth->user_id));
                  });
            })
            ->with(['participants', 'creator:user_id,first_name,last_name'])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json(['data' => $this->present($orders)]);
    }

    /** Admin: every submitted work order in the school (drafts stay private to their teacher). */
    public function adminIndex()
    {
        $auth = $this->admin();

        $orders = WorkOrder::where('school_id', $auth->school_id)
            ->where('status', 'submitted')
            ->with(['participants', 'creator' => fn ($q) => $q->withTrashed()])
            ->orderByDesc('submitted_at')
            ->get();

        return response()->json(['data' => $this->present($orders)]);
    }

    public function store(Request $request)
    {
        $auth = $this->teacher();
        $data = $this->validatePayload($request, null);

        $order = DB::transaction(function () use ($request, $data, $auth) {
            $order = new WorkOrder([
                'school_id'         => $auth->school_id,
                'school_session_id' => $this->activeSessionId($auth->school_id),
                'user_id'           => $auth->user_id,
            ]);
            $this->fill($order, $request, $data);
            $order->save();
            $this->syncParticipants($order, $data);
            $this->creditAttendance($order);
            return $order;
        });

        return response()->json([
            'data'    => $this->present(collect([$order->fresh(['participants', 'creator'])]))->first(),
            'message' => $order->status === 'submitted' ? 'Work order submitted.' : 'Draft saved.',
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $order = $this->ownedOrFail($id);
        if ($order->status === 'submitted') {
            return response()->json(['message' => 'Submitted work orders can no longer be edited.'], 422);
        }

        $data = $this->validatePayload($request, $order);

        DB::transaction(function () use ($request, $data, $order) {
            $this->fill($order, $request, $data);
            $order->save();
            $this->syncParticipants($order, $data);
            $this->creditAttendance($order);
        });

        return response()->json([
            'data'    => $this->present(collect([$order->fresh(['participants', 'creator'])]))->first(),
            'message' => $order->status === 'submitted' ? 'Work order submitted.' : 'Draft saved.',
        ]);
    }

    public function destroy($id)
    {
        $order = $this->ownedOrFail($id);
        if ($order->status === 'submitted') {
            return response()->json(['message' => 'Submitted work orders cannot be deleted.'], 422);
        }
        if ($order->document_path) {
            Storage::disk('local')->delete($order->document_path);
        }
        $order->participants()->delete();
        $order->forceDelete();

        return response()->json(['message' => 'Draft deleted.']);
    }

    /** Stream the instruction letter — to the creator, a teacher participant, or an admin (submitted only). */
    public function document($id)
    {
        $auth = auth()->user();
        abort_unless($auth && in_array($auth->user_type, ['teacher', 'admin'], true), 403);
        $order = WorkOrder::where('school_id', $auth->school_id)->findOrFail($id);

        $allowed = ($auth->user_type === 'admin' && $order->status === 'submitted')
            || $order->user_id == $auth->user_id
            || $order->participants()->where('participant_type', 'teacher')->where('participant_id', $auth->user_id)->exists();

        if (!$allowed || !$order->document_path || !Storage::disk('local')->exists($order->document_path)) {
            abort(404);
        }

        return Storage::disk('local')->response($order->document_path, $order->document_name);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private function teacher(): User
    {
        $user = auth()->user();
        abort_unless($user && $user->user_type === 'teacher', 403, 'Work orders are only available to teachers.');
        return $user;
    }

    private function admin(): User
    {
        $user = auth()->user();
        abort_unless($user && $user->user_type === 'admin', 403, 'Only admins can view all work orders.');
        return $user;
    }

    private function ownedOrFail($id): WorkOrder
    {
        $auth = $this->teacher();
        return WorkOrder::where('school_id', $auth->school_id)
            ->where('user_id', $auth->user_id)
            ->findOrFail($id);
    }

    /**
     * Drafts accept partial data; a submit requires every field plus a document
     * (either newly uploaded or already attached to the draft).
     */
    private function validatePayload(Request $request, ?WorkOrder $existing): array
    {
        $submitting = $request->input('status') === 'submitted';
        $req = $submitting ? 'required' : 'nullable';
        $hasDoc = $existing && $existing->document_path && !$request->boolean('remove_document');

        $maxTo = $request->filled('date_from') && strtotime($request->input('date_from'))
            ? '|before_or_equal:' . Carbon::parse($request->input('date_from'))->addDays(30)->toDateString()
            : '';

        return $request->validate([
            'status'          => 'required|in:draft,submitted',
            'description'     => "$req|string|max:5000",
            'date_from'       => "$req|date",
            'date_to'         => "$req|date|after_or_equal:date_from" . $maxTo,
            'location'        => "$req|string|max:255",
            'category'        => 'required|in:individual,group',
            'teacher_ids'     => 'array',
            'teacher_ids.*'   => 'integer',
            'student_ids'     => 'array',
            'student_ids.*'   => 'integer',
            'document'        => ($submitting && !$hasDoc ? 'required|' : 'nullable|') . self::DOC_RULE,
            'remove_document' => 'nullable|boolean',
        ], [
            'date_to.before_or_equal' => 'A work order can cover at most 31 days.',
            'document.required'       => 'Please upload the instruction letter / email before submitting.',
            'date_to.after_or_equal'  => '"Date To" must be on or after "Date From".',
        ]);
    }

    private function fill(WorkOrder $order, Request $request, array $data): void
    {
        $order->fill([
            'description' => $data['description'] ?? null,
            'date_from'   => $data['date_from'] ?? null,
            'date_to'     => $data['date_to'] ?? null,
            'location'    => $data['location'] ?? null,
            'category'    => $data['category'],
            'status'      => $data['status'],
        ]);

        if ($data['status'] === 'submitted') {
            $order->submitted_at = now();
        }

        $removeOld = $request->boolean('remove_document') || $request->hasFile('document');
        if ($removeOld && $order->document_path) {
            Storage::disk('local')->delete($order->document_path);
            $order->document_path = null;
            $order->document_name = null;
        }

        if ($request->hasFile('document')) {
            $file = $request->file('document');
            $order->document_path = $file->store("work-orders/{$order->school_id}", 'local');
            $order->document_name = $file->getClientOriginalName();
        }
    }

    /**
     * Credit every participant as present on each school day the submitted work order covers.
     *
     * Reports treat "no attendance_logs row on a school day" as absent, so writing a
     * present row here is what makes work-order days count everywhere (dashboard,
     * attendance/monthly/parent reports, My Attendance) without touching those queries.
     *
     * Existing rows are kept (real check-in times survive) but upgraded to present and
     * linked to the work order — e.g. a teacher who scanned in late because of a morning
     * briefing, or a student an admin had marked absent.
     */
    private function creditAttendance(WorkOrder $order): int
    {
        if ($order->status !== 'submitted' || !$order->date_from || !$order->date_to) return 0;

        $schoolId = $order->school_id;
        // attendance_logs.school_session_id is NOT NULL — no session means nothing to credit against.
        $sessionId = $order->school_session_id ?? $this->activeSessionId($schoolId);
        if (!$sessionId) return 0;
        $from = $order->date_from->copy()->startOfDay();
        $to   = $order->date_to->copy()->startOfDay();

        // Same school-day rule as the reports: weekday unless closed, or any day explicitly opened.
        $overrides = AttendanceSettingOverride::where('school_id', $schoolId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->mapWithKeys(fn ($o) => [Carbon::parse($o->date)->toDateString() => $o->setting_id !== null]);

        $days = collect(CarbonPeriod::create($from, $to))
            ->filter(function (Carbon $d) use ($overrides) {
                $key = $d->toDateString();
                return $overrides->has($key) ? $overrides[$key] : $d->isWeekday();
            })
            ->map(fn (Carbon $d) => $d->toDateString())
            ->values();

        if ($days->isEmpty()) return 0;

        // Creator + teacher participants (deduplicated) + student participants.
        $teacherIds = collect([$order->user_id])
            ->merge($order->participants()->where('participant_type', 'teacher')->pluck('participant_id'))
            ->unique();
        $studentIds = $order->participants()->where('participant_type', 'student')->pluck('participant_id');

        $studentClassroom = Enrollment::where('school_session_id', $sessionId)
            ->whereIn('student_id', $studentIds)
            ->pluck('classroom_id', 'student_id');

        $reason = mb_strimwidth(
            "Work Order #{$order->work_order_id}: " . trim((string) $order->description) . ($order->location ? " @ {$order->location}" : ''),
            0, 255, '…'
        );

        $people = $teacherIds->map(fn ($id) => ['teacher', $id, null])
            ->merge($studentIds->map(fn ($id) => ['student', $id, $studentClassroom[$id] ?? null]));

        $credited = 0;
        foreach ($people as [$type, $userId, $classroomId]) {
            $existing = AttendanceLog::where('user_type', $type)
                ->where('user_id', (string) $userId)
                ->whereIn('date', $days)
                ->get()
                ->keyBy(fn ($l) => $l->date->toDateString());

            foreach ($days as $day) {
                if ($log = $existing->get($day)) {
                    $log->update([
                        'status'        => 'present',
                        'work_order_id' => $order->work_order_id,
                        'reason_manual' => $log->reason_manual ?: $reason,
                    ]);
                } else {
                    AttendanceLog::create([
                        'school_id'         => $schoolId,
                        'school_session_id' => $sessionId,
                        'user_type'         => $type,
                        'user_id'           => (string) $userId,
                        'classroom_id'      => $classroomId,
                        'date'              => $day,
                        'status'            => 'present',
                        'scan_method'       => 'work_order',
                        'scanned_by'        => (string) $order->user_id,
                        'reason_manual'     => $reason,
                        'work_order_id'     => $order->work_order_id,
                    ]);
                }
                $credited++;
            }
        }

        return $credited;
    }

    private function syncParticipants(WorkOrder $order, array $data): void
    {
        $order->participants()->delete();
        if ($order->category !== 'group') return;

        $schoolId = $order->school_id;

        // Only accept IDs that really belong to this school.
        $teacherIds = User::where('school_id', $schoolId)->where('user_type', 'teacher')
            ->where('user_id', '!=', $order->user_id)
            ->whereIn('user_id', $data['teacher_ids'] ?? [])->pluck('user_id');
        $studentIds = Student::where('school_id', $schoolId)
            ->whereIn('student_id', $data['student_ids'] ?? [])->pluck('student_id');

        $rows = $teacherIds->map(fn ($id) => ['participant_type' => 'teacher', 'participant_id' => $id])
            ->merge($studentIds->map(fn ($id) => ['participant_type' => 'student', 'participant_id' => $id]));

        $order->participants()->createMany($rows->all());
    }

    private function present($orders)
    {
        $teacherIds = $orders->flatMap(fn ($o) => $o->participants->where('participant_type', 'teacher')->pluck('participant_id'))->unique();
        $studentIds = $orders->flatMap(fn ($o) => $o->participants->where('participant_type', 'student')->pluck('participant_id'))->unique();

        $teachers = User::withTrashed()->whereIn('user_id', $teacherIds)->get()->keyBy('user_id');
        $students = Student::withTrashed()->whereIn('student_id', $studentIds)->get(['student_id', 'name'])->keyBy('student_id');

        // Class of each student participant, in the session the work order belongs to.
        $classOf = Enrollment::whereIn('student_id', $studentIds)
            ->whereIn('school_session_id', $orders->pluck('school_session_id')->filter()->unique())
            ->with('classroom:classroom_id,name')
            ->get(['student_id', 'school_session_id', 'classroom_id'])
            ->mapWithKeys(fn ($e) => ["{$e->student_id}:{$e->school_session_id}" => $e->classroom?->name]);

        $authId = auth()->user()->user_id;

        $creditedDays = AttendanceLog::whereIn('work_order_id', $orders->pluck('work_order_id'))
            ->selectRaw('work_order_id, COUNT(DISTINCT date) as days')
            ->groupBy('work_order_id')
            ->pluck('days', 'work_order_id');

        return $orders->map(function ($o) use ($teachers, $students, $authId, $creditedDays, $classOf) {
            $parts = $o->participants;
            return [
                'id'            => $o->work_order_id,
                'description'   => $o->description,
                'date_from'     => $o->date_from?->format('Y-m-d'),
                'date_to'       => $o->date_to?->format('Y-m-d'),
                'location'      => $o->location,
                'category'      => $o->category,
                'status'        => $o->status,
                'document_name' => $o->document_name,
                'has_document'  => (bool) $o->document_path,
                'submitted_at'  => $o->submitted_at?->toIso8601String(),
                'updated_at'    => $o->updated_at?->toIso8601String(),
                'created_by'    => $o->creator?->full_name,
                'creator'       => [
                    'id'        => $o->user_id,
                    'ic_number' => $o->creator?->ic_number,
                    'email'     => $o->creator?->email,
                    'phone'     => $o->creator?->phone_num,
                ],
                'is_owner'      => $o->user_id == $authId,
                'credited_days' => (int) ($creditedDays[$o->work_order_id] ?? 0),
                'teachers'      => $parts->where('participant_type', 'teacher')->map(fn ($p) => [
                    'id' => $p->participant_id, 'name' => $teachers->get($p->participant_id)?->full_name ?? 'Unknown teacher',
                ])->values(),
                'students'      => $parts->where('participant_type', 'student')->map(fn ($p) => [
                    'id'    => $p->participant_id,
                    'name'  => $students->get($p->participant_id)?->name ?? 'Unknown student',
                    'class' => $classOf->get("{$p->participant_id}:{$o->school_session_id}"),
                ])->values(),
            ];
        })->values();
    }
}
