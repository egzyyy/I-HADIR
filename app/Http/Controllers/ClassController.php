<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\User;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $authUser = auth()->user();
        $schoolId  = $authUser->school_id;
        $sessionId = $request->query('session_id');

        // Resolve active session for is_active derivation
        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        // Base Query
        $query = Classroom::where('school_id', $schoolId);

        // Filter by Session if provided and not 'all'
        if ($sessionId && $sessionId !== 'all') {
            $query->where('school_session_id', $sessionId);
        }

        // If the logged-in user is a Teacher, restrict the query to only their assigned classes
        if ($authUser->user_type === 'teacher') {
            $query->where('user_id', $authUser->user_id);
        }

        $classrooms = $query->with([
                'user:user_id,first_name,last_name',  // Changed from teacher to user
                'session:school_session_id,year',
            ])
            ->withCount(['enrollments' => function ($q) use ($sessionId) {
                if ($sessionId && $sessionId !== 'all') {
                    $q->where('school_session_id', $sessionId);
                }
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($c) use ($activeSession) {
                return [
                    'id'            => $c->classroom_id,
                    'name'          => $c->name,
                    'teacher_id'    => $c->user_id,
                    'teacher'       => $c->user ? strtoupper($c->user->full_name) : '-',  
                    'totalStudents' => $c->enrollments_count,
                    'capacity'      => $c->capacity,
                    'createdAt'     => $c->created_at->format('d/m/Y'),
                    'sessionId'     => $c->school_session_id,
                    'sessionName'   => $c->session ? $c->session->year : '-',
                    'isActive'      => (bool) ($activeSession && $c->school_session_id
                        ? $c->school_session_id === $activeSession->school_session_id
                        : $c->is_active),
                ];
            });

        return response()->json([
            'success' => true, 
            'data' => $classrooms, 
            'authUser' => $authUser,
            'activeSessionId' => $activeSession?->school_session_id
        ]);
    }

    public function getTeachers(Request $request)
    {
        $schoolId  = auth()->user()->school_id;
        $sessionId = $request->query('session_id');
        $excludeClassId = $request->query('exclude_class_id'); 
        $includeAssigned = $request->boolean('include_assigned');

        // Get active session if not provided or if 'all' is passed
        if (!$sessionId || $sessionId === 'all') {
            $activeSession = SchoolSession::where('school_id', $schoolId)
                ->where('is_active', true)
                ->first();
            $sessionId = $activeSession?->school_session_id;
        }

        $assignedTeacherIds = [];

        if (!$includeAssigned) {
            $query = Classroom::where('school_id', $schoolId)
                ->where('school_session_id', $sessionId)
                ->whereNotNull('user_id');

            if ($excludeClassId) {
                $query->where('classroom_id', '!=', $excludeClassId);
            }

            $assignedTeacherIds = $query->pluck('user_id')->toArray();
        }

        $teachers = User::where('school_id', $schoolId)
            ->where('user_type', 'teacher')
            ->where('is_active', true)
            ->whereNotIn('user_id', $assignedTeacherIds)
            ->orderBy('first_name')
            ->get()
            ->map(function ($user) {
                return [
                    'teacher_id' => $user->user_id,
                    'name' => $user->full_name ?? trim($user->first_name . ' ' . $user->last_name),
                ];
            });

        return response()->json(['success' => true, 'data' => $teachers]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'teacher_id' => 'nullable|exists:users,user_id',
            'capacity'   => 'nullable|integer|min:1|max:9999',
        ]);

        $schoolId = auth()->user()->school_id;

        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        $exists = Classroom::where('school_id', $schoolId)
            ->where('school_session_id', $activeSession?->school_session_id)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A class with this name already exists in the current session.'], 422);
        }

        $classroom = Classroom::create([
            'school_id'         => $schoolId,
            'name'              => $request->name,
            'user_id'           => $request->teacher_id, 
            'capacity'          => $request->capacity,
            'school_session_id' => $activeSession?->school_session_id,
            'is_active'         => true,
        ]);

        $classroom->load(['user:user_id,first_name,last_name', 'session:school_session_id,year']); 

        return response()->json([
            'success' => true,
            'message' => 'Class created successfully!',
            'data'    => [
                'id'            => $classroom->classroom_id,
                'name'          => $classroom->name,
                'teacher_id'    => $classroom->user_id,
                'teacher'       => $classroom->user ? strtoupper($classroom->user->full_name) : '-',
                'totalStudents' => 0,
                'capacity'      => $classroom->capacity,
                'createdAt'     => $classroom->created_at->format('d-m-Y'),
                'sessionId'     => $classroom->school_session_id,
                'sessionName'   => $classroom->session ? $classroom->session->year : '-',
                'isActive'      => true,
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'teacher_id' => 'nullable|exists:users,user_id',
            'capacity'   => 'nullable|integer|min:1|max:9999',
        ]);

        $schoolId  = auth()->user()->school_id;
        $classroom = Classroom::where('school_id', $schoolId)
            ->where('classroom_id', $id)
            ->firstOrFail();

        $exists = Classroom::where('school_id', $schoolId)
            ->where('school_session_id', $classroom->school_session_id) 
            ->where('name', $request->name)
            ->where('classroom_id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A class with this name already exists in this session.'], 422);
        }

        $classroom->update([
            'name'     => $request->name,
            'user_id' => $request->teacher_id, 
            'capacity' => $request->capacity,
        ]);

        return response()->json(['success' => true, 'message' => 'Class updated successfully!']);
    }

    public function getStudents(Request $request, $id)
    {
        $authUser = auth()->user();
        $schoolId  = $authUser->school_id;
        
        $query = Classroom::where('school_id', $schoolId)
            ->where('classroom_id', $id);

        if ($authUser->user_type === 'teacher') {
            $query->where('user_id', $authUser->user_id);
        }

        $classroom = $query->firstOrFail();
        $sessionId = $classroom->school_session_id;
        $session = SchoolSession::find($sessionId);

        $enrolled = Enrollment::where('classroom_id', $id)
            ->where('school_session_id', $sessionId)
            ->with('student:student_id,name,ic_number,gender,phone_num,created_at')
            ->get()
            ->map(fn($e) => [
                'enrollment_id' => $e->enrollment_id,
                'student_id'    => $e->student_id,
                'name'          => strtoupper($e->student->name),
                'ic_number'     => $e->student->ic_number,
                'gender'        => $e->student->gender,
                'phone'         => $e->student->phone_num ?? '-',
                'enrolledAt'    => $e->created_at->format('d-m-Y'),
            ]);

        $enrolledStudentIds = Enrollment::where('school_session_id', $sessionId)
            ->pluck('student_id');

        $available = Student::where('school_id', $schoolId)
            ->where('is_active', true)
            ->whereNotIn('student_id', $enrolledStudentIds)
            ->orderBy('name')
            ->get(['student_id', 'name'])
            ->map(fn($s) => [
                'student_id' => $s->student_id,
                'name'       => strtoupper($s->name),
            ]);

        return response()->json([
            'success'   => true,
            'classroom' => [
                'id'          => $classroom->classroom_id,
                'name'        => $classroom->name,
                'sessionName' => $session?->year ?? '-',
                'capacity'    => $classroom->capacity,
            ],
            'enrolled'  => $enrolled,
            'available' => $available,
        ]);
    }

    public function addStudent(Request $request, $id)
    {
        $request->validate([
            'student_id' => 'required|exists:students,student_id',
        ]);

        $schoolId = auth()->user()->school_id;

        $classroom = Classroom::where('school_id', $schoolId)->where('classroom_id', $id)->firstOrFail();
        $sessionId = $classroom->school_session_id;

        if ($classroom->capacity !== null) {
            $currentEnrolledCount = Enrollment::where('classroom_id', $id)
                ->where('school_session_id', $sessionId)
                ->count();
                
            if ($currentEnrolledCount >= $classroom->capacity) {
                return response()->json([
                    'message' => 'This class has reached its maximum capacity of ' . $classroom->capacity . ' students.'
                ], 422);
            }
        }

        $alreadyEnrolled = Enrollment::where('student_id', $request->student_id)
            ->where('school_session_id', $sessionId)
            ->exists();

        if ($alreadyEnrolled) {
            return response()->json(['message' => 'Student is already enrolled in a class for this session.'], 422);
        }

        $enrollment = Enrollment::create([
            'student_id'        => $request->student_id,
            'school_session_id' => $sessionId,
            'classroom_id'      => $id,
        ]);

        $enrollment->load('student:student_id,name,ic_number,gender,phone_num');

        return response()->json([
            'success' => true,
            'message' => 'Student enrolled successfully!',
            'data'    => [
                'enrollment_id' => $enrollment->enrollment_id,
                'student_id'    => $enrollment->student_id,
                'name'          => strtoupper($enrollment->student->name),
                'ic_number'     => $enrollment->student->ic_number,
                'gender'        => $enrollment->student->gender,
                'phone'         => $enrollment->student->phone_num ?? '-',
                'enrolledAt'    => $enrollment->created_at->format('d-m-Y'),
            ],
        ], 201);
    }

    public function removeStudent($id, $studentId)
    {
        $schoolId = auth()->user()->school_id;

        $classroom = Classroom::where('school_id', $schoolId)->where('classroom_id', $id)->firstOrFail();
        $sessionId = $classroom->school_session_id;

        $enrollment = Enrollment::where('classroom_id', $id)
            ->where('student_id', $studentId)
            ->where('school_session_id', $sessionId)
            ->firstOrFail();

        $enrollment->delete();

        return response()->json(['success' => true, 'message' => 'Student removed from class.']);
    }

    public function transferStudent(Request $request, $id, $studentId)
    {
        $request->validate([
            'target_classroom_id' => 'required|exists:classrooms,classroom_id',
        ]);

        $schoolId = auth()->user()->school_id;

        $classroom = Classroom::where('school_id', $schoolId)->where('classroom_id', $id)->firstOrFail();
        $targetClassroom = Classroom::where('school_id', $schoolId)->where('classroom_id', $request->target_classroom_id)->firstOrFail();
        $sessionId = $classroom->school_session_id;

        // --- NEW: Verify target class is in the same session ---
        if ($targetClassroom->school_session_id !== $sessionId) {
            return response()->json(['message' => 'The destination class must be in the same school session.'], 422);
        }

        // --- NEW: Check target class capacity ---
        if ($targetClassroom->capacity !== null) {
            $currentEnrolledCount = Enrollment::where('classroom_id', $targetClassroom->classroom_id)
                ->where('school_session_id', $targetClassroom->school_session_id)
                ->count();
                
            if ($currentEnrolledCount >= $targetClassroom->capacity) {
                return response()->json([
                    'message' => 'The destination class has reached its maximum capacity of ' . $targetClassroom->capacity . ' students.'
                ], 422);
            }
        }

        $enrollment = Enrollment::where('classroom_id', $id)
            ->where('student_id', $studentId)
            ->where('school_session_id', $sessionId)
            ->firstOrFail();

        $enrollment->update([
            'classroom_id' => $request->target_classroom_id,
            'school_session_id' => $targetClassroom->school_session_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Student transferred successfully!']);
    }

    public function destroy($id)
    {
        $schoolId  = auth()->user()->school_id;
        $classroom = Classroom::where('school_id', $schoolId)
            ->where('classroom_id', $id)
            ->firstOrFail();

        Enrollment::where('classroom_id', $id)->delete();

        $classroom->update(['is_active' => false]);
        $classroom->delete();

        return response()->json(['success' => true, 'message' => 'Class deleted successfully!']);
    }
}