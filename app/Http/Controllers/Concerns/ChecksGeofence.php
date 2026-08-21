<?php

namespace App\Http\Controllers\Concerns;

use App\Models\School;
use App\Services\GeofenceGuard;
use Illuminate\Http\Request;

/**
 * Shared by the controllers behind the public kiosk scanner
 * (AttendanceController, FacilityController).
 */
trait ChecksGeofence
{
    /**
     * Returns a 422 response when an anonymous scan can't show it happened
     * near the school, or null when the scan may proceed.
     */
    protected function denyOutsideGeofence(Request $request, int $schoolId)
    {
        $school = School::find($schoolId);
        if (!$school) {
            return null;
        }

        $failure = app(GeofenceGuard::class)->check($request, $school);
        if (!$failure) {
            return null;
        }

        return response()->json([
            'success' => false,
            'code'    => $failure['code'],
            'message' => $failure['message'],
        ], 422);
    }
}
