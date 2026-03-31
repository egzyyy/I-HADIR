<?php

namespace App\Http\Controllers;

use App\Models\FacilityLog;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FacilityController extends Controller
{
    public function checkIn(Request $request)
    {
        $request->validate([
            'ic_number'     => 'required|string',
            'user_type'     => 'required|in:student,teacher,staff',
            'facility_type' => 'required|in:prayer,pss,ict,activity',
        ]);

        $schoolId = auth()->user()->school_id;
        $today    = Carbon::today()->toDateString();
        $now      = Carbon::now();

        [$userId, $name, $class] = $this->resolveByIc(
            $request->ic_number,
            $request->user_type,
            $schoolId
        );

        if (!$userId) {
            return response()->json(['message' => 'Person not found with that IC number.'], 404);
        }

        // Allow multiple facility visits per day — only block if already checked in but not yet out
        $active = FacilityLog::where('school_id', $schoolId)
            ->where('user_type', $request->user_type)
            ->where('user_id', $userId)
            ->where('facility_type', $request->facility_type)
            ->whereDate('date', $today)
            ->whereNull('check_out_time')
            ->first();

        if ($active) {
            return response()->json([
                'message'   => 'Already checked in to this facility. Please check out first.',
                'name'      => $name,
                'class'     => $class,
                'time'      => $active->check_in_time->format('H:i:s'),
                'duplicate' => true,
            ], 409);
        }

        $log = FacilityLog::create([
            'school_id'     => $schoolId,
            'user_type'     => $request->user_type,
            'user_id'       => $userId,
            'facility_type' => $request->facility_type,
            'date'          => $today,
            'check_in_time' => $now,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Facility check-in recorded.',
            'name'    => $name,
            'class'   => $class,
            'time'    => $now->format('H:i:s'),
        ]);
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'ic_number'     => 'required|string',
            'user_type'     => 'required|in:student,teacher,staff',
            'facility_type' => 'required|in:prayer,pss,ict,activity',
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

        $log = FacilityLog::where('school_id', $schoolId)
            ->where('user_type', $request->user_type)
            ->where('user_id', $userId)
            ->where('facility_type', $request->facility_type)
            ->whereDate('date', $today)
            ->whereNull('check_out_time')
            ->latest('check_in_time')
            ->first();

        if (!$log) {
            return response()->json(['message' => 'No active check-in found for this facility today.'], 404);
        }

        $now = Carbon::now();
        $log->update(['check_out_time' => $now]);

        return response()->json([
            'success'  => true,
            'message'  => 'Facility check-out recorded.',
            'name'     => $name,
            'class'    => $class,
            'time'     => $now->format('H:i:s'),
            'duration' => $log->check_in_time->diffInMinutes($now) . ' min',
        ]);
    }

    public function getLog(Request $request)
    {
        $request->validate([
            'facility_type' => 'required|in:prayer,pss,ict,activity',
        ]);

        $schoolId = auth()->user()->school_id;

        $query = FacilityLog::where('school_id', $schoolId)
            ->where('facility_type', $request->facility_type);

        if ($request->date) {
            $query->whereDate('date', $request->date);
        }

        $logs = $query->orderBy('check_in_time', 'desc')->get();

        $data = $logs->map(function ($log) {
            [$name, $class] = $this->resolveNameClass($log->user_type, $log->user_id);
            return [
                'id'        => $log->id,
                'name'      => $name,
                'class'     => $class,
                'user_type' => $log->user_type,
                'check_in'  => $log->check_in_time->format('H:i:s'),
                'check_out' => $log->check_out_time?->format('H:i:s'),
                'duration'  => $log->check_out_time
                    ? $log->check_in_time->diffInMinutes($log->check_out_time) . ' min'
                    : null,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

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

    private function resolveNameClass(string $type, string $userId): array
    {
        return match ($type) {
            'student' => (function () use ($userId) {
                $s = Student::where('student_id', $userId)->first();
                return [$s?->name ?? 'Unknown', $s?->class ?? '-'];
            })(),
            'teacher' => (function () use ($userId) {
                $t = Teacher::where('teacher_id', $userId)->first();
                return [$t?->name ?? 'Unknown', 'Teacher'];
            })(),
            'staff' => (function () use ($userId) {
                $s = Staff::where('staff_id', $userId)->first();
                return [$s?->name ?? 'Unknown', 'Staff'];
            })(),
            default => ['Unknown', '-'],
        };
    }
}
