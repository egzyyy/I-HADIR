<?php

namespace App\Services;

use App\Models\School;
use Illuminate\Http\Request;

/**
 * Location check for the public kiosk scanner.
 *
 * Scope: anonymous scans only. A signed-in teacher or admin scanning from the
 * dashboard has already proven who they are, so requiring coordinates there
 * would break the dashboard scanner without adding much — the geofence exists
 * to constrain the *unauthenticated* endpoint anyone can reach from /scan.
 *
 * Honest limitation: coordinates are supplied by the browser, and a determined
 * user can override them (DevTools sensors, mock-location apps). This raises
 * the bar against casual remote check-in; it is not proof of presence. Device
 * registration would be the stronger control.
 */
class GeofenceGuard
{
    /**
     * Rejects a scan that can't demonstrate it happened near the school.
     * Returns null when the scan may proceed.
     *
     * @return array{message: string, code: string}|null
     */
    public function check(Request $request, School $school): ?array
    {
        // Signed-in users bypass: identity is already established.
        if (auth()->check()) {
            return null;
        }

        if (!$school->hasGeofence()) {
            return null;
        }

        $lat = $request->input('latitude');
        $lng = $request->input('longitude');

        if ($lat === null || $lng === null || !is_numeric($lat) || !is_numeric($lng)) {
            return [
                'code'    => 'location_required',
                'message' => 'Turn on location access to record attendance here.',
            ];
        }

        $lat = (float) $lat;
        $lng = (float) $lng;

        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            return [
                'code'    => 'location_invalid',
                'message' => 'That location reading is not valid. Please try again.',
            ];
        }

        $distance = $school->distanceMetersTo($lat, $lng);

        // A reading can be legitimately imprecise indoors, where phones fall
        // back to wifi/cell positioning. Allow the reported accuracy as slack
        // (capped) so real users inside the building aren't turned away.
        $accuracy = (float) $request->input('accuracy', 0);
        $slack = max(0.0, min($accuracy, 100.0));

        if ($distance - $slack > $school->geofence_radius_m) {
            return [
                'code'    => 'out_of_area',
                'message' => sprintf(
                    'You are about %s from %s. Attendance can only be recorded at the school.',
                    $this->humanDistance($distance),
                    $school->name
                ),
            ];
        }

        return null;
    }

    private function humanDistance(float $meters): string
    {
        return $meters >= 1000
            ? round($meters / 1000, 1) . ' km'
            : round($meters) . ' m';
    }
}
