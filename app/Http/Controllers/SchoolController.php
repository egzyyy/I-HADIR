<?php

namespace App\Http\Controllers;

use App\Models\SchoolSession;
use App\Models\Classroom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolController extends Controller
{
    // Fetch all sessions
    public function getSessions()
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        $sessions = SchoolSession::where('school_id', $schoolId)
            ->orderBy('year', 'desc')
            ->get()
            ->map(function($session) {
                return [
                    'id' => $session->school_session_id,
                    'year' => $session->year,
                    // Format for table display (DD-MM-YYYY)
                    'startDate' => $session->start_date ? $session->start_date->format('d-m-Y') : '-',
                    // Format for HTML date input (YYYY-MM-DD)
                    'rawStartDate' => $session->start_date ? $session->start_date->format('Y-m-d') : '',
                    'status' => $session->is_active ? 'Active' : 'Inactive'
                ];
            });

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // Create a new session and Clone previous data
    public function storeSession(Request $request)
    {
        $request->validate([
            'year' => 'required|string',
            'start_date' => 'required|date',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        // 1. Identify the CURRENT active session before we change it
        $previousSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        // 2. Automatically set all old sessions to inactive when a new one is created
        SchoolSession::where('school_id', $schoolId)->update(['is_active' => false]);

        // 3. Create the NEW active session
        $newSession = SchoolSession::create([
            'school_id' => $schoolId,
            'year' => $request->year,
            'start_date' => $request->start_date,
            'is_active' => true 
        ]);

        if ($previousSession) {
            // 4. CLONE CLASSES
            $oldClasses = Classroom::where('school_id', $schoolId)
                ->where('school_session_id', $previousSession->school_session_id)
                ->get();

            foreach ($oldClasses as $oldClass) {
                $exists = Classroom::where('school_id', $schoolId)
                    ->where('school_session_id', $newSession->school_session_id)
                    ->where('name', $oldClass->name)
                    ->exists();

                if (!$exists) {
                    Classroom::create([
                        'school_id'         => $schoolId,
                        'name'              => $oldClass->name,
                        'user_id'           => $oldClass->user_id,
                        'capacity'          => $oldClass->capacity,
                        'school_session_id' => $newSession->school_session_id,
                        'is_active'         => true,
                    ]);
                }
            }

            // 5. CLONE TEACHER EMPLOYMENTS
            $oldTeacherEmployments = DB::table('teacher_employments')
                ->where('school_session_id', $previousSession->school_session_id)
                ->get();
            
            foreach ($oldTeacherEmployments as $emp) {
                DB::table('teacher_employments')->insert([
                    'teacher_id' => $emp->teacher_id,
                    'school_session_id' => $newSession->school_session_id,
                    'position' => $emp->position,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 6. CLONE STAFF EMPLOYMENTS
            $oldStaffEmployments = DB::table('staff_employments')
                ->where('school_session_id', $previousSession->school_session_id)
                ->get();

            foreach ($oldStaffEmployments as $emp) {
                DB::table('staff_employments')->insert([
                    'staff_id' => $emp->staff_id,
                    'school_session_id' => $newSession->school_session_id,
                    'staff_type' => $emp->staff_type,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json([
            'success' => true, 
            'message' => 'New school session created and data migrated successfully!'
        ]);
    }

    // Update an existing session
    public function updateSession(Request $request, $id)
    {
        $request->validate([
            'start_date' => 'required|date',
        ]);

        $session = SchoolSession::findOrFail($id);
        $session->update([
            'start_date' => $request->start_date
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'School session updated successfully!'
        ]);
    }

    public function getActiveSession()
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        $activeSession = SchoolSession::where('school_id', $schoolId)
            ->where('is_active', true)
            ->first();

        if (!$activeSession) {
            return response()->json(['success' => false, 'message' => 'No active session found.']);
        }

        return response()->json([
            'success' => true, 
            'data' => [
                'year' => $activeSession->year
            ]
        ]);
    }

    // Delete a session and completely clean up dependencies
    public function destroySession($id)
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        
        $session = SchoolSession::where('school_id', $schoolId)->findOrFail($id);

        if ($session) {
            // 1. Delete all enrollments tied to this session FIRST
            \App\Models\Enrollment::where('school_session_id', $session->school_session_id)->delete();

            // 2. Delete teacher and staff employments tied to this session
            DB::table('teacher_employments')->where('school_session_id', $session->school_session_id)->delete();
            DB::table('staff_employments')->where('school_session_id', $session->school_session_id)->delete();

            // 3. Delete all classes tied to this session
            $oldClasses = Classroom::where('school_id', $schoolId)
                ->where('school_session_id', $session->school_session_id)
                ->get();

            foreach ($oldClasses as $oldClass) {
                $oldClass->delete();
            }
        }

        // 4. Finally, delete the session itself
        $session->delete();

        // Reset all remaining sessions to inactive first (just to be safe)
        SchoolSession::where('school_id', $schoolId)->update(['is_active' => false]);

        // Find the new latest session based on year
        $latestSession = SchoolSession::where('school_id', $schoolId)
            ->orderBy('year', 'desc')
            ->first();

        // If there is still a session left, make it the active one
        if ($latestSession) {
            $latestSession->update(['is_active' => true]);
        }

        return response()->json([
            'success' => true, 
            'message' => 'School session deleted successfully!'
        ]);
    }
}