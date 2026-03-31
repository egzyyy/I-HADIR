<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\AttendanceSetting;
use App\Models\SchoolSession;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
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

        [$userId, $name, $class] = $this->resolveByIc(
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

        $session = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        $now    = Carbon::now();
        $status = $this->resolveStatus($schoolId, $now);

        $log = AttendanceLog::updateOrCreate(
            ['user_type' => $request->user_type, 'user_id' => $userId, 'date' => $today],
            [
                'school_id'         => $schoolId,
                'school_session_id' => $session?->school_session_id,
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
            return response()->json([
                'message'   => 'Already checked out today.',
                'name'      => $name,
                'class'     => $class,
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

    // ─── Manual Entry ────────────────────────────────────────────────────────

    public function manualEntry(Request $request)
    {
        $request->validate([
            'date'    => 'required|date',
            'records' => 'required|array|min:1',
            'records.*.user_type' => 'required|in:student,teacher,staff',
            'records.*.user_id'   => 'required|string',
            'records.*.status'    => 'required|in:present,late,absent',
        ]);

        $schoolId  = auth()->user()->school_id;
        $adminId   = auth()->user()->user_id ?? auth()->id();
        $session   = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        foreach ($request->records as $record) {
            AttendanceLog::updateOrCreate(
                [
                    'user_type' => $record['user_type'],
                    'user_id'   => $record['user_id'],
                    'date'      => $request->date,
                ],
                [
                    'school_id'         => $schoolId,
                    'school_session_id' => $session?->school_session_id,
                    'status'            => $record['status'],
                    'check_in_time'     => $record['status'] !== 'absent' ? $request->date . ' 00:00:00' : null,
                    'scan_method'       => 'manual',
                    'scanned_by'        => $adminId,
                ]
            );
        }

        return response()->json(['success' => true, 'message' => 'Attendance recorded.']);
    }

    // ─── Get Log ─────────────────────────────────────────────────────────────

    public function getLog(Request $request)
    {
        $schoolId = auth()->user()->school_id;

        $query = AttendanceLog::where('school_id', $schoolId);

        if ($request->date) {
            $query->whereDate('date', $request->date);
        }
        if ($request->user_type) {
            $query->where('user_type', $request->user_type);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $logs = $query->orderBy('check_in_time', 'desc')
            ->paginate($request->per_page ?? 50);

        $data = $logs->map(function ($log) {
            [$name, $class] = $this->resolveNameClass($log);
            return [
                'id'           => $log->id,
                'user_type'    => $log->user_type,
                'user_id'      => $log->user_id,
                'name'         => $name,
                'class'        => $class,
                'date'         => $log->date->format('d-m-Y'),
                'check_in'     => $log->check_in_time?->format('H:i:s'),
                'check_out'    => $log->check_out_time?->format('H:i:s'),
                'status'       => $log->status,
                'scan_method'  => $log->scan_method,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
            'total'   => $logs->total(),
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
                'date'    => Carbon::today()->format('d-m-Y'),
                'present' => $present,
                'late'    => $late,
                'absent'  => $absent,
                'total'   => $present + $late + $absent,
                'recent'  => $recent,
            ],
        ]);
    }

    // ─── Manual Single Entry (for Manual Entry page) ─────────────────────────

    public function manualCheckIn(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string',
            'user_type' => 'required|in:student,teacher,staff',
            'reason'    => 'nullable|string|max:255',
        ]);

        $schoolId = auth()->user()->school_id;
        $today    = Carbon::today()->toDateString();
        $adminId  = auth()->user()->user_id ?? auth()->id();

        [$userId, $name, $class] = $this->resolveByIc(
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

        $log = AttendanceLog::updateOrCreate(
            ['user_type' => $request->user_type, 'user_id' => $userId, 'date' => $today],
            [
                'school_id'         => $schoolId,
                'school_session_id' => $session?->school_session_id,
                'check_in_time'     => $now,
                'status'            => 'present',
                'scan_method'       => 'manual',
                'scanned_by'        => $adminId,
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
            'status'    => 'present',
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
            'scan_method'    => 'manual',
        ]);

        return response()->json([
            'success'   => true,
            'check_out' => $now->format('d-m-Y H:i'),
        ]);
    }

    private function resolveByIc(string $ic, string $type, int $schoolId): array
    {
        return match ($type) {
            'student' => $this->resolveStudent($ic, $schoolId),
            'teacher' => $this->resolveTeacher($ic, $schoolId),
            'staff'   => $this->resolveStaff($ic, $schoolId),
            default   => [null, null, null],
        };
    }

    private function resolveStudent(string $ic, int $schoolId): array
    {
        $s = Student::where('school_id', $schoolId)->where('ic_number', $ic)->first();
        return $s ? [$s->student_id, $s->name, $s->class ?? '-'] : [null, null, null];
    }

    private function resolveTeacher(string $ic, int $schoolId): array
    {
        $t = Teacher::where('school_id', $schoolId)->where('ic_number', $ic)->first();
        return $t ? [$t->teacher_id, $t->name, 'Teacher'] : [null, null, null];
    }

    private function resolveStaff(string $ic, int $schoolId): array
    {
        $s = Staff::where('school_id', $schoolId)->where('ic_number', $ic)->first();
        return $s ? [$s->staff_id, $s->name, 'Staff'] : [null, null, null];
    }

    private function resolveStatus(int $schoolId, Carbon $now): string
    {
        $setting = AttendanceSetting::where('school_id', $schoolId)
            ->where('is_default', true)
            ->first();

        if (!$setting) return 'present';

        $time = $now->format('H:i:s');

        if ($time <= $setting->check_in_deadline) return 'present';
        if ($time <= $setting->late_threshold)    return 'late';
        return 'absent';
    }

    private function resolveNameClass(AttendanceLog $log): array
    {
        return match ($log->user_type) {
            'student' => (function () use ($log) {
                $s = Student::where('student_id', $log->user_id)->first();
                return [$s?->name ?? 'Unknown', $s?->class ?? '-'];
            })(),
            'teacher' => (function () use ($log) {
                $t = Teacher::where('teacher_id', $log->user_id)->first();
                return [$t?->name ?? 'Unknown', 'Teacher'];
            })(),
            'staff' => (function () use ($log) {
                $s = Staff::where('staff_id', $log->user_id)->first();
                return [$s?->name ?? 'Unknown', 'Staff'];
            })(),
            default => ['Unknown', '-'],
        };
    }
}
