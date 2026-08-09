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
use App\Models\EventAttendee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    public function getClasses(Request $request)
    {
        $user = auth()->user();
        $schoolId = $user->school_id;
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        $query = Classroom::where('school_id', $schoolId)
            ->where('school_session_id', $session?->school_session_id);

        // Allow bypassing the restriction if 'all_classes' is true
        if ($user->user_type === 'teacher' && !$request->boolean('all_classes')) {
            $query->where('user_id', $user->user_id);
        }

        $classes = $query->orderBy('name')->get(['classroom_id', 'name']);

        return response()->json(['success' => true, 'data' => $classes]);
    }

    public function attendanceReport(Request $request)
    {
        $request->validate([
            'date'         => 'required|date',
            'classroom_id' => 'nullable|integer',
            'type'         => 'nullable|in:student,teacher,staff'
        ]);

        $user = auth()->user();
        $schoolId = $user->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        $type     = $request->type ?? 'student';

        if ($user->user_type === 'teacher' && $type !== 'student') {
            // Return empty data if they try to hack the API
            return response()->json([
                'success' => true, 
                'stats' => ['present'=>0,'late'=>0,'absent'=>0,'total'=>0], 'data' => []
            ]);
        }

        $expectedUsers = collect();

        if ($type === 'student') {
            $enrollmentQuery = Enrollment::where('school_session_id', $session?->school_session_id)
                ->with(['student:student_id,name', 'classroom:classroom_id,name']); // Added 'ic_number' for attendanceReport if needed

            // RESTRICTION 2: Limit class queries for teachers
            if ($user->user_type === 'teacher') {
                $teacherClassIds = Classroom::where('user_id', $user->user_id)->pluck('classroom_id')->toArray();
                
                if ($request->classroom_id) {
                    // Prevent them from querying another teacher's class ID
                    if (!in_array($request->classroom_id, $teacherClassIds)) {
                        return response()->json(['success' => true, 'stats' => ['present'=>0,'late'=>0,'absent'=>0,'total'=>0], 'data' => []]);
                    }
                    $enrollmentQuery->where('classroom_id', $request->classroom_id);
                } else {
                    $enrollmentQuery->whereIn('classroom_id', $teacherClassIds);
                }
            } else {
                // Admin/Security logic (Unchanged)
                if ($request->classroom_id) {
                    $enrollmentQuery->where('classroom_id', $request->classroom_id);
                } else {
                    $enrollmentQuery->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId));
                }
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

        $user = auth()->user();
        $schoolId = $user->school_id;
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        [$year, $month] = explode('-', $request->month);
        $type = $request->type ?? 'student';

        // RESTRICTION 1: Block teachers from viewing other teachers or staff
        if ($user->user_type === 'teacher' && $type !== 'student') {
            // Return empty data if they try to hack the API
            return response()->json(['success' => true, 'stats' => ['present'=>0,'late'=>0,'absent'=>0,'total'=>0], 'data' => []]);
        }

        $expectedUsers = collect();

        if ($type === 'student') {
            $enrollmentQuery = Enrollment::where('school_session_id', $session?->school_session_id)
                ->with(['student:student_id,name', 'classroom:classroom_id,name']); // Added 'ic_number' for attendanceReport if needed

            // RESTRICTION 2: Limit class queries for teachers
            if ($user->user_type === 'teacher') {
                $teacherClassIds = Classroom::where('user_id', $user->user_id)->pluck('classroom_id')->toArray();
                
                if ($request->classroom_id) {
                    // Prevent them from querying another teacher's class ID
                    if (!in_array($request->classroom_id, $teacherClassIds)) {
                        return response()->json(['success' => true, 'stats' => ['present'=>0,'late'=>0,'absent'=>0,'total'=>0], 'data' => []]);
                    }
                    $enrollmentQuery->where('classroom_id', $request->classroom_id);
                } else {
                    $enrollmentQuery->whereIn('classroom_id', $teacherClassIds);
                }
            } else {
                // Admin/Security logic (Unchanged)
                if ($request->classroom_id) {
                    $enrollmentQuery->where('classroom_id', $request->classroom_id);
                } else {
                    $enrollmentQuery->whereHas('classroom', fn($q) => $q->where('school_id', $schoolId));
                }
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

        $user = auth()->user();
        $schoolId = $user->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $session  = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();

        $query = Classroom::where('school_id', $schoolId)
            ->where('school_session_id', $session?->school_session_id)
            ->with('user:user_id,first_name,last_name');

        // RESTRICTION: If teacher, only fetch their assigned classes
        if ($user->user_type === 'teacher') {
            $query->where('user_id', $user->user_id);
        }

        $classrooms = $query->orderBy('name')->get();

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
                    $s = Student::where('student_id', $log->user_id)->first();
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

    public function getEvents()
    {
        $schoolId = auth()->user()->school_id;
        $events = Event::where('school_id', $schoolId)
            ->orderBy('event_date', 'desc')
            ->get(['event_id as id', 'name', 'event_date as date']);

        return response()->json(['success' => true, 'data' => $events]);
    }

    // Present-only semantics: events have no fixed roster, so the report lists
    // who checked in — no "absent" count is computed.
    public function eventReport(Request $request)
    {
        $request->validate([
            'event_id' => 'required|integer',
        ]);

        $schoolId = auth()->user()->school_id;
        $event    = Event::where('school_id', $schoolId)
            ->where('event_id', $request->event_id)
            ->first();

        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Event not found.'], 404);
        }

        $eventDate = $event->event_date->format('d-m-Y');

        $data = EventAttendee::where('event_id', $event->event_id)
            ->orderBy('check_in_time')
            ->get()
            ->map(function ($a) use ($schoolId, $eventDate) {
                [$name, $class] = $this->resolveAttendeeNameClass($a->user_type, $a->user_id, $schoolId);

                return [
                    'user_type' => $a->user_type,
                    'name'      => $name,
                    'class'     => $class,
                    'date'      => $eventDate,
                    'time_in'   => $a->check_in_time->format('H:i'),
                    'time_out'  => '-', // event attendance is check-in only
                ];
            });

        return response()->json([
            'success' => true,
            'stats'   => ['present' => $data->count()],
            'data'    => $data,
        ]);
    }

    private function resolveAttendeeNameClass(string $type, string $userId, int $schoolId): array
    {
        if ($type === 'student') {
            $s = Student::where('student_id', $userId)->first();
            $enrollment = Enrollment::where('student_id', $userId)
                ->whereHas('schoolSession', fn($q) => $q->where('school_id', $schoolId)->where('is_active', true))
                ->with('classroom:classroom_id,name')
                ->first();
            return [$s?->name ?? 'Unknown', $enrollment?->classroom?->name ?? '-'];
        }

        if ($type === 'teacher') {
            $t = User::where('user_id', $userId)->where('user_type', 'teacher')->first();
            return [$t?->full_name ?? 'Unknown', 'Teacher'];
        }

        $s = User::where('user_id', $userId)->whereIn('user_type', ['staff', 'security_staff'])->first();
        return [$s?->full_name ?? 'Unknown', 'Staff'];
    }

    // ========================================================================
    // PARENT STUDENT REPORT LOGIC 
    // ========================================================================
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
        
        // Stop generating "absent" tags for future dates that haven't happened yet
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
                    'reason' => $log->reason_manual ?? '-', 
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

        // Add any stray logs (e.g. they somehow scanned on a weekend/holiday)
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
                    'reason' => $log->reason_manual ?? '-',
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
                'present' => $present,
                'late' => $late,
                'absent' => $absent,
            ],
            'logs' => $finalSortedLogs
        ]);
    }
}