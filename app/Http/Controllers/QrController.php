<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use Illuminate\Http\Request;

class QrController extends Controller
{
    /**
     * Return the QR payload for a given user so the frontend can render it.
     * GET /api/qr/{userType}/{userId}
     */
    public function generate(string $userType, string $userId)
    {
        $schoolId = auth()->user()->school_id;
        $person   = $this->findPerson($userType, $userId, $schoolId);

        if (!$person) {
            return response()->json(['message' => 'Person not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'payload' => json_encode([
                'type' => $userType,
                'ic'   => $person->ic_number,
            ]),
            'name' => $person->name,
        ]);
    }

    /**
     * Resolve an IC number to a person's info (pre-validation before marking attendance).
     * POST /api/qr/resolve  { ic_number, user_type }
     */
    public function resolve(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string',
            'user_type' => 'required|in:student,teacher,staff',
        ]);

        $schoolId = auth()->user()->school_id;
        $person   = $this->findByIc($request->user_type, $request->ic_number, $schoolId);

        if (!$person) {
            return response()->json(['message' => 'Person not found.'], 404);
        }

        return response()->json([
            'success'   => true,
            'user_type' => $request->user_type,
            'user_id'   => $person->getKey(),
            'name'      => $person->name,
            'class'     => $request->user_type === 'student' ? ($person->class ?? '-') : ucfirst($request->user_type),
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function findPerson(string $type, string $id, int $schoolId)
    {
        return match ($type) {
            'student' => Student::where('school_id', $schoolId)->where('student_id', $id)->first(),
            'teacher' => Teacher::where('school_id', $schoolId)->where('teacher_id', $id)->first(),
            'staff'   => Staff::where('school_id', $schoolId)->where('staff_id', $id)->first(),
            default   => null,
        };
    }

    private function findByIc(string $type, string $ic, int $schoolId)
    {
        return match ($type) {
            'student' => Student::where('school_id', $schoolId)->where('ic_number', $ic)->first(),
            'teacher' => Teacher::where('school_id', $schoolId)->where('ic_number', $ic)->first(),
            'staff'   => Staff::where('school_id', $schoolId)->where('ic_number', $ic)->first(),
            default   => null,
        };
    }
}
