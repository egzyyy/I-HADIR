<?php

namespace App\Http\Controllers;

use App\Models\SportHouse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use App\Models\SchoolSession;
use App\Models\Student;

class SportHouseController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id;
        $session = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();
            
        $sessionId = $session ? $session->school_session_id : null;

        $items = SportHouse::where('school_id', $schoolId)
            ->with('teacher:user_id,first_name,last_name')
            ->withCount(['students as currentStudentEnrolled' => function ($query) use ($sessionId) {
                if ($sessionId) {
                    $query->where('sport_house_student.school_session_id', $sessionId);
                }
            }])
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id'             => $s->sport_house_id,
                'name'           => $s->name,
                'teacher_id'     => $s->user_id,
                'teacher'        => $s->teacher ? strtoupper($s->teacher->full_name) : '-',
                'capacity'       => $s->capacity,
                'currentCapacity'=> $s->currentStudentEnrolled ?? 0,
                'registeredDate' => $s->created_at->format('d-m-Y'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
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

        $exists = SportHouse::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A sport house with this name already exists.'], 422);
        }

        $item = SportHouse::create([
            'school_id'  => $schoolId,
            'name'       => $request->name,
            'capacity'   => $request->capacity,
            'user_id'    => $request->teacher_id,
            'is_active'  => true,
        ]);

        $item->load('teacher:user_id,first_name,last_name');

        return response()->json([
            'success' => true,
            'message' => 'Sport house created successfully!',
            'data'    => [
                'id'             => $item->sport_house_id,
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

        $item = SportHouse::where('school_id', $schoolId)
            ->where('sport_house_id', $id)
            ->firstOrFail();

        $exists = SportHouse::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->where('sport_house_id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A sport house with this name already exists.'], 422);
        }

        // Validate Capacity limitation on Update
        if ($request->capacity !== null) {
            $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
            if ($session) {
                $currentEnrolled = DB::table('sport_house_student')
                    ->where('sport_house_id', $id)
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

        return response()->json(['success' => true, 'message' => 'Sport house updated successfully!']);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $item     = SportHouse::where('school_id', $schoolId)
            ->where('sport_house_id', $id)
            ->firstOrFail();

        $item->update(['is_active' => false]);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Sport house deleted successfully!']);
    }

    // 1. Get Students for Checkbox UI
    public function getStudentsForEnrollment(Request $request, $sportHouseId)
    {
        $schoolId = auth()->user()->school_id;
        $classroomId = $request->classroom_id; 
        
        $session = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->firstOrFail();
        $sessionId = $session->school_session_id;

        $sportHouse = SportHouse::findOrFail($sportHouseId);

        // Find all students in this class for the active session
        $students = Student::where('school_id', $schoolId)
            ->whereHas('enrollments', function ($q) use ($classroomId, $sessionId) {
                $q->where('classroom_id', $classroomId)
                  ->where('school_session_id', $sessionId);
            })
            ->orderBy('name')
            ->get();

        $studentIds = $students->pluck('student_id')->toArray();
        $studentEnrollments = DB::table('sport_house_student')
            ->where('school_session_id', $sessionId)
            ->where('school_id', $schoolId)
            ->whereIn('student_id', $studentIds)
            ->get();

        // Get total enrolled for THIS sport globally to check capacity
        $currentTotalEnrolled = DB::table('sport_house_student')
            ->where('sport_house_id', $sportHouseId)
            ->where('school_session_id', $sessionId)
            ->count();

        $sportIds = $studentEnrollments->pluck('sport_house_id')->unique()->toArray();
        $sports = SportHouse::whereIn('sport_house_id', $sportIds)->get()->keyBy('sport_house_id');

        $data = $students->map(function ($student) use ($sportHouseId, $studentEnrollments, $sports) {
            $enrollment = $studentEnrollments->where('student_id', $student->student_id)->first();
            
            $inThisSport = false;
            $inOtherSport = false;
            $currentSportName = null;

            if ($enrollment) {
                if ($enrollment->sport_house_id == $sportHouseId) {
                    $inThisSport = true; 
                } else {
                    $inOtherSport = true; 
                    $sport = $sports->get($enrollment->sport_house_id);
                    $currentSportName = $sport ? $sport->name : 'Another Sport';
                }
            }

            return [
                'student_id'   => $student->student_id,
                'name'         => $student->name,
                'ic_number'    => $student->ic_number,
                'gender'       => $student->gender,
                'is_enrolled'  => $inThisSport, 
                'is_disabled'  => $inOtherSport, 
                'current_club' => $currentSportName // the React UI expects 'current_club' key
            ];
        });

        return response()->json([
            'success'          => true, 
            'capacity'         => $sportHouse->capacity,
            'current_enrolled' => $currentTotalEnrolled,
            'data'             => $data
        ]);
    }

    // 2. Save the Checkboxes (Bulletproof Sync)
    public function syncStudents(Request $request, $sportHouseId)
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

        $sportHouse = SportHouse::findOrFail($sportHouseId);

        // Get total enrolled right now globally
        $currentTotalEnrolled = DB::table('sport_house_student')
            ->where('sport_house_id', $sportHouseId)
            ->where('school_session_id', $sessionId)
            ->count();

        // Get students in this specific class
        $studentIdsInClass = Student::whereHas('enrollments', function ($q) use ($classroomId, $sessionId) {
            $q->where('classroom_id', $classroomId)->where('school_session_id', $sessionId);
        })->pluck('student_id')->toArray();

        // Calculate currently enrolled from THIS class ONLY
        $currentlyEnrolledFromThisClass = DB::table('sport_house_student')
            ->where('sport_house_id', $sportHouseId)
            ->where('school_session_id', $sessionId)
            ->whereIn('student_id', $studentIdsInClass)
            ->count();

        // Calculate projected total
        $newTotal = $currentTotalEnrolled - $currentlyEnrolledFromThisClass + count($selectedStudentIds);

        // Validate Capacity
        if ($sportHouse->capacity !== null && $newTotal > $sportHouse->capacity) {
            return response()->json(['message' => 'Capacity limit exceeded. Maximum allowed: ' . $sportHouse->capacity], 422);
        }

        // Reset phase: Erase all students in THIS CLASS from THIS SPORT
        DB::table('sport_house_student')
            ->where('sport_house_id', $sportHouseId)
            ->where('school_session_id', $sessionId)
            ->whereIn('student_id', $studentIdsInClass)
            ->delete();

        // Insert newly selected students
        $inserts = [];
        foreach ($selectedStudentIds as $studentId) {
            if (in_array($studentId, $studentIdsInClass)) {
                $inserts[] = [
                    'sport_house_id'    => $sportHouseId,
                    'student_id'        => $studentId,
                    'school_session_id' => $sessionId,
                    'school_id'         => $schoolId,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ];
            }
        }

        if (count($inserts) > 0) {
            DB::table('sport_house_student')->insert($inserts);
        }

        return response()->json(['success' => true, 'message' => 'Students successfully updated!']);
    }
}