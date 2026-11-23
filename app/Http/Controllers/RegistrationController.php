<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class RegistrationController extends Controller
{
    public function store(Request $request)
    {
        // Determine which table to check for uniqueness
        $tableName = $request->type === 'student' ? 'students' : 'users';

        // Normalize positions[] array (with fallback to legacy single position / specificType)
        $rawPositions = $request->input('positions', []);
        if (!is_array($rawPositions)) {
            $rawPositions = [$rawPositions];
        }

        $positions = collect($rawPositions)
            ->map(fn ($p) => trim((string) $p))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($positions) && in_array($request->type, ['teacher', 'staff'], true)) {
            $fallback = $request->type === 'teacher' ? $request->position : $request->specificType;
            if (!empty($fallback)) {
                $positions = collect(explode(',', (string) $fallback))
                    ->map(fn ($p) => trim($p))
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();
            }
        }

        $isSecurityStaff = $request->type === 'staff' && in_array('Security Staff', $positions, true);
        $isTeacher       = $request->type === 'teacher';

        // Build validation rules
        $rules = [
            'type'       => ['required', 'in:staff,teacher,student'],
            'name'       => ['required', 'string', 'max:255'],
            'icNumber'   => ['required', 'string', "unique:{$tableName},ic_number"],
            'email'      => ['nullable', 'email'],
            'phone'      => ['required', 'string'],
            'gender'     => ['required', 'in:Male,Female'],
            'profilePic' => ['nullable', 'image', 'max:3072'],

            // Separated address fields
            'streetAddress' => ['required', 'string'],
            'city'          => ['required', 'string'],
            'state'         => ['required', 'string'],
            'postcode'      => ['required', 'string', 'max:10'],
            'country'       => ['nullable', 'string'],

            // Student class
            'specificType' => [
                Rule::requiredIf($request->type === 'student'),
                'nullable',
                'string',
            ],

            // Multiple positions for teacher & staff
            'positions'   => ['nullable', 'array'],
            'positions.*' => ['nullable', 'string', 'max:100'],
            'position'    => ['nullable', 'string', 'max:255'],

            // Password is required only for teacher and Security Staff
            'password' => [
                function ($attribute, $value, $fail) use ($isSecurityStaff, $isTeacher) {
                    if (($isSecurityStaff || $isTeacher) && empty($value)) {
                        $fail('The password field is required for teachers and security staff.');
                    }
                },
                'nullable',
                'string',
                'min:8',
            ],

            // Student-specific fields
            'fatherName' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'fatherIc'   => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'motherName' => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],
            'motherIc'   => [Rule::requiredIf($request->type === 'student'), 'nullable', 'string'],

            'emergencyName'     => ['required', 'string'],
            'emergencyRelation' => ['required', 'string'],
            'emergencyPhone'    => ['required', 'string'],
        ];

        if ($isSecurityStaff || $isTeacher) {
            $rules['email'] = ['required', 'email', 'unique:users,email'];
        }

        $validated = $request->validate($rules);

        // Enforce at least one position for teacher & staff
        if (in_array($request->type, ['teacher', 'staff'], true) && empty($positions)) {
            return response()->json([
                'message' => 'Please provide at least one position.',
            ], 422);
        }

        $positionString = implode(', ', $positions);

        return DB::transaction(function () use ($request, $validated, $isSecurityStaff, $positionString) {
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

            // Common address data
            $addressData = [
                'street_address' => $validated['streetAddress'],
                'city'           => $validated['city'],
                'state'          => $validated['state'],
                'postcode'       => $validated['postcode'],
                'country'        => $validated['country'] ?? 'Malaysia',
            ];

            if ($request->type === 'student') {
                $student = Student::create(array_merge([
                    'school_id'           => $schoolId,
                    'name'                => $validated['name'],
                    'ic_number'           => $validated['icNumber'],
                    'gender'              => $validated['gender'],
                    'email'               => $validated['email'] ?? null,
                    'phone_num'           => $validated['phone'],
                    'profile_pic_path'    => $photoPath,
                    'father_name'         => $validated['fatherName'],
                    'father_ic'           => $validated['fatherIc'],
                    'mother_name'         => $validated['motherName'],
                    'mother_ic'           => $validated['motherIc'],
                    'emergency_name'      => $validated['emergencyName'],
                    'emergency_relation'  => $validated['emergencyRelation'],
                    'emergency_phone_num' => $validated['emergencyPhone'],
                ], $addressData));

                $classroom = Classroom::firstOrCreate(
                    ['school_id' => $schoolId, 'name' => $validated['specificType']],
                    ['is_active' => true]
                );

                Enrollment::create([
                    'student_id'        => $student->student_id,
                    'school_session_id' => $activeSession->school_session_id,
                    'classroom_id'      => $classroom->classroom_id,
                ]);

            } elseif ($request->type === 'teacher') {
                $nameParts = explode(' ', $validated['name'], 2);
                $firstName = $nameParts[0];
                $lastName  = $nameParts[1] ?? '';

                User::create(array_merge([
                    'school_id'              => $schoolId,
                    'user_type'              => 'teacher',
                    'first_name'             => $firstName,
                    'last_name'              => $lastName,
                    'ic_number'              => $validated['icNumber'],
                    'gender'                 => $validated['gender'],
                    'email'                  => $validated['email'],
                    'password'               => Hash::make($validated['password']),
                    'phone_num'              => $validated['phone'],
                    'position'               => $positionString,
                    'profile_pic_path'       => $photoPath,
                    'emergency_contact_name' => $validated['emergencyName'],
                    'emergency_relationship' => $validated['emergencyRelation'],
                    'emergency_phone_num'    => $validated['emergencyPhone'],
                    'is_active'              => true,
                ], $addressData));

            } elseif ($request->type === 'staff') {
                $nameParts = explode(' ', $validated['name'], 2);
                $firstName = $nameParts[0];
                $lastName  = $nameParts[1] ?? '';
                $userType  = $isSecurityStaff ? 'security_staff' : 'staff';

                $userData = array_merge([
                    'school_id'              => $schoolId,
                    'user_type'              => $userType,
                    'first_name'             => $firstName,
                    'last_name'              => $lastName,
                    'ic_number'              => $validated['icNumber'],
                    'gender'                 => $validated['gender'],
                    'email'                  => $validated['email'] ?? null,
                    'phone_num'              => $validated['phone'],
                    'position'               => $positionString,
                    'profile_pic_path'       => $photoPath,
                    'emergency_contact_name' => $validated['emergencyName'],
                    'emergency_relationship' => $validated['emergencyRelation'],
                    'emergency_phone_num'    => $validated['emergencyPhone'],
                    'is_active'              => true,
                ], $addressData);

                $userData['password'] = ($isSecurityStaff && !empty($validated['password']))
                    ? Hash::make($validated['password'])
                    : null;

                User::create($userData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Registration successful.',
            ]);
        });
    }
}