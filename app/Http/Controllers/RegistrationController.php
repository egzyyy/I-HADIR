<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RegistrationController extends Controller
{
    /**
     * Handle the incoming registration request.
     */
    public function store(Request $request)
    {
        // 1. Determine which table to check for unique IC/Email based on type
        $tableName = match ($request->type) {
            'staff' => 'staffs',
            'teacher' => 'teachers',
            'student' => 'students',
            default => 'users', // Fallback
        };

        // 2. Validate the incoming request
        $validated = $request->validate([
            'type' => ['required', 'in:staff,teacher,student'],
            'name' => ['required', 'string', 'max:255'],
            'icNumber' => ['required', 'string', "unique:{$tableName},ic_number"], // Dynamic unique check
            'email' => ['nullable', 'email', "unique:{$tableName},email"], // Dynamic unique check
            'phone' => ['required', 'string'],
            'gender' => ['required', 'in:Male,Female'],
            'profilePic' => ['nullable', 'image', 'max:3072'], // Max 3MB
            
            // Dynamic validation based on type
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
            'address' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            
            // Parent Info (Student Only)
            'fatherName' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'fatherIc' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'motherName' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'motherIc' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            
            // Emergency Contact
            'emergencyName' => ['required', 'string'],
            'emergencyRelation' => ['required', 'string'],
            'emergencyPhone' => ['required', 'string'],
        ]);

        // 3. Process Data in Transaction
        return DB::transaction(function () use ($request, $validated) {
            // Handle File Upload
            $photoPath = null;
            if ($request->hasFile('profilePic')) {
                $photoPath = $request->file('profilePic')->store('profile-photos', 'public');
            }

            // Get the current admin's school_id (fallback to 1 if testing without auth)
            $schoolId = auth()->check() ? auth()->user()->school_id : 1; 

            // 4. Create Specific Profile Record Directly
            if ($request->type === 'student') {
                Student::create([
                    'school_id' => $schoolId,
                    'name' => $validated['name'],
                    'ic_number' => $validated['icNumber'],
                    'gender' => $validated['gender'],
                    'email' => $validated['email'],
                    'phone_num' => $validated['phone'],
                    'class' => $validated['specificType'],
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
            } elseif ($request->type === 'teacher') {
                Teacher::create([
                    'school_id' => $schoolId,
                    'name' => $validated['name'],
                    'ic_number' => $validated['icNumber'],
                    'gender' => $validated['gender'],
                    'phone_number' => $validated['phone'],
                    'email' => $validated['email'],
                    'position' => $validated['position'],
                    'profile_pic_path' => $photoPath,
                    'emergency_name' => $validated['emergencyName'],
                    'emergency_relation' => $validated['emergencyRelation'],
                    'emergency_phone_num' => $validated['emergencyPhone'],
                ]);
            } elseif ($request->type === 'staff') {
                Staff::create([
                    'school_id' => $schoolId,
                    'name' => $validated['name'],
                    'ic_number' => $validated['icNumber'],
                    'gender' => $validated['gender'],
                    'phone_number' => $validated['phone'],
                    'email' => $validated['email'],
                    'staff_type' => $validated['specificType'],
                    'profile_pic_path' => $photoPath,
                    'emergency_name' => $validated['emergencyName'],
                    'emergency_relation' => $validated['emergencyRelation'],
                    'emergency_phone_num' => $validated['emergencyPhone'],
                ]);
            }

            return response()->json([
                'success' => true, 
                'message' => 'Registration successful.'
            ]);
        });
    }
}