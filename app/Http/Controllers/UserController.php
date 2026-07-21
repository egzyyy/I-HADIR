<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\SchoolSession;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $authUser = auth()->user();
        $schoolId = $authUser ? $authUser->school_id : 1;
        $isTeacher = $authUser && $authUser->user_type === 'teacher';
        
        $studentsQuery = Student::where('school_id', $schoolId);
        
        // Query for teachers
        $teachersQuery = User::where('school_id', $schoolId)
            ->where('user_type', 'teacher');
        
        // Query for ALL staff (both security_staff and staff)
        $staffsQuery = User::where('school_id', $schoolId)
            ->whereIn('user_type', ['security_staff', 'staff']);

        $sessionId = $request->session_id;

        // Filter by Session
        if ($sessionId && $sessionId !== 'all') {
            
            $session = SchoolSession::find($sessionId);
            
            if ($session) {

                // ── ACTIVE SESSION ──
                // Show ALL non-deleted users. They persist across sessions.
                // Deleting a user removes them from this view immediately.
                if ($session->is_active) {

                    $studentsQuery->with(['enrollments' => function($query) use ($sessionId, $isTeacher, $authUser) {
                        $query->where('school_session_id', $sessionId)
                            ->when($isTeacher, function ($q) use ($authUser) {
                                $q->whereHas('classroom', function ($classroomQuery) use ($authUser) {
                                    $classroomQuery->where('user_id', $authUser->user_id);
                                });
                            })
                            ->with('classroom');
                    }]);

                    if ($isTeacher) {
                        $studentsQuery->whereHas('enrollments', function ($query) use ($sessionId, $authUser) {
                            $query->where('school_session_id', $sessionId)
                                ->whereHas('classroom', function ($classroomQuery) use ($authUser) {
                                    $classroomQuery->where('user_id', $authUser->user_id);
                                });
                        });
                    }

                    // Teachers & Staff: no extra filters needed, base query already excludes deleted

                // ── PAST SESSION ──
                // Include soft-deleted users who were active during this session period.
                } else {
                    $startDate = $session->start_date;

                    // Use the session's own end_date for the upper bound.
                    // endOfDay() ensures users created ON the end date are included.
                    if ($session->end_date) {
                        $endDate = $session->end_date->endOfDay();
                    } else {
                        $nextSession = SchoolSession::where('school_id', $schoolId)
                            ->where('start_date', '>', $startDate)
                            ->orderBy('start_date', 'asc')
                            ->first();
                        $endDate = $nextSession ? $nextSession->start_date : now()->addYears(10);
                    }

                    // STUDENTS: Include soft-deleted for historical session view
                    $studentsQuery->withTrashed()->where('created_at', '<=', $endDate)
                        ->where(function($q) use ($startDate) {
                            $q->whereNull('deleted_at')
                              ->orWhere('deleted_at', '>=', $startDate);
                        })->with(['enrollments' => function($query) use ($sessionId, $isTeacher, $authUser) {
                            $query->where('school_session_id', $sessionId)
                                ->when($isTeacher, function ($q) use ($authUser) {
                                    $q->whereHas('classroom', function ($classroomQuery) use ($authUser) {
                                        $classroomQuery->where('user_id', $authUser->user_id);
                                    });
                                })
                                ->with('classroom');
                        }]);

                    if ($isTeacher) {
                        $studentsQuery->whereHas('enrollments', function ($query) use ($sessionId, $authUser) {
                            $query->where('school_session_id', $sessionId)
                                ->whereHas('classroom', function ($classroomQuery) use ($authUser) {
                                    $classroomQuery->where('user_id', $authUser->user_id);
                                });
                        });
                    }

                    // USERS (Teachers & Staff): Include soft-deleted for historical session view
                    $teachersQuery->withTrashed()->where('created_at', '<=', $endDate)
                        ->where(function($q) use ($startDate) {
                            $q->whereNull('deleted_at')
                              ->orWhere('deleted_at', '>=', $startDate);
                        });
                    
                    $staffsQuery->withTrashed()->where('created_at', '<=', $endDate)
                        ->where(function($q) use ($startDate) {
                            $q->whereNull('deleted_at')
                              ->orWhere('deleted_at', '>=', $startDate);
                        });
                }
            }

        } else {
            // All Time History — include soft-deleted users
            $studentsQuery->withTrashed()->with(['enrollments' => function($query) use ($isTeacher, $authUser) {
                $query->when($isTeacher, function ($q) use ($authUser) {
                    $q->whereHas('classroom', function ($classroomQuery) use ($authUser) {
                        $classroomQuery->where('user_id', $authUser->user_id);
                    });
                })->latest('created_at')->with('classroom');
            }]);

            $teachersQuery->withTrashed();
            $staffsQuery->withTrashed();

            if ($isTeacher) {
                $studentsQuery->whereHas('enrollments', function ($query) use ($authUser) {
                    $query->whereHas('classroom', function ($classroomQuery) use ($authUser) {
                        $classroomQuery->where('user_id', $authUser->user_id);
                    });
                });
            }
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
                'registeredDate' => $item->created_at->format('d/m/Y'),
                'raw_data' => $item
            ];
        });

        // Fetch and format Teachers
        $teachers = $isTeacher
            ? collect()
            : $teachersQuery->orderBy('created_at', 'desc')
                ->get()
                ->map(function($item) use ($sessionId) {
                    
                    // Pull historical records
                    $history = DB::table('teacher_employments')
                        ->join('school_sessions', 'teacher_employments.school_session_id', '=', 'school_sessions.school_session_id')
                        ->where('teacher_id', $item->user_id)
                        ->orderBy('school_sessions.start_date', 'desc')
                        ->get();

                    $roleDisplay = $item->position ?? 'Unassigned';

                    // Determine role in the requested session
                    if ($sessionId && $sessionId !== 'all') {
                        $idx = $history->search(fn($h) => $h->school_session_id == $sessionId);
                        if ($idx !== false) {
                            $roleDisplay = $history[$idx]->position;
                        }
                    }

                    return [
                        'id' => $item->user_id,
                        'name' => $item->full_name ?? trim($item->first_name . ' ' . $item->last_name),
                        'ic_number' => $item->ic_number ?? '-',
                        'phone' => $item->phone_num ?? '-',
                        'gender' => $item->gender,
                        'role' => $roleDisplay,
                        'type' => 'teacher',
                        'registeredDate' => $item->created_at->format('d/m/Y'),
                        'has_password' => !empty($item->password),
                        'raw_data' => $item
                    ];
                });

        // Fetch and format Staff
        $staffs = $isTeacher
            ? collect()
            : $staffsQuery->orderBy('created_at', 'desc')
                ->get()
                ->map(function($item) use ($sessionId) {
                    
                    // Pull historical records
                    $history = DB::table('staff_employments')
                        ->join('school_sessions', 'staff_employments.school_session_id', '=', 'school_sessions.school_session_id')
                        ->where('staff_id', $item->user_id)
                        ->orderBy('school_sessions.start_date', 'desc')
                        ->get();

                    $roleDisplay = $item->position ?? 'Unassigned';

                    if ($sessionId && $sessionId !== 'all') {
                        $idx = $history->search(fn($h) => $h->school_session_id == $sessionId);
                        if ($idx !== false) {
                            $roleDisplay = $history[$idx]->staff_type;
                        }
                    }

                    // Pre-format before sending to frontend
                    $roleDisplay = ucwords(str_replace('_', ' ', $roleDisplay));

                    return [
                        'id' => $item->user_id,
                        'name' => $item->full_name ?? trim($item->first_name . ' ' . $item->last_name),
                        'ic_number' => $item->ic_number ?? '-',
                        'phone' => $item->phone_num ?? '-',
                        'gender' => $item->gender,
                        'role' => $roleDisplay,
                        'type' => 'staff',
                        'registeredDate' => $item->created_at->format('d/m/Y'),
                        'has_password' => !empty($item->password),
                        'raw_data' => $item
                    ];
                });

        return response()->json([
            'student' => $students,
            'teacher' => $teachers,
            'staff' => $staffs
        ]);
    }

    public function destroy($type, $id)
    {
        if ($type === 'student') {
            Student::where('student_id', $id)->delete();
        } elseif ($type === 'teacher') {
            User::where('user_id', $id)->where('user_type', 'teacher')->delete();
        } elseif ($type === 'staff') {
            User::where('user_id', $id)->whereIn('user_type', ['staff', 'security_staff'])->delete();
        }
        
        return response()->json(['success' => true]);
    }

    public function update(Request $request, $id)
    {
        $type = $request->type;
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        $user = User::where('user_id', $id)->where('school_id', $schoolId)->first();

        // Common validation rules for all types
        $rules = [
            'gender' => 'nullable|in:Male,Female',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'streetAddress' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postcode' => 'nullable|string|max:10',
            'country' => 'nullable|string',
            'emergencyName' => 'nullable|string|max:255',
            'emergencyRelation' => 'nullable|string|max:50',
            'emergencyPhone' => 'nullable|string|max:20',
            'profilePic' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:3072',
        ];

        // Type-specific validation
        if ($type === 'student') {
            $rules['fatherPhone'] = 'nullable|string|max:20';
            $rules['motherPhone'] = 'nullable|string|max:20';
        } else if ($type === 'staff') {
            $rules['position'] = 'nullable|string|max:255';
            $rules['user_type'] = 'nullable|string|max:255';
            $rules['newPassword'] = 'nullable|string|min:8';
        }
        else {
            $rules['position'] = 'nullable|string|max:255';
            $rules['newPassword'] = 'nullable|string|min:8';
        }

        $validated = $request->validate($rules);

        // Handle File Upload
        $photoPath = null;
        if ($request->hasFile('profilePic')) {
            $photoPath = $request->file('profilePic')->store('profile-photos', 'public');
        }

        // --- UPDATE LOGIC ---
        if ($type === 'student') {
            $studentUser = Student::findOrFail($id);
            
            $updateData = [
                'gender' => $validated['gender'] ?? $studentUser->gender,
                'phone_num' => $validated['phone'] ?? $studentUser->phone_num,
                'email' => $validated['email'] ?? $studentUser->email,
                'street_address' => $validated['streetAddress'] ?? $studentUser->street_address,
                'city' => $validated['city'] ?? $studentUser->city,
                'state' => $validated['state'] ?? $studentUser->state,
                'postcode' => $validated['postcode'] ?? $studentUser->postcode,
                'country' => $validated['country'] ?? $studentUser->country,
                'father_phone_num' => $validated['fatherPhone'] ?? $studentUser->father_phone_num,
                'mother_phone_num' => $validated['motherPhone'] ?? $studentUser->mother_phone_num,
                'emergency_name' => $validated['emergencyName'] ?? $studentUser->emergency_name,
                'emergency_relation' => $validated['emergencyRelation'] ?? $studentUser->emergency_relation,
                'emergency_phone_num' => $validated['emergencyPhone'] ?? $studentUser->emergency_phone_num,
            ];

            if ($photoPath) $updateData['profile_pic_path'] = $photoPath;
            $studentUser->update($updateData);

        } elseif ($type === 'teacher') {
            $teacherUser = User::findOrFail($id);

            $updateData = [
                'gender' => $validated['gender'] ?? $teacherUser->gender,
                'phone_num' => $validated['phone'] ?? $teacherUser->phone_num,
                'email' => $validated['email'] ?? $teacherUser->email,
                'street_address' => $validated['streetAddress'] ?? $teacherUser->street_address,
                'city' => $validated['city'] ?? $teacherUser->city,
                'state' => $validated['state'] ?? $teacherUser->state,
                'postcode' => $validated['postcode'] ?? $teacherUser->postcode,
                'country' => $validated['country'] ?? $teacherUser->country,
                'emergency_contact_name' => $validated['emergencyName'] ?? $teacherUser->emergency_contact_name,
                'emergency_relationship' => $validated['emergencyRelation'] ?? $teacherUser->emergency_relationship,
                'emergency_phone_num' => $validated['emergencyPhone'] ?? $teacherUser->emergency_phone_num,
            ];

            // Update position AND track in history table
            if (isset($validated['position'])) {
                $updateData['position'] = $validated['position'];
                
                $activeSession = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
                if ($activeSession) {
                    DB::table('teacher_employments')->updateOrInsert(
                        ['teacher_id' => $teacherUser->user_id, 'school_session_id' => $activeSession->school_session_id],
                        ['position' => $validated['position'], 'updated_at' => now()]
                    );
                }
            }

            // Check if teacher has password
            if (empty($teacherUser->password) && empty($validated['newPassword'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Teachers require a password to log in. Please set a password before saving.'
                ], 422);
            }

            // Update password if provided
            if (!empty($validated['newPassword'])) {
                $updateData['password'] = Hash::make($validated['newPassword']);
            }

            if ($photoPath) $updateData['profile_pic_path'] = $photoPath;
            $teacherUser->update($updateData);

        } else {
            $staffUser = User::findOrFail($id);

            $updateData = [
                'gender' => $validated['gender'] ?? $staffUser->gender,
                'phone_num' => $validated['phone'] ?? $staffUser->phone_num,
                'email' => $validated['email'] ?? $staffUser->email,
                'street_address' => $validated['streetAddress'] ?? $staffUser->street_address,
                'city' => $validated['city'] ?? $staffUser->city,
                'state' => $validated['state'] ?? $staffUser->state,
                'postcode' => $validated['postcode'] ?? $staffUser->postcode,
                'country' => $validated['country'] ?? $staffUser->country,
                'emergency_contact_name' => $validated['emergencyName'] ?? $staffUser->emergency_contact_name,
                'emergency_relationship' => $validated['emergencyRelation'] ?? $staffUser->emergency_relationship,
                'emergency_phone_num' => $validated['emergencyPhone'] ?? $staffUser->emergency_phone_num,
            ];

            // Update position AND track in history table
            if (isset($validated['position'])) {
                $updateData['position'] = $validated['position'];
                
                if ($updateData['position'] == "Security Staff"){
                    $updateData['user_type'] = 'security_staff';
                    
                    // Check if user has password when changing to Security Staff
                    if (empty($staffUser->password) && empty($validated['newPassword'])) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Security Staff requires a password to log in. Please set a password before saving.'
                        ], 422);
                    }
                } else {
                    $updateData['user_type'] = 'staff';
                }

                $activeSession = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
                if ($activeSession) {
                    DB::table('staff_employments')->updateOrInsert(
                        ['staff_id' => $staffUser->user_id, 'school_session_id' => $activeSession->school_session_id],
                        ['staff_type' => $validated['position'], 'updated_at' => now()]
                    );
                }
            }

            // Update password if provided
            if (!empty($validated['newPassword'])) {
                $updateData['password'] = Hash::make($validated['newPassword']);
            }

            if ($photoPath) $updateData['profile_pic_path'] = $photoPath;
            $staffUser->update($updateData);
        }

        return response()->json(['success' => true, 'message' => 'User updated successfully.']);
    }

    public function getMyProfile(Request $request)
    {
        $admin = auth()->user();
        if (!$admin) { $admin = User::first(); }
        if (!$admin) { return response()->json(['success' => false, 'message' => 'Admin not found.'], 404); }
        return response()->json(['success' => true, 'data' => $admin]);
    }

    /**
     * Returns the currently authenticated user plus a UI role derived from
     * their user_type or position, so the dashboard can render the correct menu/view.
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
                'name' => $user->full_name ?? trim($user->first_name . ' ' . $user->last_name),
                'email' => $user->email,
                'position' => $user->position,
                'role' => $this->resolveRole($user),
            ],
        ]);
    }

    /**
     * Maps user_type or position to one of the three dashboard roles.
     */
    private function resolveRole($user): string
    {
        // First check user_type enum
        if ($user->user_type === 'security_staff') {
            return 'Security';
        }
        if ($user->user_type === 'teacher') {
            return 'Teacher';
        }
        
        // Fallback to position-based detection for legacy/admin users
        $p = strtolower($user->position ?? '');
        if (str_contains($p, 'security') || str_contains($p, 'pengawal')) {
            return 'Security';
        }
        if (str_contains($p, 'teacher') || str_contains($p, 'guru') || str_contains($p, 'cikgu')) {
            return 'Teacher';
        }
        
        return 'Admin';
    }

    public function updateMyProfile(Request $request)
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
            'street_address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postcode' => 'nullable|string|max:10',
            'country' => 'nullable|string',
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