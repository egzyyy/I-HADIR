<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use App\Models\AttendanceSettingOverride;
use App\Models\Student;
use App\Models\User;
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

    /**
     * Daily Attendance Report
     * Now supports 'type' parameter to dynamically fetch Students, Teachers, or Staff
     */
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

        // 1. Fetch expected users based on type
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

        // 2. Fetch logs
        $userIds = $expectedUsers->pluck('id')->toArray();
        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', $type)
            ->whereIn('user_id', $userIds)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('user_id');

        // 3. Map Data (If no log exists, immediately mark as 'absent')
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

        // 4. Calculate Stats Accurately
        $present = $rows->where('status', 'present')->count();
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
     * Monthly Report (Infographics)
     */
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

        // 1. Fetch Expected Users
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

        // 2. Fetch Logs
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
                // Make sure late count is factored into the presence rate
                'rate'        => $schoolDays > 0 ? round((($present + $late) / $schoolDays) * 100, 1) : 0,
            ];
        });

        $chartData = [];
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayLogs = $logs->flatten()->filter(fn($l) => Carbon::parse($l->date)->day === $d);
            $chartData[] = [
                'day'     => $d,
                'present' => $dayLogs->where('status', 'present')->count() + $dayLogs->where('status', 'late')->count(),
                'absent'  => count($userIds) - $dayLogs->count(),
            ];
        }

        return response()->json([
            'success'   => true,
            'data'      => $rows->values(),
            'chartData' => $chartData,
        ]);
    }

    /**
     * Summary Report
     * Remains strictly for classes (Students only)
     */
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

            // Include Late in Present Count for Summary
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
        $request->validate([
            'ic_number' => 'required|string',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer',
        ]);

        $student = Student::where('ic_number', $request->ic_number)->first();

        if (!$student) {
            return response()->json(['success' => false, 'message' => 'No student found with this IC Number.'], 404);
        }

        $schoolId = $student->school_id;

        $logs = AttendanceLog::where('school_id', $schoolId)
            ->where('user_type', 'student')
            ->where('user_id', $student->student_id)
            ->whereYear('date', $request->year)
            ->whereMonth('date', $request->month)
            ->get()
            ->keyBy(fn($log) => Carbon::parse($log->date)->toDateString());

        $overrides = AttendanceSettingOverride::where('school_id', $schoolId)
            ->whereYear('date', $request->year)
            ->whereMonth('date', $request->month)
            ->get();
        
        $closedDates = $overrides->whereNull('setting_id')->pluck('date')->map(fn($d) => Carbon::parse($d)->toDateString())->toArray();
        $openDates = $overrides->whereNotNull('setting_id')->pluck('date')->map(fn($d) => Carbon::parse($d)->toDateString())->toArray();

        $formattedLogs = collect();
        $present = 0;
        $late = 0;
        $absent = 0;

        $loopDate = Carbon::createFromDate($request->year, $request->month, 1);
        $endOfMonth = $loopDate->copy()->endOfMonth();
        $today = Carbon::now('Asia/Kuala_Lumpur')->startOfDay(); 
        
        $capDate = $endOfMonth->greaterThan($today) ? $today->copy() : $endOfMonth->copy();

        while ($loopDate->lte($capDate)) {
            $dateStr = $loopDate->toDateString();
            $isOpen = in_array($dateStr, $openDates);
            $isClosed = in_array($dateStr, $closedDates);
            $isSchoolDay = $isOpen || ($loopDate->isWeekday() && !$isClosed);

            if ($logs->has($dateStr)) {
                $log = $logs->get($dateStr);
                $status = strtolower($log->status);
                
                if ($status === 'late') $late++;
                elseif ($status === 'present') $present++;
                else $absent++;

                $formattedLogs->push([
                    'raw_date' => $dateStr, 
                    'date' => $loopDate->format('d M Y'),
                    'attendance' => ucfirst($log->status),
                    'timeIn' => $log->check_in_time ? Carbon::parse($log->check_in_time)->format('h:i A') : '-',
                    'timeOut' => $log->check_out_time ? Carbon::parse($log->check_out_time)->format('h:i A') : '-',
                    'reason' => $log->reason ?? '-',
                ]);
            } elseif ($isSchoolDay) {
                $absent++;
                $formattedLogs->push([
                    'raw_date' => $dateStr,
                    'date' => $loopDate->format('d M Y'),
                    'attendance' => 'Absent',
                    'timeIn' => '-',
                    'timeOut' => '-',
                    'reason' => '-',
                ]);
            }
            $loopDate->addDay();
        }

        foreach ($logs as $dateStr => $log) {
            if (!$formattedLogs->contains('raw_date', $dateStr)) {
                $status = strtolower($log->status);
                if ($status === 'late') $late++;
                elseif ($status === 'present') $present++;
                else $absent++;

                $logDate = Carbon::parse($dateStr);
                $formattedLogs->push([
                    'raw_date' => $dateStr,
                    'date' => $logDate->format('d M Y'),
                    'attendance' => ucfirst($log->status),
                    'timeIn' => $log->check_in_time ? Carbon::parse($log->check_in_time)->format('h:i A') : '-',
                    'timeOut' => $log->check_out_time ? Carbon::parse($log->check_out_time)->format('h:i A') : '-',
                    'reason' => $log->reason ?? '-',
                ]);
            }
        }

        $finalSortedLogs = $formattedLogs->sortByDesc('raw_date')->values()->map(function($item) {
            unset($item['raw_date']);
            return $item;
        });

        return response()->json([
            'success' => true,
            'student' => [
                'name' => $student->name,
                'ic_number' => $student->ic_number,
            ],
            'stats' => [
                'present' => $present + $late,
                'absent' => $absent,
                'late' => $late,
            ],
            'logs' => $finalSortedLogs
        ]);
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
}