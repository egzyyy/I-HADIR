<?php

namespace App\Http\Controllers;

use App\Models\SchoolProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SchoolProfileController extends Controller
{
    public function show()
    {
        $schoolId = auth()->user()->school_id;
        $profile  = SchoolProfile::where('school_id',$schoolId)->first();

        $teachers = User::where('school_id',$schoolId)
            ->where('user_type', 'teacher')
            ->where('is_active', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(function ($u) {
                $positions = collect(explode(',', (string) ($u->position ?? '')))
                    ->map(fn ($p) => trim($p))
                    ->filter()
                    ->values()
                    ->all();

                return [
                    'user_id'   => $u->user_id,
                    'name'      => $u->full_name,
                    'position'  => $u->position ?? '',
                    'positions' => $positions,
                    'photo'     => $u->profile_pic_path ? Storage::url($u->profile_pic_path) : null,
                ];
            })
            ->values();

        return response()->json([
            'success'  => true,
            'data'     => $profile ? $this->format($profile) :$this->emptyProfile(),
            'teachers' => $teachers,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'tagline'                  => 'nullable|string|max:255',
            'established_year'         => 'nullable|string|max:20',
            'about'                    => 'nullable|string|max:5000',
            'vision'                   => 'nullable|string|max:2000',
            'mission'                  => 'nullable|string|max:2000',
            'organization_mode'        => 'nullable|in:builder,image',
            'organization'             => 'nullable|array|max:150',
            'organization.*.id'        => 'required|string|max:64',
            'organization.*.parent_id' => 'nullable|string|max:64',
            'organization.*.name'      => 'required|string|max:255',
            'organization.*.position'  => 'nullable|string|max:255',
            'organization.*.level'     => 'nullable|integer|min:1|max:10',
            'organization.*.user_id'   => 'nullable|integer',
        ]);

        $organization = collect($request->organization ?? [])->map(function ($member) {
            return [
                'id'        => (string) $member['id'],
                'parent_id' => $member['parent_id'] ? (string)$member['parent_id'] : null,
                'user_id'   => $member['user_id'] ?? null,
                'name'      => trim($member['name']),
                'position'  => trim((string) ($member['position'] ?? '')),
                'level'     => $member['level'] ?? 1,
            ];
        })->values()->all();

        $profile = SchoolProfile::updateOrCreate(
            ['school_id' => auth()->user()->school_id],
            [
                'tagline'           => $request->tagline,
                'established_year'  => $request->established_year,
                'about'             => $request->about,
                'vision'            => $request->vision,
                'mission'           => $request->mission,
                'organization_mode' => $request->organization_mode ?? 'builder',
                'organization'      => $organization,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Landing page content saved successfully!',
            'data'    => $this->format($profile),
        ]);
    }

    public function uploadOrgImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $schoolId = auth()->user()->school_id;
        $profile  = SchoolProfile::firstOrCreate(['school_id' =>$schoolId]);

        if ($profile->organization_image && Storage::disk('public')->exists($profile->organization_image)) {
            Storage::disk('public')->delete($profile->organization_image);
        }

        $path = $request->file('image')->store('org-charts', 'public');$profile->update([
            'organization_image' => $path,
            'organization_mode'  => 'image',
        ]);

        return response()->json([
            'success' => true,
            'url'     => Storage::url($path),
        ]);
    }

    public function deleteOrgImage()
    {
        $schoolId = auth()->user()->school_id;
        $profile  = SchoolProfile::where('school_id',$schoolId)->first();

        if ($profile &&$profile->organization_image) {
            if (Storage::disk('public')->exists($profile->organization_image)) {
                Storage::disk('public')->delete($profile->organization_image);
            }
            $profile->update(['organization_image' => null]);
        }

        return response()->json(['success' => true]);
    }

    private function format(SchoolProfile $profile): array
    {
        return [
            'tagline'            => $profile->tagline,
            'established_year'   => $profile->established_year,
            'about'              => $profile->about,
            'vision'             => $profile->vision,
            'mission'            => $profile->mission,
            'organization_mode'  => $profile->organization_mode ?? 'builder',
            'organization_image' => $profile->organization_image ? Storage::url($profile->organization_image) : null,
            'organization'       => $profile->organization ?? [],
        ];
    }

    private function emptyProfile(): array
    {
        return [
            'tagline'            => null,
            'established_year'   => null,
            'about'              => null,
            'vision'             => null,
            'mission'            => null,
            'organization_mode'  => 'builder',
            'organization_image' => null,
            'organization'       => [],
        ];
    }
}