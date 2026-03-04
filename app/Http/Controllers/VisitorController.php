<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    // Fetch ONLY visitors currently in the premise (for the public visitor page)
    public function index()
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        $visitors = Visitor::where('school_id', $schoolId)
            ->where('status', 'In Premise') 
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($visitor) {
                return [
                    'id' => $visitor->visitor_id,
                    'name' => $visitor->name,
                    'passNo' => $visitor->pass_badge_no ?? '-',
                    'plateNumber' => $visitor->plate_number ?? '-',
                    'date' => $visitor->created_at->format('d M Y, h:i A')
                ];
            });

        return response()->json([
            'success' => true, 
            'data' => $visitors
        ]);
    }

    // NEW: Fetch ALL visitors (for the Admin Dashboard list)
    public function getAllVisitors()
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        $visitors = Visitor::where('school_id', $schoolId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($visitor) {
                return [
                    'id' => $visitor->visitor_id,
                    'name' => $visitor->name,
                    'phone' => $visitor->phone_number,
                    'plateNumber' => $visitor->plate_number ?? '-',
                    'category' => $visitor->category,
                    'personToMeet' => $visitor->person_to_meet,
                    'passNo' => $visitor->pass_badge_no ?? '-',
                    'purpose' => $visitor->purpose,
                    'status' => $visitor->status,
                    'timeIn' => $visitor->created_at->format('d/m/Y, h:i A'),
                    'timeOut' => $visitor->check_out_time ? $visitor->check_out_time->format('d/m/Y, h:i A') : '-',
                    'notes' => $visitor->notes ?? '-'
                ];
            });

        return response()->json([
            'success' => true, 
            'data' => $visitors
        ]);
    }

    // Save a new visitor
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'plateNumber' => 'nullable|string|max:20',
            'category' => 'required|string|max:100',
            'personToMeet' => 'required|string|max:255',
            'passBadgeNo' => 'nullable|string|max:50',
            'purpose' => 'required|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        Visitor::create([
            'school_id' => $schoolId,
            'name' => $request->name,
            'phone_number' => $request->phone,
            'plate_number' => $request->plateNumber,
            'category' => $request->category,
            'person_to_meet' => $request->personToMeet,
            'pass_badge_no' => $request->passBadgeNo,
            'purpose' => $request->purpose,
            'notes' => $request->notes,
            'status' => 'In Premise',
        ]);

        return response()->json(['success' => true, 'message' => 'Visitor checked in successfully!']);
    }

    // Check out a visitor
    public function checkout($id)
    {
        $visitor = Visitor::findOrFail($id);
        
        $visitor->update([
            'status' => 'Checked Out',
            'check_out_time' => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Visitor checked out!']);
    }
}