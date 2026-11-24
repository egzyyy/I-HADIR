<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\CoCurricular;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use App\Models\SportHouse;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentActivityController extends Controller
{
    private function resolveSession(int $schoolId, $requestedSessionId = null): ?SchoolSession
    {
        if ($requestedSessionId && $requestedSessionId !== 'all') {
            $session = SchoolSession::where('school_id', $schoolId)
                ->where('school_session_id', $requestedSessionId)
                ->first();
            if ($session) {
                return $session;
            }
        }

        return SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();
    }

    private function authorizeStudentForUser(Student $student, ?SchoolSession $session): ?Enrollment
    {
        $user = auth()->user();

        $enrollment = Enrollment::where('student_id', $student->student_id)
            ->when($session, fn ($q) => $q->where('school_session_id', $session->school_session_id))
            ->with('classroom')
            ->first();

        if ($user->user_type === 'teacher') {
            $teacherClassIds = Classroom::where('user_id', $user->user_id)
                ->pluck('classroom_id')
                ->toArray();

            if (!$enrollment || !in_array($enrollment->classroom_id, $teacherClassIds)) {
                abort(403, 'You can only assign activities to students in your own class.');
            }
        }

        return $enrollment;
    }

    public function show(Request $request, $studentId)
    {
        $user     = auth()->user();
        $schoolId = $user->school_id;
        $student  = Student::where('school_id', $schoolId)
            ->where('student_id', $studentId)
            ->firstOrFail();

        $session    = $this->resolveSession($schoolId, $request->query('session_id'));
        $sessionId  = $session?->school_session_id;
        $enrollment = $this->authorizeStudentForUser($student, $session);

        // Fetch Sport Houses with current enrollment counts for this session
        $sportHouses = SportHouse::where('school_id', $schoolId)
            ->where('is_active', true)
            ->with('teacher:user_id,first_name,last_name')
            ->withCount(['students as current_enrolled' => function ($query) use ($sessionId) {
                if ($sessionId) {
                    $query->where('sport_house_student.school_session_id', $sessionId);
                }
            }])
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id'               => $s->sport_house_id,
                'name'             => $s->name,
                'color'            => $s->color,
                'teacher'          => $s->teacher ? strtoupper($s->teacher->full_name) : '-',
                'capacity'         => $s->capacity,
                'current_enrolled' => $s->current_enrolled ?? 0,
            ]);

        // Fetch Co-Curriculars with current enrollment counts for this session
        $coCurriculars = CoCurricular::where('school_id', $schoolId)
            ->where('is_active', true)
            ->with('teacher:user_id,first_name,last_name')
            ->withCount(['students as current_enrolled' => function ($query) use ($sessionId) {
                if ($sessionId) {
                    $query->where('co_curricular_student.school_session_id', $sessionId);
                }
            }])
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id'               => $c->co_curricular_id,
                'name'             => $c->name,
                'teacher'          => $c->teacher ? strtoupper($c->teacher->full_name) : '-',
                'capacity'         => $c->capacity,
                'current_enrolled' => $c->current_enrolled ?? 0,
            ]);

        // Fetch student's current assignments for this session
        $assignedSportHouseId = $sessionId
            ? DB::table('sport_house_student')
                ->where('school_id', $schoolId)
                ->where('school_session_id', $sessionId)
                ->where('student_id', $student->student_id)
                ->value('sport_house_id')
            : null;

        $assignedCoCurricularId = $sessionId
            ? DB::table('co_curricular_student')
                ->where('school_id', $schoolId)
                ->where('school_session_id', $sessionId)
                ->where('student_id', $student->student_id)
                ->value('co_curricular_id')
            : null;

        return response()->json([
            'success' => true,
            'student' => [
                'student_id'   => $student->student_id,
                'name'         => $student->name,
                'ic_number'    => $student->ic_number,
                'classroom'    => $enrollment?->classroom?->name ?? 'Unassigned',
                'session_year' => $session?->year,
            ],
            'sport_houses'   => $sportHouses,
            'co_curriculars' => $coCurriculars,
            'assigned'       => [
                'sport_house_id'   => $assignedSportHouseId ? (int) $assignedSportHouseId : null,
                'co_curricular_id' => $assignedCoCurricularId ? (int) $assignedCoCurricularId : null,
            ],
        ]);
    }

    public function sync(Request $request, $studentId)
    {
        $request->validate([
            'session_id'       => ['nullable', 'integer'],
            'sport_house_id'   => ['nullable', 'integer'],
            'co_curricular_id' => ['nullable', 'integer'],
        ]);

        $user     = auth()->user();
        $schoolId = $user->school_id;
        $student  = Student::where('school_id', $schoolId)
            ->where('student_id', $studentId)
            ->firstOrFail();

        $session = $this->resolveSession($schoolId, $request->input('session_id'));
        if (!$session) {
            return response()->json(['success' => false, 'message' => 'No active school session found.'], 400);
        }

        $sessionId = $session->school_session_id;
        $this->authorizeStudentForUser($student, $session);

        $newSportHouseId   = $request->input('sport_house_id');
        $newCoCurricularId = $request->input('co_curricular_id');

        // Validate Sport House capacity if changing to a new house
        $currentSportHouseId = DB::table('sport_house_student')
            ->where('school_id', $schoolId)
            ->where('school_session_id', $sessionId)
            ->where('student_id', $student->student_id)
            ->value('sport_house_id');

        if ($newSportHouseId && (int) $newSportHouseId !== (int) $currentSportHouseId) {
            $sportHouse = SportHouse::where('school_id', $schoolId)
                ->where('sport_house_id', $newSportHouseId)
                ->where('is_active', true)
                ->firstOrFail();

            if ($sportHouse->capacity !== null) {
                $enrolled = DB::table('sport_house_student')
                    ->where('sport_house_id', $sportHouse->sport_house_id)
                    ->where('school_session_id', $sessionId)
                    ->count();

                if ($enrolled >= $sportHouse->capacity) {
                    return response()->json([
                        'success' => false,
                        'message' => "{$sportHouse->name} has reached its maximum capacity ({$sportHouse->capacity}).",
                    ], 422);
                }
            }
        }

        // Validate Co-Curricular capacity if changing to a new club
        $currentCoCurricularId = DB::table('co_curricular_student')
            ->where('school_id', $schoolId)
            ->where('school_session_id', $sessionId)
            ->where('student_id', $student->student_id)
            ->value('co_curricular_id');

        if ($newCoCurricularId && (int) $newCoCurricularId !== (int) $currentCoCurricularId) {
            $coCurricular = CoCurricular::where('school_id', $schoolId)
                ->where('co_curricular_id', $newCoCurricularId)
                ->where('is_active', true)
                ->firstOrFail();

            if ($coCurricular->capacity !== null) {
                $enrolled = DB::table('co_curricular_student')
                    ->where('co_curricular_id', $coCurricular->co_curricular_id)
                    ->where('school_session_id', $sessionId)
                    ->count();

                if ($enrolled >= $coCurricular->capacity) {
                    return response()->json([
                        'success' => false,
                        'message' => "{$coCurricular->name} has reached its maximum capacity ({$coCurricular->capacity}).",
                    ], 422);
                }
            }
        }

        DB::transaction(function () use ($schoolId, $sessionId, $student, $newSportHouseId, $newCoCurricularId) {
            $now = now();

            // Sync Sport House
            DB::table('sport_house_student')
                ->where('school_id', $schoolId)
                ->where('school_session_id', $sessionId)
                ->where('student_id', $student->student_id)
                ->delete();

            if ($newSportHouseId) {
                DB::table('sport_house_student')->insert([
                    'sport_house_id'    => $newSportHouseId,
                    'student_id'        => $student->student_id,
                    'school_session_id' => $sessionId,
                    'school_id'         => $schoolId,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);
            }

            // Sync Co-Curricular
            DB::table('co_curricular_student')
                ->where('school_id', $schoolId)
                ->where('school_session_id', $sessionId)
                ->where('student_id', $student->student_id)
                ->delete();

            if ($newCoCurricularId) {
                DB::table('co_curricular_student')->insert([
                    'co_curricular_id'  => $newCoCurricularId,
                    'student_id'        => $student->student_id,
                    'school_session_id' => $sessionId,
                    'school_id'         => $schoolId,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Sport house and co-curricular assignments updated successfully.',
        ]);
    }
}