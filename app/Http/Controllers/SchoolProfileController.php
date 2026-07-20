<?php

namespace App\Http\Controllers;

use App\Models\SchoolProfile;
use Illuminate\Http\Request;

/**
 * Admin-editable landing-page content for the caller's own school
 * (tagline, about, vision/mission, organization hierarchy).
 * Public visitors read this back through PublicController::show().
 */
class SchoolProfileController extends Controller
{
    public function show()
    {
        $profile = SchoolProfile::where('school_id', auth()->user()->school_id)->first();

        return response()->json([
            'success' => true,
            'data'    => $profile ? $this->format($profile) : $this->emptyProfile(),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'tagline'                 => 'nullable|string|max:255',
            'established_year'        => 'nullable|string|max:20',
            'about'                   => 'nullable|string|max:5000',
            'vision'                  => 'nullable|string|max:2000',
            'mission'                 => 'nullable|string|max:2000',
            'organization'            => 'nullable|array|max:50',
            'organization.*.name'     => 'required|string|max:255',
            'organization.*.position' => 'required|string|max:255',
            'organization.*.level'    => 'required|integer|min:1|max:3',
        ]);

        $profile = SchoolProfile::updateOrCreate(
            ['school_id' => auth()->user()->school_id],
            [
                'tagline'          => $request->tagline,
                'established_year' => $request->established_year,
                'about'            => $request->about,
                'vision'           => $request->vision,
                'mission'          => $request->mission,
                'organization'     => $request->organization ?? [],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Landing page content saved successfully!',
            'data'    => $this->format($profile),
        ]);
    }

    private function format(SchoolProfile $profile): array
    {
        return [
            'tagline'          => $profile->tagline,
            'established_year' => $profile->established_year,
            'about'            => $profile->about,
            'vision'           => $profile->vision,
            'mission'          => $profile->mission,
            'organization'     => $profile->organization ?? [],
        ];
    }

    private function emptyProfile(): array
    {
        return [
            'tagline'          => null,
            'established_year' => null,
            'about'            => null,
            'vision'           => null,
            'mission'          => null,
            'organization'     => [],
        ];
    }
}
