<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use App\Models\User;
use App\Models\SchoolSession;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        
        $studentsQuery = Student::where('school_id', $schoolId)->withTrashed();
        $teachersQuery = Teacher::where('school_id', $schoolId)->withTrashed();
        $staffsQuery = Staff::where('school_id', $schoolId)->withTrashed();

        $sessionId = $request->session_id;

        // Filter by Session
        if ($sessionId && $sessionId !== 'all') {
            
            $session = SchoolSession::find($sessionId);
            
            if ($session) {
                $startDate = $session->start_date;
                $nextSession = SchoolSession::where('school_id', $schoolId)
                    ->where('start_date', '>', $startDate)
                    ->orderBy('start_date', 'asc')
                    ->first();
                $endDate = $nextSession ? $nextSession->start_date : now()->addYears(10);

                // 1. STUDENTS: Show if they were registered before the session ended, 
                // and NOT deleted before the session started.
                $studentsQuery->where('created_at', '<', $endDate)
                    ->where(function($q) use ($startDate) {
                        $q->whereNull('deleted_at')
                          ->orWhere('deleted_at', '>=', $startDate);
                    })->with(['enrollments' => function($query) use ($sessionId) {
                        $query->where('school_session_id', $sessionId)->with('classroom');
                    }]);

                // 2. TEACHERS & STAFF: Show if they were hired before the session ended, 
                // and NOT deleted before the session started.
                $teachersQuery->where('created_at', '<', $endDate)
                    ->where(function($q) use ($startDate) {
                        $q->whereNull('deleted_at')
                          ->orWhere('deleted_at', '>=', $startDate);
                    })->with(['employments' => function($query) use ($endDate) {
                        $query->whereHas('schoolSession', function($q) use ($endDate) {
                            $q->where('start_date', '<', $endDate);
                        })->latest('created_at');
                    }]);

                $staffsQuery->where('created_at', '<', $endDate)
                    ->where(function($q) use ($startDate) {
                        $q->whereNull('deleted_at')
                          ->orWhere('deleted_at', '>=', $startDate);
                    })->with(['employments' => function($query) use ($endDate) {
                        $query->whereHas('schoolSession', function($q) use ($endDate) {
                            $q->where('start_date', '<', $endDate);
                        })->latest('created_at');
                    }]);
            }

        } else {
            // All Time History - Load the latest record for everyone
            $studentsQuery->with(['enrollments' => function($query) {
                $query->latest('created_at')->with('classroom');
            }]);
            $teachersQuery->with(['employments' => function($query) {
                $query->latest('created_at');
            }]);
            $staffsQuery->with(['employments' => function($query) {
                $query->latest('created_at');
            }]);
        }

        // Fetch and format Students
        $students = $studentsQuery->orderBy('created_at', 'desc')->get()->map(function($item) {
            $enrollment = $item->enrollments->first();
            $className = $enrollment && $enrollment->classroom ? $enrollment->classroom->name : 'Unassigned';

            return [
                'id' => $item->student_id,
                'name' => $item->name,
                'ic_number' => $item->ic_number ?? '-', 
                'phone' => $item->phone_num ?? '-', 
                'gender' => $item->gender,
                'role' => $className, 
                'type' => 'student',
                'registeredDate' => $item->created_at->format('d-m-Y'),
                'raw_data' => $item
            ];
        });

        // Fetch and format Teachers
        $teachers = $teachersQuery->orderBy('created_at', 'desc')->get()->map(function($item) {
            $employment = $item->employments->first();
            $role = $employment ? $employment->position : 'Unassigned';

            return [
                'id' => $item->teacher_id,
                'name' => $item->name,
                'ic_number' => $item->ic_number ?? '-',
                'phone' => $item->phone_number ?? '-',
                'gender' => $item->gender,
                'role' => $role,
                'type' => 'teacher',
                'registeredDate' => $item->created_at->format('d-m-Y'),
                'raw_data' => $item
            ];
        });

        // Fetch and format Staffs
        $staffs = $staffsQuery->orderBy('created_at', 'desc')->get()->map(function($item) {
            $employment = $item->employments->first();
            $role = $employment ? $employment->staff_type : 'Unassigned';

            return [
                'id' => $item->staff_id,
                'name' => $item->name,
                'ic_number' => $item->ic_number ?? '-',
                'phone' => $item->phone_number ?? '-',
                'gender' => $item->gender,
                'role' => $role,
                'type' => 'staff',
                'registeredDate' => $item->created_at->format('d-m-Y'),
                'raw_data' => $item
            ];
        });

        return response()->json([
            'student' => $students,
            'teacher' => $teachers,
            'staff' => $staffs
        ]);
    }

    // ... [Keep destroy, getAdminProfile, updateAdminProfile, updatePassword below]
    public function destroy($type, $id)
    {
        if ($type === 'student') Student::where('student_id', $id)->delete();
        elseif ($type === 'teacher') Teacher::where('teacher_id', $id)->delete();
        elseif ($type === 'staff') Staff::where('staff_id', $id)->delete();
        
        return response()->json(['success' => true]);
    }

    public function update(Request $request, $id)
    {
        $type = $request->type;
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        // Common validation rules for all types
        $rules = [
            'gender' => 'nullable|in:Male,Female',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'emergencyName' => 'nullable|string|max:255',
            'emergencyRelation' => 'nullable|string|max:50',
            'emergencyPhone' => 'nullable|string|max:20',
            'profilePic' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:3072',
        ];

        // Type-specific validation
        if ($type === 'student') {
            $rules['fatherPhone'] = 'nullable|string|max:20';
            $rules['motherPhone'] = 'nullable|string|max:20';
        } else {
            $rules['role'] = 'nullable|string|max:255'; // position for teacher, staff_type for staff
        }

        $validated = $request->validate($rules);

        // Handle File Upload
        $photoPath = null;
        if ($request->hasFile('profilePic')) {
            $photoPath = $request->file('profilePic')->store('profile-photos', 'public');
        }

        // --- UPDATE LOGIC ---
        if ($type === 'student') {
            $user = Student::findOrFail($id);
            
            $updateData = [
                'gender' => $validated['gender'] ?? $user->gender,
                'phone_num' => $validated['phone'] ?? $user->phone_num,
                'email' => $validated['email'] ?? $user->email,
                'address' => $validated['address'] ?? $user->address,
                'father_phone_num' => $validated['fatherPhone'] ?? $user->father_phone_num,
                'mother_phone_num' => $validated['motherPhone'] ?? $user->mother_phone_num,
                'emergency_name' => $validated['emergencyName'] ?? $user->emergency_name,
                'emergency_relation' => $validated['emergencyRelation'] ?? $user->emergency_relation,
                'emergency_phone_num' => $validated['emergencyPhone'] ?? $user->emergency_phone_num,
            ];

            if ($photoPath) $updateData['profile_pic_path'] = $photoPath;
            $user->update($updateData);

        } elseif ($type === 'teacher') {
            $user = Teacher::findOrFail($id);

            $updateData = [
                'gender' => $validated['gender'] ?? $user->gender,
                'phone_number' => $validated['phone'] ?? $user->phone_number,
                'email' => $validated['email'] ?? $user->email,
                'emergency_name' => $validated['emergencyName'] ?? $user->emergency_name,
                'emergency_relation' => $validated['emergencyRelation'] ?? $user->emergency_relation,
                'emergency_phone_num' => $validated['emergencyPhone'] ?? $user->emergency_phone_num,
            ];

            if ($photoPath) $updateData['profile_pic_path'] = $photoPath;
            $user->update($updateData);

            // Update their current active session role if provided
            if (isset($validated['role'])) {
                $activeSession = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
                if ($activeSession) {
                    \App\Models\TeacherEmployment::updateOrCreate(
                        ['teacher_id' => $user->teacher_id, 'school_session_id' => $activeSession->school_session_id],
                        ['position' => $validated['role']]
                    );
                }
            }

        } elseif ($type === 'staff') {
            $user = Staff::findOrFail($id);

            $updateData = [
                'gender' => $validated['gender'] ?? $user->gender,
                'phone_number' => $validated['phone'] ?? $user->phone_number,
                'email' => $validated['email'] ?? $user->email,
                'emergency_name' => $validated['emergencyName'] ?? $user->emergency_name,
                'emergency_relation' => $validated['emergencyRelation'] ?? $user->emergency_relation,
                'emergency_phone_num' => $validated['emergencyPhone'] ?? $user->emergency_phone_num,
            ];

            if ($photoPath) $updateData['profile_pic_path'] = $photoPath;
            $user->update($updateData);

            // Update their current active session role if provided
            if (isset($validated['role'])) {
                $activeSession = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
                if ($activeSession) {
                    \App\Models\StaffEmployment::updateOrCreate(
                        ['staff_id' => $user->staff_id, 'school_session_id' => $activeSession->school_session_id],
                        ['staff_type' => $validated['role']]
                    );
                }
            }
        }

        return response()->json(['success' => true, 'message' => 'User updated successfully.']);
    }

    public function getAdminProfile(Request $request)
    {
        $admin = auth()->user();
        if (!$admin) { $admin = User::first(); }
        if (!$admin) { return response()->json(['success' => false, 'message' => 'Admin not found.'], 404); }
        return response()->json(['success' => true, 'data' => $admin]);
    }

    /**
     * Returns the currently authenticated user plus a UI role derived from
     * their position, so the dashboard can render the correct menu/view.
     */
    public function me(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'name' => trim($user->first_name . ' ' . $user->last_name),
                'email' => $user->email,
                'position' => $user->position,
                'role' => $this->resolveRole($user->position),
            ],
        ]);
    }

    /**
     * Maps a free-text job position to one of the three dashboard roles.
     */
    private function resolveRole(?string $position): string
    {
        $p = strtolower($position ?? '');

        if (str_contains($p, 'security') || str_contains($p, 'pengawal')) {
            return 'Security';
        }
        if (str_contains($p, 'teacher') || str_contains($p, 'guru') || str_contains($p, 'cikgu')) {
            return 'Teacher';
        }
        return 'Admin';
    }

    public function updateAdminProfile(Request $request)
    {
        $admin = auth()->user();
        if (!$admin) { $admin = User::first(); }
        if (!$admin) { return response()->json(['success' => false, 'message' => 'Admin not found.'], 404); }

        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($admin->user_id, 'user_id')],
            'phone_num' => 'nullable|string|max:20',
            'bio_desc' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postcode' => 'nullable|string|max:10',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_relationship' => 'nullable|string|max:50',
            'emergency_phone_num' => 'nullable|string|max:20',
            'profile_pic' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', 
        ]);

        if ($request->hasFile('profile_pic')) {
            $path = $request->file('profile_pic')->store('profile-photos', 'public');
            $validated['profile_pic_path'] = $path;
        }

        $admin->update($validated);

        return response()->json(['success' => true, 'message' => 'Profile updated successfully!', 'data' => $admin]);
    }

    public function updatePassword(Request $request)
    {
        $admin = auth()->user();
        if (!$admin) { $admin = User::first(); }
        if (!$admin) { return response()->json(['success' => false, 'message' => 'Admin not found.'], 404); }

        $request->validate(['password' => ['required', 'string', 'min:8', 'confirmed']]);
        $admin->update(['password' => Hash::make($request->password)]);

        return response()->json(['success' => true, 'message' => 'Password updated successfully!']);
    }
}