<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    /**
     * GET /api/reports/classes
     * Returns classrooms for the active session (for the class dropdown).
     */
    public function getClasses()
    {
        $schoolId = auth()->user()->school_id;
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        $classes = Classroom::where('school_id', $schoolId)
            ->where('school_session_id', $session?->school_session_id)
            ->orderBy('name')
            ->get(['classroom_id', 'name']);

        return response()->json(['success' => true, 'data' => $classes]);
    }

    /**
     * GET /api/reports/attendance
     * Full attendance list for a date + optional class filter.
     * Returns every enrolled student with their status (absent if no log).
     */
    public function attendanceReport(Request $request)
    {
        $request->validate([
            'date'         => 'required|date',
            'classroom_id' => 'nullable|integer',
        ]);

        $schoolId = auth()->user()->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        // Get enrolled students, optionally filtered by class
        $enrollmentQuery = Enrollment::where('school_session_id', $session?->school_session_id)
            ->with(['student:student_id,name,ic_number', 'classroom:classroom_id,name']);

        if ($request->classroom_id) {
            $enrollmentQuery->where('classroom_id', $request->classroom_id);
        } else {
            $enrollmentQuery->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId)
                ->where('school_session_id', $session?->school_session_id));
        }

        $enrollments = $enrollmentQuery->get();

        // Fetch all logs for this date in one query
        $studentIds = $enrollments->pluck('student_id')->toArray();
        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', 'student')
            ->whereIn('user_id', $studentIds)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('user_id');

        // Determine if the absent threshold has passed for today
        $now             = \Illuminate\Support\Carbon::now();
        $isToday         = $date === $now->toDateString();
        $setting         = \App\Models\AttendanceSetting::where('school_id', $schoolId)
            ->where('is_default', true)
            ->first();
        $thresholdPassed = !$isToday // past dates always finalized
            || !$setting              // no setting = assume finalized
            || $now->format('H:i:s') >= $setting->absent_threshold ?? $setting->late_threshold ?? '23:59:59';

        $rows = $enrollments->map(function ($enrollment) use ($logs, $date, $thresholdPassed) {
            $log = $logs->get($enrollment->student_id);
            $status = $log?->status ?? ($thresholdPassed ? 'absent' : 'not_in');
            return [
                'student_id' => $enrollment->student_id,
                'name'       => $enrollment->student?->name ?? '-',
                'class'      => $enrollment->classroom?->name ?? '-',
                'date'       => Carbon::parse($date)->format('d-m-Y'),
                'status'     => $status,
                'check_in'   => $log?->check_in_time?->format('H:i') ?? '-',
                'check_out'  => $log?->check_out_time?->format('H:i') ?? '-',
            ];
        });

        $present = $rows->whereIn('status', ['present', 'late'])->count();
        $late    = $rows->where('status', 'late')->count();
        $absent  = $rows->where('status', 'absent')->count();
        $total   = $rows->count();
        return response()->json([
            'success' => true,
            'stats'   => compact('present', 'late', 'absent', 'total'),
            'data'    => $rows->values(),
        ]);
    }

    /**
     * GET /api/reports/monthly
     * Per-student monthly summary — total present/late/absent days.
     */
    public function monthlyReport(Request $request)
    {
        $request->validate([
            'month'        => 'required|date_format:Y-m',
            'classroom_id' => 'nullable|integer',
        ]);

        $schoolId = auth()->user()->school_id;
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        [$year, $month] = explode('-', $request->month);

        $enrollmentQuery = Enrollment::where('school_session_id', $session?->school_session_id)
            ->with(['student:student_id,name', 'classroom:classroom_id,name']);

        if ($request->classroom_id) {
            $enrollmentQuery->where('classroom_id', $request->classroom_id);
        } else {
            $enrollmentQuery->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId));
        }

        $enrollments = $enrollmentQuery->get();
        $studentIds  = $enrollments->pluck('student_id')->toArray();

        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', 'student')
            ->whereIn('user_id', $studentIds)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->groupBy('user_id');

        // Count school days in the month (Mon–Fri only, rough estimate)
        $schoolDays = $this->countSchoolDays((int)$year, (int)$month);

        $rows = $enrollments->map(function ($enrollment) use ($logs, $schoolDays) {
            $studentLogs = $logs->get($enrollment->student_id, collect());
            $present     = $studentLogs->where('status', 'present')->count();
            $late        = $studentLogs->where('status', 'late')->count();
            $absent      = $schoolDays - $present - $late;

            return [
                'student_id'  => $enrollment->student_id,
                'name'        => $enrollment->student?->name ?? '-',
                'class'       => $enrollment->classroom?->name ?? '-',
                'present'     => $present,
                'late'        => $late,
                'absent'      => max(0, $absent),
                'school_days' => $schoolDays,
                'rate'        => $schoolDays > 0
                    ? round((($present + $late) / $schoolDays) * 100, 1)
                    : 0,
            ];
        });

        // Chart data — daily totals for the month
        $chartData = [];
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayLogs = $logs->flatten()->filter(
                fn($l) => Carbon::parse($l->date)->day === $d
            );
            $chartData[] = [
                'day'     => $d,
                'present' => $dayLogs->whereIn('status', ['present', 'late'])->count(),
                'absent'  => count($studentIds) - $dayLogs->count(),
            ];
        }

        return response()->json([
            'success'   => true,
            'data'      => $rows->values(),
            'chartData' => $chartData,
        ]);
    }

    /**
     * GET /api/reports/summary
     * Per-class breakdown for a given date.
     */
    public function summaryReport(Request $request)
    {
        $request->validate(['date' => 'required|date']);

        $schoolId = auth()->user()->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        $classrooms = Classroom::where('school_id', $schoolId)
            ->where('school_session_id', $session?->school_session_id)
            ->with('teacher:teacher_id,name')
            ->orderBy('name')
            ->get();

        $rows = $classrooms->map(function ($classroom) use ($date, $session, $schoolId) {
            $studentIds = Enrollment::where('classroom_id', $classroom->classroom_id)
                ->where('school_session_id', $session?->school_session_id)
                ->pluck('student_id');

            $total = $studentIds->count();

            $logs = AttendanceLog::where('school_id', $schoolId)
                ->where('user_type', 'student')
                ->whereIn('user_id', $studentIds)
                ->whereDate('date', $date)
                ->get();

            $present = $logs->whereIn('status', ['present', 'late'])->count();
            $absent  = $total - $present;

            return [
                'classroom_id'   => $classroom->classroom_id,
                'class_name'     => $classroom->name,
                'teacher'        => $classroom->teacher?->name ?? '-',
                'total_students' => $total,
                'present'        => $present,
                'present_pct'    => $total > 0 ? round($present / $total * 100, 2) : 0,
                'absent'         => max(0, $absent),
                'absent_pct'     => $total > 0 ? round(max(0, $absent) / $total * 100, 2) : 0,
            ];
        });

        $totalPresent = $rows->sum('present');
        $totalAbsent  = $rows->sum('absent');

        return response()->json([
            'success' => true,
            'stats'   => ['present' => $totalPresent, 'absent' => $totalAbsent, 'total' => $rows->sum('total_students')],
            'data'    => $rows->values(),
        ]);
    }

    private function countSchoolDays(int $year, int $month): int
    {
        $days  = 0;
        $date  = Carbon::createFromDate($year, $month, 1);
        $end   = $date->copy()->endOfMonth();
        while ($date->lte($end)) {
            if ($date->isWeekday()) $days++;
            $date->addDay();
        }
        return $days;
    }
}
