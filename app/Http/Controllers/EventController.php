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
            'participant_types.*' => 'in:teacher,student,staff,parent',
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
            'participant_types.*' => 'in:teacher,student,staff,parent',
            'banner'            => 'nullable|image|max:10240',
        ]);

        $schoolId = auth()->user()->school_id;
        $event    = Event::where('school_id', $schoolId)
            ->where('event_id', $id)
            ->firstOrFail();

        $bannerPath = $event->banner_path;
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
            'date'             => $event->event_date->format('d-m-Y'),
            'time'             => $event->event_time ? substr($event->event_time, 0, 5) : null,
            'spot'             => $event->location ?? '-',
            'description'      => $event->description,
            'participantTypes' => $event->participant_types ?? [],
            'bannerUrl'        => $event->banner_path ? Storage::url($event->banner_path) : null,
        ];
    }
}
