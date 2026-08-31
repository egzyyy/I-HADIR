<?php

namespace App\Http\Controllers;

use App\Models\CoCurricular;
use App\Models\Event;
use App\Models\School;
use App\Models\SchoolProfile;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
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

    /**
     * Attaches each organization member's photo for the landing page.
     *
     * The org chart is free-text JSON typed into the Landing Page editor, so it
     * holds no photo of its own — the picture a person uploads lives on their
     * user account as profile_pic_path. This resolves one to the other:
     *
     *   1. by user_id, when the admin has linked the row to an account;
     *   2. otherwise by normalised full name, so rows created before linking
     *      existed still show a photo without needing to be re-entered.
     *
     * Members with no matching account (a PIBG chairperson, say) get a null
     * photo and the frontend falls back to its placeholder icon.
     */
    private function organizationWithPhotos(?SchoolProfile $profile, int $schoolId): array
    {
        $members = $profile?->organization ?? [];
        if (!$members) {
            return [];
        }

        $staff = User::where('school_id', $schoolId)
            ->whereNotNull('profile_pic_path')
            ->get(['user_id', 'first_name', 'last_name', 'profile_pic_path']);

        $byId   = $staff->keyBy('user_id');
        $byName = $staff->keyBy(fn($u) => $this->normalizeName($u->full_name));

        return array_map(function ($member) use ($byId, $byName) {
            $match = (isset($member['user_id']) ? $byId->get($member['user_id']) : null)
                ?? $byName->get($this->normalizeName($member['name'] ?? ''));

            $member['photo'] = $match ? Storage::url($match->profile_pic_path) : null;

            return $member;
        }, $members);
    }

    /** Case- and spacing-insensitive key, so "Ahmad  bin Abdullah" matches. */
    private function normalizeName(string $name): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim($name)));
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
                // Null means the admin hasn't uploaded one — frontend uses its default.
                'logo'    => $school->logo_path ? Storage::url($school->logo_path) : null,
                // Admin-managed landing copy; nulls mean "use the frontend default".
                'profile' => [
                    'tagline'          => $profile?->tagline,
                    'established_year' => $profile?->established_year,
                    'about'            => $profile?->about,
                    'vision'           => $profile?->vision,
                    'mission'          => $profile?->mission,
                    'organization'     => $this->organizationWithPhotos($profile, $school->school_id),
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


    /**
     * Tells the public kiosk scanner whether it must obtain a location fix
     * before scanning. Coordinates are deliberately NOT returned — the client
     * only needs to know that a fix is required; the server decides whether the
     * reported position passes.
     */
    public function scanPolicy(Request $request)
    {
        $school = $request->filled('school')
            ? $this->findBySlug($request->school)
            : School::where('is_active', true)->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'geofence_required' => (bool) $school?->hasGeofence(),
                'school_name'       => $school?->name,
            ],
        ]);
    }


    /**
     * Pre-flight check for the kiosk scanner: is this position inside the
     * school's geofence? Lets the page refuse to open the camera at all,
     * instead of letting someone scan and be rejected afterwards.
     *
     * Shares GeofenceGuard with the scan endpoints so the preview and the
     * actual enforcement can never disagree.
     */
    public function verifyLocation(Request $request)
    {
        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy'  => 'nullable|numeric|min:0',
        ]);

        $school = $request->filled('school')
            ? $this->findBySlug($request->school)
            : School::where('is_active', true)->first();

        if (!$school || !$school->hasGeofence()) {
            return response()->json(['success' => true, 'data' => ['inside' => true]]);
        }

        $failure = app(\App\Services\GeofenceGuard::class)->check($request, $school);

        return response()->json([
            'success' => true,
            'data'    => [
                'inside'  => $failure === null,
                'code'    => $failure['code'] ?? null,
                'message' => $failure['message'] ?? null,
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
