<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\TeacherEmployment;
use App\Models\StaffEmployment;
use App\Models\SchoolSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RegistrationController extends Controller
{
    public function store(Request $request)
    {
        $tableName = match ($request->type) {
            'staff' => 'staffs',
            'teacher' => 'teachers',
            'student' => 'students',
            default => 'users', 
        };

        $validated = $request->validate([
            'type' => ['required', 'in:staff,teacher,student'],
            'name' => ['required', 'string', 'max:255'],
            'icNumber' => ['required', 'string', "unique:{$tableName},ic_number"], 
            'email' => ['nullable', 'email', "unique:{$tableName},email"], 
            'phone' => ['required', 'string'],
            'gender' => ['required', 'in:Male,Female'],
            'address' => ['required', 'string'], // Address is now universally required!
            'profilePic' => ['nullable', 'image', 'max:3072'], 
            
            'specificType' => [
                'nullable', 
                'string', 
                function ($attribute, $value, $fail) use ($request) {
                    if (($request->type === 'staff' || $request->type === 'student') && empty($value)) {
                        $label = $request->type === 'student' ? 'Class' : 'Staff Type';
                        $fail("The {$label} field is required.");
                    }
                }
            ],
            'position' => [Rule::requiredIf($request->type === 'teacher'), 'nullable', 'string'],
            
            'fatherName' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'fatherIc' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'motherName' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'motherIc' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            
            'emergencyName' => ['required', 'string'],
            'emergencyRelation' => ['required', 'string'],
            'emergencyPhone' => ['required', 'string'],
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $photoPath = null;
            if ($request->hasFile('profilePic')) {
                $photoPath = $request->file('profilePic')->store('profile-photos', 'public');
            }

            $schoolId = auth()->check() ? auth()->user()->school_id : 1; 

            // ENFORCE ACTIVE SESSION
            $activeSession = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
            if (!$activeSession) {
                return response()->json(['message' => 'No active school session found. Please set one up first.'], 400);
            }

            if ($request->type === 'student') {
                $student = Student::create([
                    'school_id' => $schoolId,
                    'name' => $validated['name'],
                    'ic_number' => $validated['icNumber'],
                    'gender' => $validated['gender'],
                    'email' => $validated['email'],
                    'phone_num' => $validated['phone'],
                    'profile_pic_path' => $photoPath,
                    'address' => $validated['address'],
                    'father_name' => $validated['fatherName'],
                    'father_ic' => $validated['fatherIc'],
                    'mother_name' => $validated['motherName'],
                    'mother_ic' => $validated['motherIc'],
                    'emergency_name' => $validated['emergencyName'],
                    'emergency_relation' => $validated['emergencyRelation'],
                    'emergency_phone_num' => $validated['emergencyPhone'],
                ]);

                // Create or find the classroom
                $classroom = Classroom::firstOrCreate(
                    ['school_id' => $schoolId, 'name' => $validated['specificType']],
                    ['is_active' => true]
                );

                // Create the Enrollment pivot
                Enrollment::create([
                    'student_id' => $student->student_id,
                    'school_session_id' => $activeSession->school_session_id,
                    'classroom_id' => $classroom->classroom_id
                ]);

            } elseif ($request->type === 'teacher') {
                $teacher = Teacher::create([
                    'school_id' => $schoolId,
                    'name' => $validated['name'],
                    'ic_number' => $validated['icNumber'],
                    'gender' => $validated['gender'],
                    'phone_number' => $validated['phone'],
                    'email' => $validated['email'],
                    'address' => $validated['address'], // Save teacher address
                    'profile_pic_path' => $photoPath,
                    'emergency_name' => $validated['emergencyName'],
                    'emergency_relation' => $validated['emergencyRelation'],
                    'emergency_phone_num' => $validated['emergencyPhone'],
                ]);

                // Create the Teacher Employment pivot
                TeacherEmployment::create([
                    'teacher_id' => $teacher->teacher_id,
                    'school_session_id' => $activeSession->school_session_id,
                    'position' => $validated['position']
                ]);

            } elseif ($request->type === 'staff') {
                $staff = Staff::create([
                    'school_id' => $schoolId,
                    'name' => $validated['name'],
                    'ic_number' => $validated['icNumber'],
                    'gender' => $validated['gender'],
                    'phone_number' => $validated['phone'],
                    'email' => $validated['email'],
                    'address' => $validated['address'], // Save staff address
                    'profile_pic_path' => $photoPath,
                    'emergency_name' => $validated['emergencyName'],
                    'emergency_relation' => $validated['emergencyRelation'],
                    'emergency_phone_num' => $validated['emergencyPhone'],
                ]);

                // Create the Staff Employment pivot
                StaffEmployment::create([
                    'staff_id' => $staff->staff_id,
                    'school_session_id' => $activeSession->school_session_id,
                    'staff_type' => $validated['specificType']
                ]);
            }

            return response()->json([
                'success' => true, 
                'message' => 'Registration successful.'
            ]);
        });
    }
}