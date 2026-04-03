<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $schoolId  = auth()->user()->school_id;
        $sessionId = $request->query('session_id');

        // Resolve active session for is_active derivation
        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        $classrooms = Classroom::where('school_id', $schoolId)
            ->with([
                'teacher:teacher_id,name',
                'session:school_session_id,year',
            ])
            ->withCount(['enrollments' => function ($q) use ($sessionId) {
                if ($sessionId) {
                    $q->where('school_session_id', $sessionId);
                }
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($c) use ($activeSession) {
                return [
                    'id'            => $c->classroom_id,
                    'name'          => $c->name,
                    'teacher_id'    => $c->teacher_id,
                    'teacher'       => $c->teacher ? strtoupper($c->teacher->name) : '-',
                    'totalStudents' => $c->enrollments_count,
                    'capacity'      => $c->capacity,
                    'createdAt'     => $c->created_at->format('d-m-Y'),
                    'sessionId'     => $c->school_session_id,
                    'sessionName'   => $c->session ? $c->session->year : '-',
                    'isActive'      => (bool) ($activeSession && $c->school_session_id
                        ? $c->school_session_id === $activeSession->school_session_id
                        : $c->is_active),
                ];
            });

        return response()->json(['success' => true, 'data' => $classrooms]);
    }

    public function getTeachers(Request $request)
    {
        $schoolId  = auth()->user()->school_id;
        $sessionId = $request->query('session_id');

        $query = Teacher::where('school_id', $schoolId)
            ->where('is_active', true);

        if ($sessionId) {
            $query->whereHas('employments', function ($q) use ($sessionId) {
                $q->where('school_session_id', $sessionId);
            });
        }

        $teachers = $query->orderBy('name')->get(['teacher_id', 'name']);

        return response()->json(['success' => true, 'data' => $teachers]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'teacher_id' => 'nullable|exists:teachers,teacher_id',
            'capacity'   => 'nullable|integer|min:1|max:9999',
        ]);

        $schoolId = auth()->user()->school_id;

        $exists = Classroom::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A class with this name already exists.'], 422);
        }

        // Auto-assign active session
        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        $classroom = Classroom::create([
            'school_id'         => $schoolId,
            'name'              => $request->name,
            'teacher_id'        => $request->teacher_id,
            'capacity'          => $request->capacity,
            'school_session_id' => $activeSession?->school_session_id,
            'is_active'         => true,
        ]);

        $classroom->load(['teacher:teacher_id,name', 'session:school_session_id,year']);

        return response()->json([
            'success' => true,
            'message' => 'Class created successfully!',
            'data'    => [
                'id'            => $classroom->classroom_id,
                'name'          => $classroom->name,
                'teacher_id'    => $classroom->teacher_id,
                'teacher'       => $classroom->teacher ? strtoupper($classroom->teacher->name) : '-',
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
            'teacher_id' => 'nullable|exists:teachers,teacher_id',
            'capacity'   => 'nullable|integer|min:1|max:9999',
        ]);

        $schoolId  = auth()->user()->school_id;
        $classroom = Classroom::where('school_id', $schoolId)
            ->where('classroom_id', $id)
            ->firstOrFail();

        $exists = Classroom::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->where('classroom_id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A class with this name already exists.'], 422);
        }

        $classroom->update([
            'name'       => $request->name,
            'teacher_id' => $request->teacher_id,
            'capacity'   => $request->capacity,
        ]);

        return response()->json(['success' => true, 'message' => 'Class updated successfully!']);
    }

    /**
     * List enrolled students + available (unenrolled) students for a classroom.
     */
    public function getStudents(Request $request, $id)
    {
        $schoolId  = auth()->user()->school_id;
        $classroom = Classroom::where('school_id', $schoolId)
            ->where('classroom_id', $id)
            ->firstOrFail();

        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        $sessionId = $activeSession?->school_session_id;

        // Students already enrolled in this class for the active session
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

        // Students in this school NOT yet enrolled in any class for the active session
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
                'sessionName' => $activeSession?->year ?? '-',
                'capacity'    => $classroom->capacity,
            ],
            'enrolled'  => $enrolled,
            'available' => $available,
        ]);
    }

    /**
     * Enroll a student into a classroom for the active session.
     */
    public function addStudent(Request $request, $id)
    {
        $request->validate([
            'student_id' => 'required|exists:students,student_id',
        ]);

        $schoolId = auth()->user()->school_id;

        Classroom::where('school_id', $schoolId)->where('classroom_id', $id)->firstOrFail();

        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->firstOrFail();

        // Check the unique constraint: one enrollment per student per session
        $alreadyEnrolled = Enrollment::where('student_id', $request->student_id)
            ->where('school_session_id', $activeSession->school_session_id)
            ->exists();

        if ($alreadyEnrolled) {
            return response()->json(['message' => 'Student is already enrolled in a class for this session.'], 422);
        }

        $enrollment = Enrollment::create([
            'student_id'        => $request->student_id,
            'school_session_id' => $activeSession->school_session_id,
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

    /**
     * Remove a student's enrollment from this classroom.
     */
    public function removeStudent($id, $studentId)
    {
        $schoolId = auth()->user()->school_id;

        Classroom::where('school_id', $schoolId)->where('classroom_id', $id)->firstOrFail();

        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->firstOrFail();

        $enrollment = Enrollment::where('classroom_id', $id)
            ->where('student_id', $studentId)
            ->where('school_session_id', $activeSession->school_session_id)
            ->firstOrFail();

        $enrollment->delete();

        return response()->json(['success' => true, 'message' => 'Student removed from class.']);
    }

    /**
     * Transfer a student from this classroom to another.
     */
    public function transferStudent(Request $request, $id, $studentId)
    {
        $request->validate([
            'target_classroom_id' => 'required|exists:classrooms,classroom_id',
        ]);

        $schoolId = auth()->user()->school_id;

        Classroom::where('school_id', $schoolId)->where('classroom_id', $id)->firstOrFail();
        Classroom::where('school_id', $schoolId)->where('classroom_id', $request->target_classroom_id)->firstOrFail();

        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->firstOrFail();

        $enrollment = Enrollment::where('classroom_id', $id)
            ->where('student_id', $studentId)
            ->where('school_session_id', $activeSession->school_session_id)
            ->firstOrFail();

        $enrollment->update(['classroom_id' => $request->target_classroom_id]);

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
