<?php

namespace App\Http\Controllers;

use App\Models\SchoolSession;
use Illuminate\Http\Request;

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

    // Create a new session
    public function storeSession(Request $request)
    {
        $request->validate([
            'year' => 'required|string',
            'start_date' => 'required|date',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        // Automatically set all old sessions to inactive when a new one is created
        SchoolSession::where('school_id', $schoolId)->update(['is_active' => false]);

        // Create the new active session
        SchoolSession::create([
            'school_id' => $schoolId,
            'year' => $request->year,
            'start_date' => $request->start_date,
            'is_active' => true 
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'New school session created successfully!'
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

    // Delete a session and automatically set the latest remaining to active
    public function destroySession($id)
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        
        $session = SchoolSession::where('school_id', $schoolId)->findOrFail($id);
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