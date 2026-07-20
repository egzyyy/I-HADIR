<?php

namespace App\Http\Controllers;

use App\Models\CoCurricular;
use App\Models\Event;
use App\Models\School;
use App\Models\SchoolProfile;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Public, unauthenticated endpoints backing the marketing/landing pages.
 * Every other /api/* route assumes auth()->user(); these must never.
 * Only schools with a slug set are exposed here.
 */
class PublicController extends Controller
{
    public function schools()
    {
        $schools = School::whereNotNull('slug')
            ->where('is_active', true)
            ->get()
            ->map(fn($s) => [
                'slug'  => $s->slug,
                'name'  => $s->name,
                'city'  => $s->city,
                'state' => $s->state,
            ]);

        return response()->json(['success' => true, 'data' => $schools]);
    }

    public function show($slug)
    {
        $school = $this->findBySlug($slug);
        if (!$school) {
            return response()->json(['success' => false, 'message' => 'School not found'], 404);
        }

        $profile = SchoolProfile::where('school_id', $school->school_id)->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'slug'    => $school->slug,
                'name'    => $school->name,
                'city'    => $school->city,
                'state'   => $school->state,
                // Admin-managed landing copy; nulls mean "use the frontend default".
                'profile' => [
                    'tagline'          => $profile?->tagline,
                    'established_year' => $profile?->established_year,
                    'about'            => $profile?->about,
                    'vision'           => $profile?->vision,
                    'mission'          => $profile?->mission,
                    'organization'     => $profile?->organization ?? [],
                ],
                'stats' => [
                    'students'       => Student::where('school_id', $school->school_id)
                        ->where('is_active', true)->count(),
                    'teachers'       => User::where('school_id', $school->school_id)
                        ->where('user_type', 'teacher')->count(),
                    'co_curriculars' => CoCurricular::where('school_id', $school->school_id)
                        ->where('is_active', true)->count(),
                ],
            ],
        ]);
    }

    public function events($slug)
    {
        $school = $this->findBySlug($slug);
        if (!$school) {
            return response()->json(['success' => false, 'message' => 'School not found'], 404);
        }

        $events = Event::where('school_id', $school->school_id)
            ->where('is_active', true)
            ->whereDate('event_date', '>=', now()->toDateString())
            ->orderBy('event_date', 'asc')
            ->get()
            ->map(fn($e) => [
                'id'          => $e->event_id,
                'name'        => $e->name,
                'description' => $e->description,
                'date'        => $e->event_date->format('d F Y'),
                'time'        => $e->event_time ? substr($e->event_time, 0, 5) : null,
                'location'    => $e->location,
                'bannerUrl'   => $e->banner_path ? Storage::url($e->banner_path) : null,
            ]);

        return response()->json(['success' => true, 'data' => $events]);
    }

    private function findBySlug($slug): ?School
    {
        return School::where('slug', $slug)->where('is_active', true)->first();
    }
}
