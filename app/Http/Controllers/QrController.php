<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
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
            'payload' => $person->ic_number,
            'name'    => $person->name ?? $person->full_name,
            'label'   => $this->labelFor($userType, $person),
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
            'name'      => $person->name ?? $person->full_name,
            'class'     => $this->labelFor($request->user_type, $person),
        ]);
    }

    /**
     * Return the authenticated user's own QR payload (Teacher / Security self-service).
     * GET /api/qr/me
     */
    public function me()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $userType = match (true) {
            $user->user_type === 'teacher' => 'teacher',
            in_array($user->user_type, ['staff', 'security_staff']) => 'staff',
            default => null,
        };

        if (!$userType) {
            return response()->json(['message' => 'QR codes are only available for teacher and staff accounts.'], 422);
        }

        return response()->json([
            'success' => true,
            'payload' => $user->ic_number,
            'name'    => $user->full_name,
            'label'   => $user->user_type === 'security_staff' ? 'Security' : ucfirst($userType),
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function findPerson(string $type, string $id, int $schoolId)
    {
        return match ($type) {
            'student' => Student::where('school_id', $schoolId)->where('student_id', $id)->first(),
            'teacher' => User::where('school_id', $schoolId)->where('user_type', 'teacher')->where('user_id', $id)->first(),
            'staff'   => User::where('school_id', $schoolId)->whereIn('user_type', ['staff', 'security_staff'])->where('user_id', $id)->first(),
            default   => null,
        };
    }

    private function findByIc(string $type, string $ic, int $schoolId)
    {
        return match ($type) {
            'student' => Student::where('school_id', $schoolId)->where('ic_number', $ic)->first(),
            'teacher' => User::where('school_id', $schoolId)->where('user_type', 'teacher')->where('ic_number', $ic)->first(),
            'staff'   => User::where('school_id', $schoolId)->whereIn('user_type', ['staff', 'security_staff'])->where('ic_number', $ic)->first(),
            default   => null,
        };
    }

    private function labelFor(string $type, $person): string
    {
        if ($type === 'student') {
            return $person->class ?? '-';
        }
        if ($type === 'staff' && ($person->user_type ?? null) === 'security_staff') {
            return 'Security';
        }
        return ucfirst($type);
    }
}
