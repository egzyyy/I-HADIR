<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Event;
use App\Models\EventAttendee;
use App\Models\SchoolSession;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id;

        $events = Event::where('school_id', $schoolId)
            ->orderBy('event_date', 'desc')
            ->get()
            ->map(fn($e) => $this->formatEvent($e));

        return response()->json(['success' => true, 'data' => $events]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'event_date'        => 'required|date',
            'event_time'        => 'nullable|date_format:H:i',
            'location'          => 'nullable|string|max:255',
            'description'       => 'nullable|string',
            'participant_types' => 'required|array|min:1',
            'participant_types.*' => 'in:teacher,student,staff,parent,vip',
            'banner'            => 'nullable|image|max:10240',
        ]);

        $schoolId = auth()->user()->school_id;

        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->firstOrFail();

        $bannerPath = null;
        if ($request->hasFile('banner')) {
            $bannerPath = $request->file('banner')->store('events', 'public');
        }

        $event = Event::create([
            'school_id'         => $schoolId,
            'school_session_id' => $activeSession->school_session_id,
            'name'              => $request->name,
            'description'       => $request->description,
            'event_date'        => $request->event_date,
            'event_time'        => $request->event_time,
            'location'          => $request->location,
            'banner_path'       => $bannerPath,
            'participant_types' => $request->participant_types,
            'is_active'         => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully!',
            'data'    => $this->formatEvent($event),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'event_date'        => 'required|date',
            'event_time'        => 'nullable|date_format:H:i',
            'location'          => 'nullable|string|max:255',
            'description'       => 'nullable|string',
            'participant_types' => 'required|array|min:1',
            'participant_types.*' => 'in:teacher,student,staff,parent,vip', 
            'banner'            => 'nullable|image|max:10240',
        ]);

        $schoolId = auth()->user()->school_id;
        $event    = Event::where('school_id', $schoolId)
            ->where('event_id', $id)
            ->firstOrFail();

        $bannerPath = $event->banner_path;

        // 1. Check if the frontend sent the flag to remove the image
        if ($request->has('remove_banner') && $request->remove_banner == '1') {
            if ($bannerPath) {
                Storage::disk('public')->delete($bannerPath);
            }
            $bannerPath = null;
        }

        // 2. Process new upload (if any)
        if ($request->hasFile('banner')) {
            // Delete old banner if exists
            if ($bannerPath) {
                Storage::disk('public')->delete($bannerPath);
            }
            $bannerPath = $request->file('banner')->store('events', 'public');
        }

        $event->update([
            'name'              => $request->name,
            'description'       => $request->description,
            'event_date'        => $request->event_date,
            'event_time'        => $request->event_time,
            'location'          => $request->location,
            'banner_path'       => $bannerPath,
            'participant_types' => $request->participant_types,
        ]);

        return response()->json(['success' => true, 'message' => 'Event updated successfully!']);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $event    = Event::where('school_id', $schoolId)
            ->where('event_id', $id)
            ->firstOrFail();

        if ($event->banner_path) {
            Storage::disk('public')->delete($event->banner_path);
        }

        $event->update(['is_active' => false]);
        $event->delete();

        return response()->json(['success' => true, 'message' => 'Event deleted successfully!']);
    }

    // ─── Event attendance scanning ───────────────────────────────────────────

    public function scanAttendance(Request $request, $id)
    {
        $request->validate([
            'ic_number' => 'required|string',
            'user_type' => 'required|in:student,teacher,staff',
        ]);

        $schoolId = auth()->user()->school_id;
        $event    = Event::where('school_id', $schoolId)
            ->where('event_id', $id)
            ->where('is_active', true)
            ->first();

        if (!$event) {
            return response()->json(['message' => 'Event not found.'], 404);
        }

        // Only types the event was declared for can be scanned in.
        if (!in_array($request->user_type, $event->participant_types ?? [])) {
            return response()->json([
                'message' => "This event does not include {$request->user_type}s as participants.",
            ], 422);
        }

        [$userId, $name, $class] = $this->resolveByIc(
            $request->ic_number,
            $request->user_type,
            $schoolId
        );

        if (!$userId) {
            return response()->json(['message' => "No {$request->user_type} found with that IC number."], 404);
        }

        $existing = EventAttendee::where('event_id', $event->event_id)
            ->where('user_type', $request->user_type)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            return response()->json([
                'message'   => 'Already checked in to this event.',
                'name'      => $name,
                'class'     => $class,
                'time'      => $existing->check_in_time->format('H:i:s'),
                'duplicate' => true,
            ], 409);
        }

        $now = Carbon::now();

        EventAttendee::create([
            'event_id'      => $event->event_id,
            'user_type'     => $request->user_type,
            'user_id'       => $userId,
            'check_in_time' => $now,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event attendance recorded.',
            'name'    => $name,
            'class'   => $class,
            'time'    => $now->format('H:i:s'),
        ]);
    }

    // Same IC-resolution pattern used by AttendanceController/FacilityController.
    private function resolveByIc(string $ic, string $type, int $schoolId): array
    {
        return match ($type) {
            'student' => (function () use ($ic, $schoolId) {
                $s = Student::where('school_id', $schoolId)->where('ic_number', $ic)->first();
                if (!$s) return [null, null, null];

                $enrollment = Enrollment::where('student_id', $s->student_id)
                    ->whereHas('schoolSession', fn($q) => $q->where('school_id', $schoolId)->where('is_active', true))
                    ->with('classroom:classroom_id,name')
                    ->first();

                return [$s->student_id, $s->name, $enrollment?->classroom?->name ?? '-'];
            })(),
            'teacher' => (function () use ($ic, $schoolId) {
                $t = User::where('school_id', $schoolId)->where('user_type', 'teacher')->where('ic_number', $ic)->first();
                return $t ? [$t->user_id, $t->full_name, 'Teacher'] : [null, null, null];
            })(),
            'staff' => (function () use ($ic, $schoolId) {
                $s = User::where('school_id', $schoolId)->whereIn('user_type', ['staff', 'security_staff'])->where('ic_number', $ic)->first();
                return $s ? [$s->user_id, $s->full_name, 'Staff'] : [null, null, null];
            })(),
            default => [null, null, null],
        };
    }

    private function formatEvent(Event $event): array
    {
        return [
            'id'               => $event->event_id,
            'name'             => $event->name,
            'date'             => $event->event_date->format('d/m/Y'),
            'time'             => $event->event_time ? substr($event->event_time, 0, 5) : null,
            'spot'             => $event->location ?? '-',
            'description'      => $event->description,
            'participantTypes' => $event->participant_types ?? [],
            'bannerUrl'        => $event->banner_path ? Storage::url($event->banner_path) : null,
        ];
    }

    // 1. ADD THIS NEW METHOD to search for the Parent by IC
    public function checkParentIc(Request $request)
    {
        $request->validate(['ic_number' => 'required|string']);
        
        $schoolId = auth()->user()->school_id;
        
        // Clean IC and make dashed version (Dash-proof logic)
        $cleanIc = preg_replace('/[^0-9]/', '', $request->ic_number);
        $dashedIc = strlen($cleanIc) === 12 
            ? substr($cleanIc, 0, 6) . '-' . substr($cleanIc, 6, 2) . '-' . substr($cleanIc, 8, 4) 
            : null;

        // Find any students belonging to this IC
        $students = Student::where('school_id', $schoolId)
            ->where(function($q) use ($request, $cleanIc, $dashedIc) {
                $q->where('father_ic', $request->ic_number)
                  ->orWhere('mother_ic', $request->ic_number)
                  ->orWhere('father_ic', $cleanIc)
                  ->orWhere('mother_ic', $cleanIc);
                if ($dashedIc) {
                    $q->orWhere('father_ic', $dashedIc)->orWhere('mother_ic', $dashedIc);
                }
            })->get();

        if ($students->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No records of children found for this IC Number.'], 404);
        }

        // Extract parent details from the first matched student
        $firstStudent = $students->first();
        $isFather = $firstStudent->father_ic === $cleanIc || $firstStudent->father_ic === $dashedIc || $firstStudent->father_ic === $request->ic_number;
        
        $parentName = $isFather ? $firstStudent->father_name : $firstStudent->mother_name;
        $parentPhone = $isFather ? $firstStudent->father_phone_num : $firstStudent->mother_phone_num;

        return response()->json([
            'success' => true,
            'parent_name' => $parentName,
            'parent_phone' => $parentPhone,
            'children' => $students->map(fn($s) => ['id' => $s->student_id, 'name' => $s->name])
        ]);
    }

    // 2. UPDATE your existing manualRegistration method
    public function manualRegistration(Request $request, $id)
    {
        $request->validate([
            'user_type'  => 'required|string',
            'name'       => 'required|string|max:255',
            'ic_number'  => 'nullable|string',
            'department' => 'nullable|string|required_if:user_type,vip',
            'position'   => 'nullable|string|required_if:user_type,vip',
            'phone'      => 'nullable|string',
            'email'      => 'nullable|email',
            'children'   => 'nullable|array', // Accept array of child names
        ]);

        $schoolId = auth()->user()->school_id;
        $event    = Event::where('school_id', $schoolId)
            ->where('event_id', $id)
            ->where('is_active', true)
            ->firstOrFail();

        if (!in_array($request->user_type, $event->participant_types ?? [])) {
            return response()->json(['message' => "This event does not allow {$request->user_type}s."], 422);
        }

        $userId = null;
        if ($request->ic_number && in_array($request->user_type, ['student', 'teacher', 'staff'])) {
            [$resolvedUserId, $resolvedName, $resolvedClass] = $this->resolveByIc($request->ic_number, $request->user_type, $schoolId);
            if ($resolvedUserId) {
                $userId = $resolvedUserId;
            }
        }

        $query = EventAttendee::where('event_id', $event->event_id)->where('user_type', $request->user_type);
        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->where('name', $request->name);
        }

        if ($query->first()) {
            return response()->json(['message' => 'This participant is already checked in to this event.'], 409);
        }

        // --- Cleverly format Parent Data into existing columns ---
        $department = $request->department;
        $position = $request->position;
        
        if ($request->user_type === 'parent') {
            $department = 'Ibu Bapa / Penjaga';
            $childrenStr = is_array($request->children) && count($request->children) > 0 
                ? implode(', ', $request->children) 
                : 'No children found';
            $position = $childrenStr;
        }

        EventAttendee::create([
            'event_id'      => $event->event_id,
            'user_type'     => $request->user_type,
            'user_id'       => $userId,
            'name'          => $request->name,
            'ic_number'     => $request->ic_number,
            'department'    => $department,
            'position'      => $position,
            'phone_number'  => $request->phone,
            'email'         => $request->email,
            'check_in_time' => Carbon::now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Manual registration successful.']);
    }

    // ─── Fetch Unregistered Participants for Dropdown ──────────────────────────
    public function getUnregisteredParticipants($id, Request $request)
    {
        $schoolId = auth()->user()->school_id;
        $type = $request->query('type'); // 'student', 'teacher', 'staff'
        
        // Get already registered user IDs for this event & type
        $registeredUserIds = EventAttendee::where('event_id', $id)
            ->where('user_type', $type)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->toArray();

        $data = [];

        if ($type === 'student') {
            $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
            if ($session) {
                $data = Student::where('school_id', $schoolId)
                    ->whereHas('enrollments', function ($q) use ($session) {
                        $q->where('school_session_id', $session->school_session_id);
                    })
                    ->whereNotIn('student_id', $registeredUserIds)
                    ->orderBy('name')
                    ->get(['student_id as id', 'name', 'ic_number']);
            }
        } elseif ($type === 'teacher') {
            $data = User::where('school_id', $schoolId)
                ->where('user_type', 'teacher')
                ->where('is_active', true)
                ->whereNotIn('user_id', $registeredUserIds)
                ->get()
                ->sortBy('first_name')
                ->values()
                ->map(fn($u) => ['id' => $u->user_id, 'name' => $u->full_name, 'ic_number' => $u->ic_number]);
        } elseif ($type === 'staff') {
            $data = User::where('school_id', $schoolId)
                ->whereIn('user_type', ['staff', 'security_staff'])
                ->where('is_active', true)
                ->whereNotIn('user_id', $registeredUserIds)
                ->get()
                ->sortBy('first_name')
                ->values()
                ->map(fn($u) => ['id' => $u->user_id, 'name' => $u->full_name, 'ic_number' => $u->ic_number]);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─── Fetch Event Attendees ───────────────────────────────────────────────
    public function getAttendees($id)
    {
        $schoolId = auth()->user()->school_id;
        $event = Event::where('school_id', $schoolId)->where('event_id', $id)->firstOrFail();

        $attendees = EventAttendee::where('event_id', $id)
            ->orderBy('check_in_time', 'desc')
            ->get();

        $studentIds = $attendees->where('user_type', 'student')->whereNotNull('user_id')->pluck('user_id')->toArray();
        $teacherIds = $attendees->where('user_type', 'teacher')->whereNotNull('user_id')->pluck('user_id')->toArray();
        $staffIds   = $attendees->where('user_type', 'staff')->whereNotNull('user_id')->pluck('user_id')->toArray();

        $students = Student::whereIn('student_id', $studentIds)->get()->keyBy('student_id');
        $teachers = User::whereIn('user_id', $teacherIds)->get()->keyBy('user_id');
        $staffs   = User::whereIn('user_id', $staffIds)->get()->keyBy('user_id');

        $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        $enrollments = collect();
        if ($session && count($studentIds) > 0) {
            $enrollments = \App\Models\Enrollment::whereIn('student_id', $studentIds)
                ->where('school_session_id', $session->school_session_id)
                ->with('classroom:classroom_id,name')
                ->get()
                ->keyBy('student_id');
        }

        // Fetch Children Details for Parents
        $parentIcs = $attendees->where('user_type', 'parent')->pluck('ic_number')->filter()->unique()->toArray();
        $parentChildren = [];
        
        if (!empty($parentIcs)) {
            $children = Student::where('school_id', $schoolId)
                ->where(function($q) use ($parentIcs) {
                    $q->whereIn('father_ic', $parentIcs)->orWhereIn('mother_ic', $parentIcs);
                })->get();
                
            $childIds = $children->pluck('student_id')->toArray();
            $childEnrollments = collect();
            if ($session && count($childIds) > 0) {
                $childEnrollments = \App\Models\Enrollment::whereIn('student_id', $childIds)
                    ->where('school_session_id', $session->school_session_id)
                    ->with('classroom:classroom_id,name')
                    ->get()
                    ->keyBy('student_id');
            }

            foreach ($children as $child) {
                $cData = [
                    'name' => $child->name,
                    'ic' => $child->ic_number,
                    'class' => $childEnrollments->has($child->student_id) && $childEnrollments[$child->student_id]->classroom ? $childEnrollments[$child->student_id]->classroom->name : 'No Class'
                ];
                if (in_array($child->father_ic, $parentIcs)) $parentChildren[$child->father_ic][] = $cData;
                if (in_array($child->mother_ic, $parentIcs)) $parentChildren[$child->mother_ic][] = $cData;
            }
        }

        $data = $attendees->map(function ($a) use ($students, $teachers, $staffs, $enrollments, $parentChildren) {
            $name = $a->name; 
            $ic = $a->ic_number ?? '-';
            $className = '-';
            $phone = $a->phone_number ?? '-'; // Base fallback

            if ($a->user_id) {
                if ($a->user_type === 'student' && $students->has($a->user_id)) {
                    $name = $students[$a->user_id]->name;
                    $ic = $students[$a->user_id]->ic_number ?? $ic;
                    $className = $enrollments->has($a->user_id) && $enrollments[$a->user_id]->classroom ? $enrollments[$a->user_id]->classroom->name : 'No Class';
                } elseif ($a->user_type === 'teacher' && $teachers->has($a->user_id)) {
                    $name = $teachers[$a->user_id]->full_name;
                    $ic = $teachers[$a->user_id]->ic_number ?? $ic;
                    $phone = $teachers[$a->user_id]->phone_num ?? $teachers[$a->user_id]->phone_number ?? $phone; // Auto fetch phone
                } elseif ($a->user_type === 'staff' && $staffs->has($a->user_id)) {
                    $name = $staffs[$a->user_id]->full_name;
                    $ic = $staffs[$a->user_id]->ic_number ?? $ic;
                    $phone = $staffs[$a->user_id]->phone_num ?? $staffs[$a->user_id]->phone_number ?? $phone; // Auto fetch phone
                }
            }

            return [
                'id'               => $a->id,
                'name'             => $name ?? 'Unknown',
                'ic_number'        => $ic,
                'user_type'        => $a->user_type,
                'class_name'       => $className,
                'department'       => $a->department ?? '-',
                'position'         => $a->position ?? '-',
                'phone_number'     => $phone, // Returns the newly mapped phone number
                'email'            => $a->email ?? '-',
                'check_in_time'    => $a->check_in_time->format('h:i A'),
                'check_in_date'    => $a->check_in_time->format('d/m/Y'),
                'children_details' => $a->user_type === 'parent' && isset($parentChildren[$ic]) ? $parentChildren[$ic] : []
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
