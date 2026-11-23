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
use App\Models\VisitorLog;
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
            'user_type'     => 'nullable|in:all,student,teacher,staff,visitor',
        ]);

        $schoolId = auth()->user()->school_id;
        $date     = Carbon::parse($request->date)->toDateString();
        $facility = strtolower($request->facility_type);
        $userType = strtolower($request->query('user_type', 'all'));
        $session  = SchoolSession::where('school_id',$schoolId)->where('is_active', true)->first();

        // Class-level student report (shows Present & Absent for the chosen class)
        if ($request->classroom_id && in_array($userType, ['all', 'student'])) {
            $enrollments = Enrollment::where('school_session_id',$session?->school_session_id)
                ->where('classroom_id', $request->classroom_id)
                ->with(['student:student_id,name', 'classroom:classroom_id,name'])
                ->get();

            $studentIds =$enrollments->pluck('student_id')->toArray();

            $logs = FacilityLog::where('school_id',$schoolId)
                ->where('facility_type', $facility)
                ->whereDate('date', $date)
                ->where('user_type', 'student')
                ->whereIn('user_id', $studentIds)
                ->get()
                ->keyBy('user_id');

            $rows =$enrollments->map(function ($e) use ($logs, $date) {$log = $logs->get($e->student_id);
                return [
                    'name'     => $e->student?->name ?? '-',
                    'class'    => $e->classroom?->name ?? '-',
                    'date'     => Carbon::parse($date)->format('d/m/Y'),
                    'time_in'  => $log?->check_in_time?->format('h:i:s A') ?? '-',
                    'time_out' => $log?->check_out_time?->format('h:i:s A') ?? '-',
                    'status'   => $log ? 'present' : 'absent',
                ];
            });

            $present =$rows->where('status', 'present')->count();
            $absent  =$rows->where('status', 'absent')->count();

            return response()->json([
                'success' => true,
                'stats'   => ['present' => $present, 'absent' =>$absent],
                'data'    => $rows->values(),
            ]);
        }

        // General / Filtered-by-User-Type Facility Logs
        $query = FacilityLog::where('school_id',$schoolId)
            ->where('facility_type', $facility)
            ->whereDate('date', $date);

        if ($userType &&$userType !== 'all') {
            $query->where('user_type',$userType);
        }

        $logs =$query->orderBy('check_in_time', 'desc')->get();

        $rows = $logs->map(function ($log) {
            $name  = 'Unknown';$class = '-';

            if ($log->user_type === 'student') {
                $s     = Student::where('student_id',$log->user_id)->first();
                $name  =$s?->name ?? 'Unknown';
                $e     = Enrollment::where('student_id',$log->user_id)->with('classroom')->first();
                $class =$e?->classroom?->name ?? '-';
            } elseif ($log->user_type === 'teacher') {
                $t     = User::where('user_id',$log->user_id)->where('user_type', 'teacher')->first();
                $name  =$t?->full_name ?? 'Unknown';
                $class =$t?->position ?: 'Teacher';
            } elseif ($log->user_type === 'staff') {
                $s     = User::where('user_id',$log->user_id)->whereIn('user_type', ['staff', 'security_staff'])->first();
                $name  =$s?->full_name ?? 'Unknown';
                $class =$s?->position ?: 'Staff';
            } elseif ($log->user_type === 'visitor') {
                $v     = Visitor::where('visitor_id',$log->user_id)->first();
                $name  =$v?->name ?? 'Unknown Visitor';
                $class = 'Visitor';
            }

            return [
                'name'     => $name,
                'class'    => $class,
                'date'     => Carbon::parse($log->date)->format('d/m/Y'),
                'time_in'  => $log->check_in_time?->format('h:i:s A') ?? '-',
                'time_out' => $log->check_out_time?->format('h:i:s A') ?? '-',
                'status'   => 'present',
            ];
        });

        return response()->json([
            'success' => true,
            'stats'   => ['present' => $rows->count(), 'absent' => 0], 'data'    =>$rows->values(),
        ]);
    }

    public function visitorReport(Request $request)
    {
        $request->validate([
            'month'    => 'required|integer|min:1|max:12',
            'year'     => 'nullable|integer',
            'location' => 'nullable|in:entrance,prayer,pss,ict',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        $year     = (int) ($request->year ?? Carbon::now('Asia/Kuala_Lumpur')->year);
        $month    = (int) $request->month;
        $location = strtolower($request->query('location', 'entrance'));

        $appTz       = config('app.timezone', 'UTC');
        $startMonth  = Carbon::create($year, $month, 1, 0, 0, 0, 'Asia/Kuala_Lumpur')->timezone($appTz);
        $endMonth    = Carbon::create($year, $month, 1, 0, 0, 0, 'Asia/Kuala_Lumpur')->endOfMonth()->timezone($appTz);
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $dayCounts   = array_fill(1, $daysInMonth, 0);

        // Facility Visitor Report (Surau / Prayer, PSS, ICT)
        if (in_array($location, ['prayer', 'pss', 'ict'])) {
            $facilityLogs = FacilityLog::where('school_id', $schoolId)
                ->where('user_type', 'visitor')
                ->where('facility_type', $location)
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->orderByDesc('check_in_time')
                ->get();

            $visitorIds = $facilityLogs->pluck('user_id')->unique()->values();

            $visitorsMap = Visitor::whereIn('visitor_id', $visitorIds)
                ->get()
                ->keyBy('visitor_id');

            $visitLogsByVisitor = VisitorLog::where('school_id', $schoolId)
                ->whereIn('visitor_id', $visitorIds)
                ->orderByDesc('check_in_time')
                ->get()
                ->groupBy('visitor_id');

            $visitors = $facilityLogs->map(function ($log) use ($visitorsMap, $visitLogsByVisitor, &$dayCounts) {
                $visitor = $visitorsMap->get($log->user_id);
                $rawIn   = $log->check_in_time ?? $log->created_at;
                $timeIn  = $rawIn ? Carbon::parse($rawIn)->timezone('Asia/Kuala_Lumpur') : null;
                $timeOut = $log->check_out_time ? Carbon::parse($log->check_out_time)->timezone('Asia/Kuala_Lumpur') : null;

                if ($timeIn && isset($dayCounts[$timeIn->day])) {
                    $dayCounts[$timeIn->day]++;
                }

                $candidateLogs = $visitLogsByVisitor->get($log->user_id, collect());
                $matchedVisit  = $candidateLogs->first(function ($vLog) use ($timeIn) {
                    $vRaw  = $vLog->check_in_time ?? $vLog->created_at;
                    $vDate = $vRaw ? Carbon::parse($vRaw)->timezone('Asia/Kuala_Lumpur')->toDateString() : null;
                    return $timeIn && $vDate === $timeIn->toDateString();
                }) ?? $candidateLogs->first();

                return [
                    'id'        => $log->id,
                    'ic_number' => $visitor?->ic_number ?? '-',
                    'name'      => $visitor?->name ?? 'Unknown Visitor',
                    'phone'     => $matchedVisit?->phone_number ?? '-',
                    'category'  => $matchedVisit?->category ?? '-', // <-- ADD THIS
                    'dept'      => '-',
                    'note'      => $matchedVisit?->notes ?? '-',
                    'date_in'   => $timeIn ? $timeIn->format('d/m/Y') : '-',
                    'time_in'   => $timeIn ? $timeIn->format('h:i:s A') : '-',
                    'date_out'  => $timeOut ? $timeOut->format('d/m/Y') : '-',
                    'time_out'  => $timeOut ? $timeOut->format('h:i:s A') : '-',
                ];
            });

            $chartData = [];
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $chartData[] = [
                    'day'    => $d,
                    'visits' => $dayCounts[$d],
                ];
            }

            return response()->json([
                'success'   => true,
                'data'      => $visitors->values(),
                'chartData' => $chartData,
            ]);
        }

        // Default: School Entrance Visitor Report
        $visitors = VisitorLog::with('visitor')
            ->where('school_id', $schoolId)
            ->where(function ($q) use ($startMonth, $endMonth) {
                $q->whereBetween('check_in_time', [$startMonth, $endMonth])
                  ->orWhere(function ($q2) use ($startMonth, $endMonth) {
                      $q2->whereNull('check_in_time')
                         ->whereBetween('created_at', [$startMonth, $endMonth]);
                  });
            })
            ->orderByDesc('check_in_time')
            ->orderByDesc('id')
            ->get()
            ->map(function ($log) use (&$dayCounts) {
                $rawIn   = $log->check_in_time ?? $log->created_at;
                $timeIn  = $rawIn ? Carbon::parse($rawIn)->timezone('Asia/Kuala_Lumpur') : null;
                $timeOut = $log->check_out_time ? Carbon::parse($log->check_out_time)->timezone('Asia/Kuala_Lumpur') : null;

                if ($timeIn && isset($dayCounts[$timeIn->day])) {
                    $dayCounts[$timeIn->day]++;
                }

                return [
                    'id'        => $log->id,
                    'ic_number' => $log->visitor?->ic_number ?? '-',
                    'name'      => $log->visitor?->name ?? 'Unknown',
                    'phone'     => $log->phone_number ?? '-',
                    'category'  => $log->category ?? '-',
                    'dept'      => $log->person_to_meet ?? '-',
                    'purpose'   => $log->purpose ?? '-', 
                    'note'      => $log->notes ?? '-',
                    'date_in'   => $timeIn ? $timeIn->format('d/m/Y') : '-',
                    'time_in'   => $timeIn ? $timeIn->format('h:i:s A') : '-',
                    'date_out'  => $timeOut ? $timeOut->format('d/m/Y') : '-',
                    'time_out'  => $timeOut ? $timeOut->format('h:i:s A') : '-',
                ];
            });

        $chartData = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $chartData[] = [
                'day'    => $d,
                'visits' => $dayCounts[$d],
            ];
        }

        return response()->json([
            'success'   => true,
            'data'      => $visitors->values(),
            'chartData' => $chartData,
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
        $requireParentVerification = !auth()->check() || $request->exists('parent_ic');

        $request->validate([
            'ic_number' => 'required|string',
            'parent_ic' => $requireParentVerification ? 'required|string' : 'nullable|string',
            'month'     => 'required|integer|min:1|max:12',
            'year'      => 'required|integer',
        ]);

        // Normalize Student IC (supports both dashed and non-dashed formats in DB)
        $cleanStudentIc = preg_replace('/[^0-9]/', '', $request->ic_number);
        $dashedStudentIc = strlen($cleanStudentIc) === 12
            ? substr($cleanStudentIc, 0, 6) . '-' . substr($cleanStudentIc, 6, 2) . '-' . substr($cleanStudentIc, 8, 4)
            : null;

        $student = Student::where(function ($q) use ($request, $cleanStudentIc, $dashedStudentIc) {
            $q->where('ic_number', $request->ic_number)
              ->orWhere('ic_number', $cleanStudentIc);
            if ($dashedStudentIc) {
                $q->orWhere('ic_number', $dashedStudentIc);
            }
        })->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'No student found with this IC number.',
            ], 404);
        }

        // Verify Parent IC alignment against father_ic or mother_ic
        if ($requireParentVerification) {
            $cleanParentIc = preg_replace('/[^0-9]/', '', (string) $request->parent_ic);
            $cleanFatherIc = preg_replace('/[^0-9]/', '', (string) $student->father_ic);
            $cleanMotherIc = preg_replace('/[^0-9]/', '', (string) $student->mother_ic);

            if (
                empty($cleanParentIc) ||
                ($cleanParentIc !== $cleanFatherIc && $cleanParentIc !== $cleanMotherIc)
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent IC and Student IC are not aligned. Please check both IC numbers.',
                ], 403);
            }
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