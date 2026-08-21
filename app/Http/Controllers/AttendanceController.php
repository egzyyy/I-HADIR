<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendanceSetting;
use App\Models\AttendanceSettingOverride;
use App\Models\SchoolSession;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\Visitor;
use App\Http\Controllers\Concerns\ChecksGeofence;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceController extends Controller
{
    use ChecksGeofence;

    // ─── Check In ────────────────────────────────────────────────────────────

    public function checkIn(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string',
            'user_type' => 'required|in:student,teacher,staff',
            'shift_id'  => 'nullable|integer',
            'latitude'  => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'accuracy'  => 'nullable|numeric|min:0',
        ]);

        // Public kiosk scanning (landing page) works logged-out — same fallback as VisitorController
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        // Public kiosk scans must prove they happened at the school.
        if ($denied = $this->denyOutsideGeofence($request, $schoolId)) {
            return $denied;
        }

        $today    = Carbon::today()->toDateString();

        [$userId, $name, $class, $classroomId] = $this->resolveByIc(
            $request->ic_number,
            $request->user_type,
            $schoolId
        );

        if (!$userId) {
            return response()->json(['message' => "No {$request->user_type} found with that IC number."], 404);
        }

        $shift = null;
        if ($request->user_type === 'staff' && $this->isSecurityStaff($userId)) {
            [$shift, $shiftError] = $this->resolveCheckInShift($schoolId, $request->shift_id);
            if ($shiftError) {
                return response()->json(['message' => $shiftError], 422);
            }

            if ($shift) {
                $openLog = AttendanceLog::where('user_type', 'staff')
                    ->where('user_id', $userId)
                    ->whereNotNull('check_in_time')
                    ->whereNull('check_out_time')
                    ->first();

                if ($openLog) {
                    return response()->json([
                        'message' => 'You still have an open shift — please check out first.',
                        'name'    => $name,
                        'class'   => $class,
                        'duplicate' => true,
                    ], 409);
                }
            }
        }

        // Prevent duplicate check-in
        $existing = AttendanceLog::where('user_type', $request->user_type)
            ->where('user_id', $userId)
            ->where('date', $today)
            ->first();

        if ($existing && $existing->check_in_time) {
            $alreadyOut = $existing->check_out_time !== null;
            return response()->json([
                'message'   => $alreadyOut
                    ? 'Student has already completed attendance for today (checked in and out).'
                    : 'Already checked in today.',
                'name'      => $name,
                'class'     => $class,
                'status'    => $existing->status,
                'time'      => $existing->check_in_time->format('H:i:s'),
                'check_out' => $existing->check_out_time?->format('H:i:s'),
                'duplicate' => true,
                'completed' => $alreadyOut,
            ], 409);
        }

        $now = Carbon::now();

        // Reject check-in on school-closed / holiday days — security shifts run independently
        if (!$shift) {
            $override = AttendanceSettingOverride::where('school_id', $schoolId)
                ->whereDate('date', $now->toDateString())
                ->first();
            if ($override && !$override->setting_id) {
                return response()->json([
                    'message' => 'School is closed today' . ($override->note ? " ({$override->note})" : '') . '. No attendance recorded.',
                ], 403);
            }
        }

        $session = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        $status = $shift ? $this->resolveShiftStatus($shift, $now) : $this->resolveStatus($schoolId, $now);

        $log = AttendanceLog::updateOrCreate(
            ['user_type' => $request->user_type, 'user_id' => $userId, 'date' => $today],
            [
                'school_id'         => $schoolId,
                'school_session_id' => $session?->school_session_id,
                'classroom_id'      => $classroomId,
                'shift_id'          => $shift?->id,
                'check_in_time'     => $now,
                'status'            => $status,
                'scan_method'       => 'qr',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Check-in recorded.',
            'name'    => $name,
            'class'   => $class,
            'shift'   => $shift?->name,
            'status'  => $log->status,
            'time'    => $now->format('H:i:s'),
        ]);
    }

    // ─── Check Out ───────────────────────────────────────────────────────────

    public function checkOut(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string',
            'user_type' => 'required|in:student,teacher,staff',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        // Public kiosk scans must prove they happened at the school.
        if ($denied = $this->denyOutsideGeofence($request, $schoolId)) {
            return $denied;
        }

        $today    = Carbon::today()->toDateString();

        [$userId, $name, $class] = $this->resolveByIc(
            $request->ic_number,
            $request->user_type,
            $schoolId
        );

        if (!$userId) {
            return response()->json(['message' => "No {$request->user_type} found with that IC number."], 404);
        }

        if ($request->user_type === 'staff' && $this->isSecurityStaff($userId)) {
            $log = AttendanceLog::where('user_type', 'staff')
                ->where('user_id', $userId)
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->orderByDesc('check_in_time')
                ->first();
        } else {
            $log = AttendanceLog::where('user_type', $request->user_type)
                ->where('user_id', $userId)
                ->where('date', $today)
                ->first();
        }

        if (!$log || !$log->check_in_time) {
            return response()->json(['message' => 'No check-in record found for today.'], 404);
        }

        if ($log->check_out_time) {
            $storedClass = $log->classroom_id
                ? (Classroom::find($log->classroom_id)?->name ?? $class)
                : $class;
            return response()->json([
                'message'   => 'Already checked out today.',
                'name'      => $name,
                'class'     => $storedClass,
                'time'      => $log->check_out_time->format('H:i:s'),
                'duplicate' => true,
            ], 409);
        }

        $now = Carbon::now();
        $log->update(['check_out_time' => $now]);

        return response()->json([
            'success' => true,
            'message' => 'Check-out recorded.',
            'name'    => $name,
            'class'   => $class,
            'status'  => $log->status,
            'time'    => $now->format('H:i:s'),
        ]);
    }

    // ─── Manual Single Entry (for Manual Entry page) ─────────────────────────

    public function manualCheckIn(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string',
            'user_type' => 'required|in:student,teacher,staff',
            'reason'    => 'required|string|max:255',
            'shift_id'  => 'nullable|integer',
            'latitude'  => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'accuracy'  => 'nullable|numeric|min:0',
        ]);

        $schoolId = auth()->user()->school_id;
        $today    = Carbon::today()->toDateString();
        $adminId  = auth()->user()->user_id ?? auth()->id();

        [$userId, $name, $class, $classroomId] = $this->resolveByIc(
            $request->ic_number,
            $request->user_type,
            $schoolId
        );

        if (!$userId) {
            return response()->json(['message' => "No {$request->user_type} found with that IC number."], 404);
        }

        $shift = null;
        if ($request->user_type === 'staff' && $this->isSecurityStaff($userId)) {
            [$shift, $shiftError] = $this->resolveCheckInShift($schoolId, $request->shift_id);
            if ($shiftError) {
                return response()->json(['message' => $shiftError], 422);
            }
        }

        $existing = AttendanceLog::where('user_type', $request->user_type)
            ->where('user_id', $userId)
            ->where('date', $today)
            ->first();

        if ($existing && $existing->check_in_time) {
            return response()->json([
                'message'    => 'Already has a check-in record for today.',
                'name'       => $name,
                'class'      => $class,
                'check_in'   => $existing->check_in_time->format('H:i:s'),
                'check_out'  => $existing->check_out_time?->format('H:i:s'),
                'status'     => $existing->status,
                'duplicate'  => true,
            ], 409);
        }

        $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        $now     = Carbon::now();
        $status  = $shift ? $this->resolveShiftStatus($shift, $now) : $this->resolveStatus($schoolId, $now);

        $log = AttendanceLog::updateOrCreate(
            ['user_type' => $request->user_type, 'user_id' => $userId, 'date' => $today],
            [
                'school_id'         => $schoolId,
                'school_session_id' => $session?->school_session_id,
                'classroom_id'      => $classroomId,
                'shift_id'          => $shift?->id,
                'check_in_time'     => $now,
                'status'            => $status,
                'scan_method'       => 'manual',
                'scanned_by'        => $adminId,
                'reason_manual'     => $request->reason,
            ]
        );

        return response()->json([
            'success'   => true,
            'message'   => 'Manual check-in recorded.',
            'id'        => $log->id,
            'ic_number' => $request->ic_number,
            'name'      => $name,
            'class'     => $class,
            'user_type' => $request->user_type,
            'shift'     => $shift?->name,
            'reason'    => $request->reason,
            'check_in'  => $now->format('d/m/Y H:i'),
            'check_out' => null,
            'status'    => $status,
        ], 201);
    }

    public function manualCheckOut(Request $request, $id)
    {
        $schoolId = auth()->user()->school_id;

        $log = AttendanceLog::where('school_id', $schoolId)->findOrFail($id);

        if ($log->check_out_time) {
            return response()->json(['message' => 'Already checked out.'], 409);
        }

        $now = Carbon::now();
        $log->update([
            'check_out_time' => $now,
        ]);

        return response()->json([
            'success'   => true,
            'check_out' => $now->format('d/m/Y H:i'),
        ]);
    }

    // ─── Get Log ─────────────────────────────────────────────────────────────

    public function getLog(Request $request)
    {
        $schoolId = auth()->user()->school_id;
        $date     = $request->date ? Carbon::parse($request->date)->toDateString() : Carbon::today()->toDateString();
        $type     = $request->user_type ?? 'student';
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        // 1. Fetch Expected Users to display everyone (present or absent)
        $expectedUsers = collect();

        if ($type === 'student') {
            $enrollmentQuery = Enrollment::where('school_session_id', $session?->school_session_id)
                ->with(['student:student_id,name,ic_number', 'classroom:classroom_id,name'])
                ->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId));

            $expectedUsers = $enrollmentQuery->get()->map(function($e) {
                return [
                    'id'        => $e->student_id,
                    'name'      => $e->student?->name ?? '-',
                    'class'     => $e->classroom?->name ?? '-',
                    'ic_number' => $e->student?->ic_number ?? '-'
                ];
            });
        } elseif ($type === 'teacher') {
            $expectedUsers = User::where('school_id', $schoolId)->where('user_type', 'teacher')->where('is_active', true)->get()->map(function($u) {
                return ['id' => $u->user_id, 'name' => $u->full_name, 'class' => $u->position ?? 'Teacher', 'ic_number' => $u->ic_number];
            });
        } elseif ($type === 'staff') {
            $expectedUsers = User::where('school_id', $schoolId)->whereIn('user_type', ['staff', 'security_staff'])->where('is_active', true)->get()->map(function($u) {
                return ['id' => $u->user_id, 'name' => $u->full_name, 'class' => $u->position ?? 'Staff', 'ic_number' => $u->ic_number];
            });
        }

        $userIds = $expectedUsers->pluck('id')->toArray();

        // 2. Fetch Actual Logs
        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', $type)
            ->whereIn('user_id', $userIds)
            ->whereDate('date', $date)
            ->with('shift')
            ->get()
            ->keyBy('user_id');

        // 3. Map Data (Default to Absent if no log exists)
        $data = $expectedUsers->map(function ($user) use ($logs, $date, $type) {
            $log = $logs->get($user['id']);
            $status = $log?->status ?? 'absent';

            return [
                'id'           => $log->id ?? 'no-log-'.$user['id'], // Fake ID for React key if no log exists yet
                'user_type'    => $type,
                'user_id'      => $user['id'],
                'name'         => $user['name'],
                'class'        => $user['class'],
                'ic_number'    => $user['ic_number'],
                'date'         => Carbon::parse($date)->format('d/m/Y'),
                'check_in'     => $log?->check_in_time?->format('H:i:s'),
                'check_out'    => $log?->check_out_time?->format('H:i:s'),
                'status'       => strtolower($status),
                'scan_method'  => $log?->scan_method ?? '-',
                'reason'       => $log?->reason_manual,
                'shift'        => $log?->shift?->name,
            ];
        });

        // 4. Apply Status Filter if provided
        if ($request->status) {
            $data = $data->filter(fn($item) => $item['status'] === $request->status)->values();
        }

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    // ─── Teacher Dashboard ───────────────────────────────────────────────────

    public function teacherDashboard()
    {
        $user = auth()->user();

        if ($user->user_type !== 'teacher') {
            return response()->json([
                'message' => 'This endpoint is only available for teacher accounts.',
            ], 422);
        }

        $schoolId = $user->school_id;
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        $classroomIds = Classroom::where('school_id', $schoolId)
            ->where('user_id', $user->user_id)
            ->when($session, fn($q) => $q->where('school_session_id', $session->school_session_id))
            ->pluck('classroom_id');

        $totalStudents = $classroomIds->isEmpty() ? 0 : Enrollment::whereIn('classroom_id', $classroomIds)
            ->when($session, fn($q) => $q->where('school_session_id', $session->school_session_id))
            ->count();

        $today = Carbon::today()->toDateString();

        $logs = $classroomIds->isEmpty() ? collect() : AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', 'student')
            ->whereIn('classroom_id', $classroomIds)
            ->whereDate('date', $today)
            ->get();

        $presentToday = $logs->whereIn('status', ['present', 'late'])->count();

        $recent = $logs->sortByDesc('check_in_time')->take(8)->map(function ($log) {
            $student = Student::where('student_id', $log->user_id)->first();
            return [
                'name'      => $student?->name ?? 'Unknown',
                'status'    => $log->status,
                'time'      => $log->check_in_time?->format('H:i'),
                'timestamp' => $log->check_in_time?->timestamp,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_students' => $totalStudents,
                'present_today'  => $presentToday,
                'classes_count'  => $classroomIds->count(),
                'recent'         => $recent,
            ],
        ]);
    }

    // ─── My Attendance (self, Teacher / Security) ───────────────────────────

    public function myLog(Request $request)
    {
        $user = auth()->user();

        $userType = match (true) {
            $user->user_type === 'teacher' => 'teacher',
            in_array($user->user_type, ['staff', 'security_staff']) => 'staff',
            default => null,
        };

        if (!$userType) {
            return response()->json([
                'message' => 'Self attendance records are only available for teacher and staff accounts.',
            ], 422);
        }

        $query = AttendanceLog::where('school_id', $user->school_id)
            ->where('user_type', $userType)
            ->where('user_id', $user->user_id);

        if ($request->from) {
            $query->whereDate('date', '>=', $request->from);
        }
        if ($request->to) {
            $query->whereDate('date', '<=', $request->to);
        }

        $logs = $query->with('shift')->orderByDesc('date')->orderByDesc('check_in_time')->get();

        $data = $logs->map(function ($log) {
            return [
                'id'          => $log->id,
                'date'        => $log->date->format('d/m/Y'),
                'check_in'    => $log->check_in_time?->format('H:i:s'),
                'check_out'   => $log->check_out_time?->format('H:i:s'),
                'status'      => $log->status,
                'scan_method' => $log->scan_method,
                'shift'       => $log->shift?->name,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─── Dashboard Stats ─────────────────────────────────────────────────────

    public function getDashboard()
    {
        $schoolId = auth()->user()->school_id;
        $today    = Carbon::today()->toDateString();

        $logs = AttendanceLog::where('school_id', $schoolId)
            ->whereDate('date', $today)
            ->get();

        $present  = $logs->where('status', 'present')->count();
        $late     = $logs->where('status', 'late')->count();
        $absent   = $logs->where('status', 'absent')->count();
        $inSchool = $logs->whereNotNull('check_in_time')->whereNull('check_out_time')->count();

        $recent = $logs->sortByDesc('check_in_time')->take(10)->map(function ($log) {
            [$name, $class] = $this->resolveNameClass($log);
            return [
                'name'      => $name,
                'class'     => $class,
                'user_type' => $log->user_type,
                'status'    => $log->status,
                'time'      => $log->check_in_time?->format('H:i'),
                'timestamp' => $log->check_in_time?->timestamp,
            ];
        })->values();

        $todaysVisitors = Visitor::where('school_id', $schoolId)
            ->whereDate('created_at', $today)
            ->get();

        $recentVisitors = $todaysVisitors->sortByDesc('created_at')->take(10)->map(function ($v) {
            return [
                'name'      => $v->name,
                'class'     => 'Visitor',
                'user_type' => 'visitor',
                'status'    => $v->status === 'Checked Out' ? 'checked_out' : 'in_premise',
                'time'      => $v->created_at->format('H:i'),
                'timestamp' => $v->created_at->timestamp,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'date'            => Carbon::today()->format('d/m/Y'),
                'present'         => $present,
                'late'            => $late,
                'absent'          => $absent,
                'total'           => $present + $late + $absent,
                'in_school'       => $inSchool,
                'visitors_today'  => $todaysVisitors->count(),
                'recent'          => $recent,
                'recent_visitors' => $recentVisitors,
            ],
        ]);
    }

    // ─── Helper Methods ─────────────────────────────────────────────────────

    private function resolveByIc(string $ic, string $type, int $schoolId): array
    {
        return match ($type) {
            'student' => $this->resolveStudent($ic, $schoolId),
            'teacher' => $this->resolveTeacher($ic, $schoolId),
            'staff'   => $this->resolveStaff($ic, $schoolId),
            default   => [null, null, null, null],
        };
    }

    private function resolveStudent(string $ic, int $schoolId): array
    {
        $s = Student::where('school_id', $schoolId)->where('ic_number', $ic)->first();
        if (!$s) return [null, null, null, null];

        $className   = $this->getStudentClassName((int)$s->student_id, $schoolId);
        $classroomId = $this->getStudentClassroomId((int)$s->student_id, $schoolId);
        return [$s->student_id, $s->name, $className, $classroomId];
    }

    private function resolveTeacher(string $ic, int $schoolId): array
    {
        $t = User::where('school_id', $schoolId)->where('user_type', 'teacher')->where('ic_number', $ic)->first();
        return $t ? [$t->user_id, $t->full_name, 'Teacher', null] : [null, null, null, null];
    }

    private function resolveStaff(string $ic, int $schoolId): array
    {
        $s = User::where('school_id', $schoolId)->whereIn('user_type', ['staff', 'security_staff'])->where('ic_number', $ic)->first();
        return $s ? [$s->user_id, $s->full_name, 'Staff', null] : [null, null, null, null];
    }

    private function resolveStatus(int $schoolId, Carbon $now): string
    {
        $setting = $this->resolveActiveSetting($schoolId, $now);

        if (!$setting) return 'present';

        $time = $now->format('H:i:s');

        if ($time <= $setting->check_in_deadline) return 'present';

        if ($setting->absent_threshold) {
            if ($time <= $setting->absent_threshold) return 'late';
            return 'absent';
        }

        if ($time <= $setting->late_threshold) return 'late';
        return 'absent';
    }

    private function isSecurityStaff(string $userId): bool
    {
        return User::where('user_id', $userId)->where('user_type', 'security_staff')->exists();
    }

    /**
     * @return array{0: ?Shift, 1: ?string} [shift, errorMessage]. Both null means "no active
     * shifts configured for this school" — callers should fall back to the school-wide setting.
     */
    private function resolveCheckInShift(int $schoolId, ?int $shiftId): array
    {
        $hasActiveShifts = Shift::where('school_id', $schoolId)->where('is_active', true)->exists();
        if (!$hasActiveShifts) {
            return [null, null];
        }

        if (!$shiftId) {
            return [null, 'Please select a shift before checking in.'];
        }

        $shift = Shift::where('school_id', $schoolId)->where('is_active', true)->find($shiftId);
        if (!$shift) {
            return [null, 'Selected shift is not available.'];
        }

        return [$shift, null];
    }

    private function resolveShiftStatus(Shift $shift, Carbon $now): string
    {
        if (!$shift->is_overnight) {
            $time = $now->format('H:i:s');

            if ($time <= $shift->start_time) return 'present';
            if ($shift->late_threshold) {
                if ($time <= $shift->late_threshold) return 'late';
                return $shift->absent_threshold
                    ? ($time <= $shift->absent_threshold ? 'late' : 'absent')
                    : 'absent';
            }
            return 'late';
        }

        $elapsed  = $this->minutesSinceShiftStart($shift->start_time, $now);
        $lateAt   = $shift->late_threshold   ? $this->minutesBetween($shift->start_time, $shift->late_threshold)   : null;
        $absentAt = $shift->absent_threshold ? $this->minutesBetween($shift->start_time, $shift->absent_threshold) : null;

        if ($elapsed <= 0) return 'present';
        if ($lateAt !== null && $elapsed <= $lateAt) return 'late';
        if ($absentAt !== null) return $elapsed <= $absentAt ? 'late' : 'absent';
        return $lateAt !== null ? 'absent' : 'late';
    }

    // Minutes elapsed since an overnight shift's start, wrapping past midnight. Arrivals up to
    // an hour before the stated start are treated as "early for tonight's shift" rather than
    // wrapped into "very late for last night's" — the two are otherwise indistinguishable from
    // wall-clock time alone.
    private function minutesSinceShiftStart(string $start, Carbon $now): int
    {
        $diff = ($now->hour * 60 + $now->minute) - $this->toMinutes($start);
        return $diff >= -60 ? $diff : $diff + 1440;
    }

    private function minutesBetween(string $from, string $to): int
    {
        $diff = $this->toMinutes($to) - $this->toMinutes($from);
        return $diff < 0 ? $diff + 1440 : $diff;
    }

    private function toMinutes(string $time): int
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        return $h * 60 + $m;
    }

    public function resolveActiveSetting(int $schoolId, Carbon $date): ?AttendanceSetting
    {
        $override = AttendanceSettingOverride::where('school_id', $schoolId)
            ->whereDate('date', $date->toDateString())
            ->first();

        if ($override) {
            if (!$override->setting_id) return null;
            return AttendanceSetting::find($override->setting_id);
        }

        $dayOfWeek = $date->dayOfWeekIso;
        $all = AttendanceSetting::where('school_id', $schoolId)->get();

        foreach ($all as $s) {
            $days = $s->applies_to_days ?? [];
            if (in_array($dayOfWeek, $days)) {
                return $s;
            }
        }

        return $all->firstWhere('is_default', true);
    }

    private function resolveNameClass(AttendanceLog $log): array
    {
        return match ($log->user_type) {
            'student' => (function () use ($log) {
                $s = Student::where('student_id', $log->user_id)->first();
                if (!$s) return ['Unknown', '-'];
                $className = $log->classroom_id
                    ? (\App\Models\Classroom::find($log->classroom_id)?->name ?? '-')
                    : $this->getStudentClassName((int)$s->student_id, (int)$log->school_id);
                return [$s->name, $className];
            })(),
            'teacher' => (function () use ($log) {
                $t = User::where('user_id', $log->user_id)->where('user_type', 'teacher')->first();
                return [$t?->full_name ?? 'Unknown', 'Teacher'];
            })(),
            'staff' => (function () use ($log) {
                $s = User::where('user_id', $log->user_id)->whereIn('user_type', ['staff', 'security_staff'])->first();
                return [$s?->full_name ?? 'Unknown', 'Staff'];
            })(),
            default => ['Unknown', '-'],
        };
    }

    private function getStudentClassroomId(int $studentId, int $schoolId): ?int
    {
        $enrollment = Enrollment::where('student_id', $studentId)
            ->whereHas('schoolSession', fn($q) => $q->where('school_id', $schoolId)->where('is_active', true))
            ->first();

        return $enrollment?->classroom_id;
    }

    private function getStudentClassName(int $studentId, int $schoolId): string
    {
        $enrollment = Enrollment::where('student_id', $studentId)
            ->whereHas('schoolSession', fn($q) => $q->where('school_id', $schoolId)->where('is_active', true))
            ->with('classroom:classroom_id,name')
            ->first();

        return $enrollment?->classroom?->name ?? '-';
    }
}