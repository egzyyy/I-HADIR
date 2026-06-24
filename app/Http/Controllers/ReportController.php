<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use App\Models\AttendanceSettingOverride;
use App\Models\Student;
use App\Models\User;
use App\Models\FacilityLog;
use App\Models\Visitor;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
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

    public function attendanceReport(Request $request)
    {
        $request->validate([
            'date'         => 'required|date',
            'classroom_id' => 'nullable|integer',
            'type'         => 'nullable|in:student,teacher,staff'
        ]);

        $schoolId = auth()->user()->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        $type     = $request->type ?? 'student';

        $expectedUsers = collect();

        if ($type === 'student') {
            $enrollmentQuery = Enrollment::where('school_session_id', $session?->school_session_id)
                ->with(['student:student_id,name,ic_number', 'classroom:classroom_id,name']);

            if ($request->classroom_id) {
                $enrollmentQuery->where('classroom_id', $request->classroom_id);
            } else {
                $enrollmentQuery->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId)
                    ->where('school_session_id', $session?->school_session_id));
            }

            $expectedUsers = $enrollmentQuery->get()->map(function($e) {
                return [
                    'id' => $e->student_id,
                    'name' => $e->student?->name ?? '-',
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
        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', $type)
            ->whereIn('user_id', $userIds)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('user_id');

        $rows = $expectedUsers->map(function ($user) use ($logs, $date) {
            $log = $logs->get($user['id']);
            $status = $log?->status ?? 'absent';
            
            return [
                'student_id' => $user['id'],
                'name'       => $user['name'],
                'class'      => $user['class'],
                'date'       => Carbon::parse($date)->format('d-m-Y'),
                'status'     => strtolower($status),
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

    public function monthlyReport(Request $request)
    {
        $request->validate([
            'month'        => 'required|date_format:Y-m',
            'classroom_id' => 'nullable|integer',
            'type'         => 'nullable|in:student,teacher,staff'
        ]);

        $schoolId = auth()->user()->school_id;
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        [$year, $month] = explode('-', $request->month);
        $type = $request->type ?? 'student';

        $expectedUsers = collect();

        if ($type === 'student') {
            $enrollmentQuery = Enrollment::where('school_session_id', $session?->school_session_id)
                ->with(['student:student_id,name', 'classroom:classroom_id,name']);

            if ($request->classroom_id) {
                $enrollmentQuery->where('classroom_id', $request->classroom_id);
            } else {
                $enrollmentQuery->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId));
            }

            $expectedUsers = $enrollmentQuery->get()->map(function($e) {
                return ['id' => $e->student_id, 'name' => $e->student?->name ?? '-', 'class' => $e->classroom?->name ?? '-'];
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

        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', $type)
            ->whereIn('user_id', $userIds)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->groupBy('user_id');

        $schoolDays = $this->countSchoolDays((int)$year, (int)$month);

        $rows = $expectedUsers->map(function ($user) use ($logs, $schoolDays) {
            $studentLogs = $logs->get($user['id'], collect());
            $present     = $studentLogs->where('status', 'present')->count();
            $late        = $studentLogs->where('status', 'late')->count();
            $absent      = max(0, $schoolDays - $present - $late);

            return [
                'student_id'  => $user['id'],
                'name'        => $user['name'],
                'class'       => $user['class'],
                'present'     => $present,
                'late'        => $late,
                'absent'      => $absent,
                'school_days' => $schoolDays,
                'rate'        => $schoolDays > 0 ? round((($present + $late) / $schoolDays) * 100, 1) : 0,
            ];
        });

        $chartData = [];
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayLogs = $logs->flatten()->filter(fn($l) => Carbon::parse($l->date)->day === $d);
            $chartData[] = [
                'day'     => $d,
                'present' => $dayLogs->whereIn('status', ['present', 'late'])->count(),
                'absent'  => count($userIds) - $dayLogs->count(),
            ];
        }

        return response()->json([
            'success'   => true,
            'data'      => $rows->values(),
            'chartData' => $chartData,
        ]);
    }

    public function summaryReport(Request $request)
    {
        $request->validate(['date' => 'required|date']);

        $schoolId = auth()->user()->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        $classrooms = Classroom::where('school_id', $schoolId)
            ->where('school_session_id', $session?->school_session_id)
            ->with('user:user_id,first_name,last_name')
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
                'teacher'        => $classroom->user?->full_name ?? '-',
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

    public function parentStudentReport(Request $request)
    {
        // Keep your existing parentStudentReport logic...
    }

    private function countSchoolDays(int $year, int $month): int
    {
        $start = Carbon::createFromDate($year, $month, 1);
        $end = $start->copy()->endOfMonth();
        $today = Carbon::now('Asia/Kuala_Lumpur')->startOfDay(); 
        $end = $end->greaterThan($today) ? $today : $end;
        $days = 0;
        while ($start->lte($end)) {
            if ($start->isWeekday()) $days++;
            $start->addDay();
        }
        return $days;
    }

    // ========================================================================
    // NEW: GENERAL REPORTS ENDPOINTS (FACILITY, VISITOR, EVENT)
    // ========================================================================

    /**
     * General Facility / RMT Report
     */
    public function facilityReport(Request $request)
    {
        $request->validate([
            'date'          => 'required|date',
            'facility_type' => 'required|string',
            'classroom_id'  => 'nullable|integer',
        ]);

        $schoolId = auth()->user()->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $facility = strtolower($request->facility_type);
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        // If a specific class is selected, we calculate Present/Absent based on all students in that class.
        if ($request->classroom_id) {
            $enrollments = Enrollment::where('school_session_id', $session?->school_session_id)
                ->where('classroom_id', $request->classroom_id)
                ->with(['student:student_id,name', 'classroom:classroom_id,name'])
                ->get();

            $studentIds = $enrollments->pluck('student_id')->toArray();

            $logs = FacilityLog::where('school_id', $schoolId)
                ->where('facility_type', $facility)
                ->whereDate('date', $date)
                ->where('user_type', 'student')
                ->whereIn('user_id', $studentIds)
                ->get()
                ->keyBy('user_id');

            $rows = $enrollments->map(function($e) use ($logs, $date) {
                $log = $logs->get($e->student_id);
                return [
                    'name'     => $e->student?->name ?? '-',
                    'class'    => $e->classroom?->name ?? '-',
                    'date'     => Carbon::parse($date)->format('d-m-Y'),
                    'time_in'  => $log?->check_in_time?->format('H:i:s A') ?? '-',
                    'time_out' => $log?->check_out_time?->format('H:i:s A') ?? '-',
                    'status'   => $log ? 'present' : 'absent',
                ];
            });

            $present = $rows->where('status', 'present')->count();
            $absent  = $rows->where('status', 'absent')->count();

            return response()->json([
                'success' => true,
                'stats'   => ['present' => $present, 'absent' => $absent],
                'data'    => $rows->values()
            ]);
        } 
        
        // If NO class is selected, we just dump all logs of people who successfully checked in.
        else {
            $logs = FacilityLog::where('school_id', $schoolId)
                ->where('facility_type', $facility)
                ->whereDate('date', $date)
                ->orderBy('check_in_time', 'desc')
                ->get();

            $rows = $logs->map(function($log) use ($schoolId) {
                $name = 'Unknown';
                $class = '-';
                if ($log->user_type === 'student') {
                    $s = Student::find($log->user_id);
                    $name = $s?->name ?? 'Unknown';
                    $e = Enrollment::where('student_id', $log->user_id)->with('classroom')->first();
                    $class = $e?->classroom?->name ?? '-';
                } elseif ($log->user_type === 'teacher') {
                    $t = User::where('user_id', $log->user_id)->where('user_type', 'teacher')->first();
                    $name = $t?->full_name ?? 'Unknown';
                    $class = 'Teacher';
                } elseif ($log->user_type === 'staff') {
                    $s = User::where('user_id', $log->user_id)->whereIn('user_type', ['staff', 'security_staff'])->first();
                    $name = $s?->full_name ?? 'Unknown';
                    $class = 'Staff';
                }

                return [
                    'name'     => $name,
                    'class'    => $class,
                    'date'     => Carbon::parse($log->date)->format('d-m-Y'),
                    'time_in'  => $log->check_in_time?->format('H:i:s A') ?? '-',
                    'time_out' => $log->check_out_time?->format('H:i:s A') ?? '-',
                    'status'   => 'present',
                ];
            });

            return response()->json([
                'success' => true,
                'stats'   => ['present' => $rows->count(), 'absent' => 0],
                'data'    => $rows
            ]);
        }
    }

    /**
     * General Visitor Report (Monthly)
     */
    public function visitorReport(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year'  => 'nullable|integer'
        ]);

        $schoolId = auth()->user()->school_id;
        $year = $request->year ?? Carbon::now()->year;

        $visitors = Visitor::where('school_id', $schoolId)
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $request->month)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($v) {
                return [
                    'id'    => $v->visitor_id,
                    'name'  => $v->name,
                    'phone' => $v->phone_number,
                    'dept'  => $v->person_to_meet,
                    'note'  => $v->notes ?? '-',
                    'date'  => $v->created_at->format('d/m/Y'),
                    'time'  => $v->created_at->format('h:i:s A'),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $visitors
        ]);
    }

    /**
     * Get Events for Dropdown
     */
    public function getEvents()
    {
        $schoolId = auth()->user()->school_id;
        $events = Event::where('school_id', $schoolId)
            ->orderBy('event_date', 'desc')
            ->get(['event_id as id', 'name', 'event_date as date']);

        return response()->json(['success' => true, 'data' => $events]);
    }

    /**
     * General Event Attendance Report (Placeholder/Scaffolding)
     */
    public function eventReport(Request $request)
    {
        $request->validate([
            'event_id' => 'required|integer',
        ]);
        
        // Return empty for now as requested (event attendance feature is pending)
        return response()->json([
            'success' => true,
            'stats'   => ['present' => 0, 'absent' => 0],
            'data'    => []
        ]);
    }
}