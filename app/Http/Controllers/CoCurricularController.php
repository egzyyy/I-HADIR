<?php

namespace App\Http\Controllers;

use App\Models\CoCurricular;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use App\Models\SchoolSession;
use App\Models\Student;

class CoCurricularController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id;
        $session = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();
            
        $sessionId = $session ? $session->school_session_id : null;

        $items = CoCurricular::where('school_id', $schoolId)
            ->with('teacher:user_id,first_name,last_name')
            ->withCount(['students as currentStudentEnrolled' => function ($query) use ($sessionId) {
                if ($sessionId) {
                    $query->where('co_curricular_student.school_session_id', $sessionId);
                }
            }])
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->co_curricular_id,
                'name'           => $c->name,
                'teacher_id'     => $c->user_id,
                'teacher'        => $c->teacher ? strtoupper($c->teacher->full_name) : '-',
                'capacity'       => $c->capacity,
                'currentCapacity'=> $c->currentStudentEnrolled ?? 0,
                'registeredDate' => $c->created_at->format('d-m-Y'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $schoolId = auth()->user()->school_id;
        $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->firstOrFail();
        
        $request->validate([
            'name'       => 'required|string|max:255',
            'capacity'   => 'nullable|integer|min:1',
            'teacher_id' => [
                'nullable',
                Rule::exists('users', 'user_id')->where(fn ($query) => $query
                    ->where('school_id', $schoolId)
                    ->where('user_type', 'teacher')
                    ->where('is_active', true)
                ),
            ],
        ]);

        $exists = CoCurricular::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A co-curricular with this name already exists.'], 422);
        }

        $item = CoCurricular::create([
            'school_id'  => $schoolId,
            'name'       => $request->name,
            'capacity'   => $request->capacity,
            'user_id'    => $request->teacher_id,
            'is_active'  => true,
        ]);

        $item->load('teacher:user_id,first_name,last_name');

        return response()->json([
            'success' => true,
            'message' => 'Co-curricular created successfully!',
            'data'    => [
                'id'             => $item->co_curricular_id,
                'name'           => $item->name,
                'teacher_id'     => $item->user_id,
                'teacher'        => $item->teacher ? strtoupper($item->teacher->full_name) : '-',
                'capacity'       => $item->capacity,
                'registeredDate' => $item->created_at->format('d-m-Y'),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $schoolId = auth()->user()->school_id;

        $request->validate([
            'name'       => 'required|string|max:255',
            'capacity'   => 'nullable|integer|min:1',
            'teacher_id' => [
                'nullable',
                Rule::exists('users', 'user_id')->where(fn ($query) => $query
                    ->where('school_id', $schoolId)
                    ->where('user_type', 'teacher')
                    ->where('is_active', true)
                ),
            ],
        ]);

        $item = CoCurricular::where('school_id', $schoolId)
            ->where('co_curricular_id', $id)
            ->firstOrFail();

        $exists = CoCurricular::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->where('co_curricular_id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A co-curricular with this name already exists.'], 422);
        }

        // Validate Capacity limitation on Update
        if ($request->capacity !== null) {
            $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
            if ($session) {
                $currentEnrolled = DB::table('co_curricular_student')
                    ->where('co_curricular_id', $id)
                    ->where('school_session_id', $session->school_session_id)
                    ->count();

                if ($request->capacity < $currentEnrolled) {
                    return response()->json(['message' => "Cannot set capacity lower than current enrollment ($currentEnrolled). Please remove students first."], 422);
                }
            }
        }

        $item->update([
            'name'       => $request->name,
            'capacity'   => $request->capacity,
            'user_id'    => $request->teacher_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Co-curricular updated successfully!']);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $item     = CoCurricular::where('school_id', $schoolId)
            ->where('co_curricular_id', $id)
            ->firstOrFail();

        $item->update(['is_active' => false]);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Co-curricular deleted successfully!']);
    }
    
    // 1. Get Students for Checkbox UI
    public function getStudentsForEnrollment(Request $request, $coCurricularId)
    {
        $schoolId = auth()->user()->school_id;
        $classroomId = $request->classroom_id; 
        
        $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->firstOrFail();
        $sessionId = $session->school_session_id;

        $coCurricular = CoCurricular::findOrFail($coCurricularId);

        // Find all students in this class for the active session
        $students = Student::where('school_id', $schoolId)
            ->whereHas('enrollments', function ($q) use ($classroomId, $sessionId) {
                $q->where('classroom_id', $classroomId)
                  ->where('school_session_id', $sessionId);
            })
            ->orderBy('name')
            ->get();

        $studentIds = $students->pluck('student_id')->toArray();
        $studentEnrollments = DB::table('co_curricular_student')
            ->where('school_session_id', $sessionId)
            ->where('school_id', $schoolId)
            ->whereIn('student_id', $studentIds)
            ->get();

        // Get total enrolled for THIS club globally to check capacity
        $currentTotalEnrolled = DB::table('co_curricular_student')
            ->where('co_curricular_id', $coCurricularId)
            ->where('school_session_id', $sessionId)
            ->count();

        $clubIds = $studentEnrollments->pluck('co_curricular_id')->unique()->toArray();
        $clubs = CoCurricular::whereIn('co_curricular_id', $clubIds)->get()->keyBy('co_curricular_id');

        $data = $students->map(function ($student) use ($coCurricularId, $studentEnrollments, $clubs) {
            $enrollment = $studentEnrollments->where('student_id', $student->student_id)->first();
            
            $inThisClub = false;
            $inOtherClub = false;
            $currentClubName = null;

            if ($enrollment) {
                if ($enrollment->co_curricular_id == $coCurricularId) {
                    $inThisClub = true; 
                } else {
                    $inOtherClub = true; 
                    $club = $clubs->get($enrollment->co_curricular_id);
                    $currentClubName = $club ? $club->name : 'Another Club';
                }
            }

            return [
                'student_id'   => $student->student_id,
                'name'         => $student->name,
                'ic_number'    => $student->ic_number,
                'gender'       => $student->gender,
                'is_enrolled'  => $inThisClub, 
                'is_disabled'  => $inOtherClub, 
                'current_club' => $currentClubName 
            ];
        });

        return response()->json([
            'success'          => true, 
            'capacity'         => $coCurricular->capacity,
            'current_enrolled' => $currentTotalEnrolled,
            'data'             => $data
        ]);
    }

    // 2. Save the Checkboxes (Bulletproof Sync)
    public function syncStudents(Request $request, $coCurricularId)
    {
        $request->validate([
            'classroom_id' => 'required|integer',
            'student_ids'  => 'array'
        ]);
        
        $schoolId = auth()->user()->school_id;
        $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->firstOrFail();
        $sessionId = $session->school_session_id;
        
        $classroomId = $request->classroom_id;
        $selectedStudentIds = $request->student_ids ?? [];

        $coCurricular = CoCurricular::findOrFail($coCurricularId);

        // Get total enrolled right now globally
        $currentTotalEnrolled = DB::table('co_curricular_student')
            ->where('co_curricular_id', $coCurricularId)
            ->where('school_session_id', $sessionId)
            ->count();

        // Get students in this specific class
        $studentIdsInClass = Student::whereHas('enrollments', function ($q) use ($classroomId, $sessionId) {
            $q->where('classroom_id', $classroomId)->where('school_session_id', $sessionId);
        })->pluck('student_id')->toArray();

        // Calculate currently enrolled from THIS class ONLY
        $currentlyEnrolledFromThisClass = DB::table('co_curricular_student')
            ->where('co_curricular_id', $coCurricularId)
            ->where('school_session_id', $sessionId)
            ->whereIn('student_id', $studentIdsInClass)
            ->count();

        // Calculate projected total
        $newTotal = $currentTotalEnrolled - $currentlyEnrolledFromThisClass + count($selectedStudentIds);

        // Validate Capacity
        if ($coCurricular->capacity !== null && $newTotal > $coCurricular->capacity) {
            return response()->json(['message' => 'Capacity limit exceeded. Maximum allowed: ' . $coCurricular->capacity], 422);
        }

        // Reset phase: Erase all students in THIS CLASS from THIS CLUB
        DB::table('co_curricular_student')
            ->where('co_curricular_id', $coCurricularId)
            ->where('school_session_id', $sessionId)
            ->whereIn('student_id', $studentIdsInClass)
            ->delete();

        // Insert newly selected students
        $inserts = [];
        foreach ($selectedStudentIds as $studentId) {
            if (in_array($studentId, $studentIdsInClass)) {
                $inserts[] = [
                    'co_curricular_id'  => $coCurricularId,
                    'student_id'        => $studentId,
                    'school_session_id' => $sessionId,
                    'school_id'         => $schoolId,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ];
            }
        }

        if (count($inserts) > 0) {
            DB::table('co_curricular_student')->insert($inserts);
        }

        return response()->json(['success' => true, 'message' => 'Students successfully updated!']);
    }
}