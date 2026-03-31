<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SchoolSession;
use Illuminate\Http\Request;
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
