<?php

namespace App\Http\Controllers;

use App\Models\SportHouse;
use Illuminate\Http\Request;

class SportHouseController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id;

        $items = SportHouse::where('school_id', $schoolId)
            ->with('teacher:teacher_id,name')
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id'             => $s->sport_house_id,
                'name'           => $s->name,
                'teacher_id'     => $s->teacher_id,
                'teacher'        => $s->teacher ? strtoupper($s->teacher->name) : '-',
                'capacity'       => $s->capacity,
                'registeredDate' => $s->created_at->format('d-m-Y'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'capacity'   => 'nullable|integer|min:1',
            'teacher_id' => 'nullable|exists:teachers,teacher_id',
        ]);

        $schoolId = auth()->user()->school_id;

        $exists = SportHouse::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A sport house with this name already exists.'], 422);
        }

        $item = SportHouse::create([
            'school_id'  => $schoolId,
            'name'       => $request->name,
            'capacity'   => $request->capacity,
            'teacher_id' => $request->teacher_id,
            'is_active'  => true,
        ]);

        $item->load('teacher:teacher_id,name');

        return response()->json([
            'success' => true,
            'message' => 'Sport house created successfully!',
            'data'    => [
                'id'             => $item->sport_house_id,
                'name'           => $item->name,
                'teacher_id'     => $item->teacher_id,
                'teacher'        => $item->teacher ? strtoupper($item->teacher->name) : '-',
                'capacity'       => $item->capacity,
                'registeredDate' => $item->created_at->format('d-m-Y'),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'capacity'   => 'nullable|integer|min:1',
            'teacher_id' => 'nullable|exists:teachers,teacher_id',
        ]);

        $schoolId = auth()->user()->school_id;
        $item     = SportHouse::where('school_id', $schoolId)
            ->where('sport_house_id', $id)
            ->firstOrFail();

        $exists = SportHouse::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->where('sport_house_id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A sport house with this name already exists.'], 422);
        }

        $item->update([
            'name'       => $request->name,
            'capacity'   => $request->capacity,
            'teacher_id' => $request->teacher_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Sport house updated successfully!']);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $item     = SportHouse::where('school_id', $schoolId)
            ->where('sport_house_id', $id)
            ->firstOrFail();

        $item->update(['is_active' => false]);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Sport house deleted successfully!']);
    }
}
