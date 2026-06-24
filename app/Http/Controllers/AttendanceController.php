<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendanceSetting;
use App\Models\AttendanceSettingOverride;
use App\Models\SchoolSession;
use App\Models\Student;
use App\Models\User;
use App\Models\Classroom;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceController extends Controller
{
    // ─── Check In ────────────────────────────────────────────────────────────

    public function checkIn(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string',
            'user_type' => 'required|in:student,teacher,staff',
        ]);

        $schoolId = auth()->user()->school_id;
        $today    = Carbon::today()->toDateString();

        [$userId, $name, $class, $classroomId] = $this->resolveByIc(
            $request->ic_number,
            $request->user_type,
            $schoolId
        );

        if (!$userId) {
            return response()->json(['message' => 'Person not found with that IC number.'], 404);
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

        // Reject check-in on school-closed / holiday days
        $activeSetting = $this->resolveActiveSetting($schoolId, $now);
        $override = AttendanceSettingOverride::where('school_id', $schoolId)
            ->whereDate('date', $now->toDateString())
            ->first();
        if ($override && !$override->setting_id) {
            return response()->json([
                'message' => 'School is closed today' . ($override->note ? " ({$override->note})" : '') . '. No attendance recorded.',
            ], 403);
        }

        $session = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        $status = $this->resolveStatus($schoolId, $now);

        $log = AttendanceLog::updateOrCreate(
            ['user_type' => $request->user_type, 'user_id' => $userId, 'date' => $today],
            [
                'school_id'         => $schoolId,
                'school_session_id' => $session?->school_session_id,
                'classroom_id'      => $classroomId,
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

        $schoolId = auth()->user()->school_id;
        $today    = Carbon::today()->toDateString();

        [$userId, $name, $class] = $this->resolveByIc(
            $request->ic_number,
            $request->user_type,
            $schoolId
        );

        if (!$userId) {
            return response()->json(['message' => 'Person not found with that IC number.'], 404);
        }

        $log = AttendanceLog::where('user_type', $request->user_type)
            ->where('user_id', $userId)
            ->where('date', $today)
            ->first();

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
            return response()->json(['message' => 'Person not found with that IC number.'], 404);
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
        $status  = $this->resolveStatus($schoolId, $now);

        $log = AttendanceLog::updateOrCreate(
            ['user_type' => $request->user_type, 'user_id' => $userId, 'date' => $today],
            [
                'school_id'         => $schoolId,
                'school_session_id' => $session?->school_session_id,
                'classroom_id'      => $classroomId,
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
            'reason'    => $request->reason,
            'check_in'  => $now->format('d-m-Y H:i'),
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
            'check_out' => $now->format('d-m-Y H:i'),
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
                    'id'    => $e->student_id,
                    'name'  => $e->student?->name ?? '-',
                    'class' => $e->classroom?->name ?? '-'
                ];
            });
        } elseif ($type === 'teacher') {
            $expectedUsers = User::where('school_id', $schoolId)->where('user_type', 'teacher')->where('is_active', true)->get()->map(function($u) {
                return ['id' => $u->user_id, 'name' => $u->full_name, 'class' => $u->position ?? 'Teacher'];
            });
        } elseif ($type === 'staff') {
            $expectedUsers = User::where('school_id', $schoolId)->whereIn('user_type', ['staff', 'security_staff'])->where('is_active', true)->get()->map(function($u) {
                return ['id' => $u->user_id, 'name' => $u->full_name, 'class' => $u->position ?? 'Staff'];
            });
        }

        $userIds = $expectedUsers->pluck('id')->toArray();

        // 2. Fetch Actual Logs
        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', $type)
            ->whereIn('user_id', $userIds)
            ->whereDate('date', $date)
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
                'date'         => Carbon::parse($date)->format('d-m-Y'),
                'check_in'     => $log?->check_in_time?->format('H:i:s'),
                'check_out'    => $log?->check_out_time?->format('H:i:s'),
                'status'       => strtolower($status),
                'scan_method'  => $log?->scan_method ?? '-',
                'reason'       => $log?->reason_manual,
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

    // ─── Dashboard Stats ─────────────────────────────────────────────────────

    public function getDashboard()
    {
        $schoolId = auth()->user()->school_id;
        $today    = Carbon::today()->toDateString();

        $logs = AttendanceLog::where('school_id', $schoolId)
            ->whereDate('date', $today)
            ->get();

        $present = $logs->where('status', 'present')->count();
        $late    = $logs->where('status', 'late')->count();
        $absent  = $logs->where('status', 'absent')->count();

        $recent = $logs->sortByDesc('check_in_time')->take(10)->map(function ($log) {
            [$name, $class] = $this->resolveNameClass($log);
            return [
                'name'      => $name,
                'class'     => $class,
                'user_type' => $log->user_type,
                'status'    => $log->status,
                'time'      => $log->check_in_time?->format('H:i'),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'date'    => Carbon::today()->format('d/m/Y'),
                'present' => $present,
                'late'    => $late,
                'absent'  => $absent,
                'total'   => $present + $late + $absent,
                'recent'  => $recent,
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