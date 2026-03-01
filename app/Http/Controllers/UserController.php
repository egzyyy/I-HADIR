<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        // Fetch and format Students
        $students = Student::orderBy('created_at', 'desc')->get()->map(function($item) {
            return [
                'id' => $item->student_id,
                'name' => $item->name,
                'phone' => $item->phone_num ?? '-', // Note: Students use phone_num
                'gender' => $item->gender,
                'role' => $item->class ?? 'Student', // Show class as role
                'type' => 'student',
                'registeredDate' => $item->created_at->format('d-m-Y'),
                'raw_data' => $item // Sent to frontend for Info Modal
            ];
        });

        // Fetch and format Teachers
        $teachers = Teacher::orderBy('created_at', 'desc')->get()->map(function($item) {
            return [
                'id' => $item->teacher_id,
                'name' => $item->name,
                'phone' => $item->phone_number ?? '-',
                'gender' => $item->gender,
                'role' => $item->position ?? 'Teacher',
                'type' => 'teacher',
                'registeredDate' => $item->created_at->format('d-m-Y'),
                'raw_data' => $item
            ];
        });

        // Fetch and format Staffs
        $staffs = Staff::orderBy('created_at', 'desc')->get()->map(function($item) {
            return [
                'id' => $item->staff_id,
                'name' => $item->name,
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
}