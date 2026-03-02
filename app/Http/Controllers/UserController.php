<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use App\Models\User;
use App\Models\SchoolSession;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        
        // Base queries
        $studentsQuery = Student::where('school_id', $schoolId);
        $teachersQuery = Teacher::where('school_id', $schoolId);
        $staffsQuery = Staff::where('school_id', $schoolId);

        // Filter by Session if requested
        if ($request->has('session_id') && $request->session_id !== 'all') {
            $session = SchoolSession::find($request->session_id);
            
            if ($session) {
                $startDate = $session->start_date;
                
                // Find the next session chronologically to establish the end date
                $nextSession = SchoolSession::where('school_id', $schoolId)
                    ->where('start_date', '>', $startDate)
                    ->orderBy('start_date', 'asc')
                    ->first();

                $endDate = $nextSession ? $nextSession->start_date : now()->addYear(1);

                $studentsQuery->whereBetween('created_at', [$startDate, $endDate]);
                $teachersQuery->whereBetween('created_at', [$startDate, $endDate]);
                $staffsQuery->whereBetween('created_at', [$startDate, $endDate]);
            }
        }

        // Fetch and format Data
        $students = $studentsQuery->orderBy('created_at', 'desc')->get()->map(function($item) {
            return [
                'id' => $item->student_id,
                'name' => $item->name,
                'ic_number' => $item->ic_number ?? '-', 
                'phone' => $item->phone_num ?? '-', 
                'gender' => $item->gender,
                'role' => $item->class ?? 'Student', 
                'type' => 'student',
                'registeredDate' => $item->created_at->format('d-m-Y'),
                'raw_data' => $item
            ];
        });

        $teachers = $teachersQuery->orderBy('created_at', 'desc')->get()->map(function($item) {
            return [
                'id' => $item->teacher_id,
                'name' => $item->name,
                'ic_number' => $item->ic_number ?? '-',
                'phone' => $item->phone_number ?? '-',
                'gender' => $item->gender,
                'role' => $item->position ?? 'Teacher',
                'type' => 'teacher',
                'registeredDate' => $item->created_at->format('d-m-Y'),
                'raw_data' => $item
            ];
        });

        $staffs = $staffsQuery->orderBy('created_at', 'desc')->get()->map(function($item) {
            return [
                'id' => $item->staff_id,
                'name' => $item->name,
                'ic_number' => $item->ic_number ?? '-',
                'phone' => $item->phone_number ?? '-',
                'gender' => $item->gender,
                'role' => $item->staff_type ?? 'Staff',
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

    public function destroy($type, $id)
    {
        // Handle Soft Deletions based on type
        if ($type === 'student') Student::where('student_id', $id)->delete();
        elseif ($type === 'teacher') Teacher::where('teacher_id', $id)->delete();
        elseif ($type === 'staff') Staff::where('staff_id', $id)->delete();
        
        return response()->json(['success' => true]);
    }

    public function getAdminProfile(Request $request)
    {
        // Get the currently authenticated admin
        $admin = auth()->user();
        
        // Fallback for development if no one is logged in
        if (!$admin) {
            $admin = User::first(); 
        }

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin not found.'], 404);
        }

        return response()->json([
            'success' => true, 
            'data' => $admin
        ]);
    }

    public function updateAdminProfile(Request $request)
    {
        $admin = auth()->user();
        
        // Fallback for development if no one is logged in
        if (!$admin) {
            $admin = User::first(); 
        }

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin not found.'], 404);
        }

        // Validate the incoming data
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
            'profile_pic' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Validate image (Max 2MB)
        ]);

        // Handle File Upload
        if ($request->hasFile('profile_pic')) {
            // Delete old picture if it exists (optional but good practice)
            // if ($admin->profile_pic_path) { \Illuminate\Support\Facades\Storage::disk('public')->delete($admin->profile_pic_path); }
            
            $path = $request->file('profile_pic')->store('profile-photos', 'public');
            $validated['profile_pic_path'] = $path;
        }

        // Update the database
        $admin->update($validated);

        return response()->json([
            'success' => true, 
            'message' => 'Profile updated successfully!',
            'data' => $admin // Return fresh data to React
        ]);
    }

    public function updatePassword(Request $request)
    {
        $admin = auth()->user();
        
        // Fallback for development if no one is logged in
        if (!$admin) {
            $admin = User::first(); 
        }

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin not found.'], 404);
        }

        // Validate the incoming request
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Securely hash and update the password
        $admin->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->password)
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Password updated successfully!'
        ]);
    }
}