<?php

namespace App\Http\Controllers;

use App\Models\CoCurricular;
use Illuminate\Http\Request;

class CoCurricularController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id;

        $items = CoCurricular::where('school_id', $schoolId)
            ->with('teacher:teacher_id,name')
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->co_curricular_id,
                'name'           => $c->name,
                'teacher_id'     => $c->teacher_id,
                'teacher'        => $c->teacher ? strtoupper($c->teacher->name) : '-',
                'capacity'       => $c->capacity,
                'registeredDate' => $c->created_at->format('d-m-Y'),
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

        $exists = CoCurricular::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A co-curricular with this name already exists.'], 422);
        }

        $item = CoCurricular::create([
            'school_id'  => $schoolId,
            'name'       => $request->name,
            'capacity'   => $request->capacity,
            'teacher_id' => $request->teacher_id,
            'is_active'  => true,
        ]);

        $item->load('teacher:teacher_id,name');

        return response()->json([
            'success' => true,
            'message' => 'Co-curricular created successfully!',
            'data'    => [
                'id'             => $item->co_curricular_id,
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
        $item     = CoCurricular::where('school_id', $schoolId)
            ->where('co_curricular_id', $id)
            ->firstOrFail();

        $exists = CoCurricular::where('school_id', $schoolId)
            ->where('name', $request->name)
            ->where('co_curricular_id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A co-curricular with this name already exists.'], 422);
        }

        $item->update([
            'name'       => $request->name,
            'capacity'   => $request->capacity,
            'teacher_id' => $request->teacher_id,
        ]);

        return response()->json(['success' => true, 'message' => 'Co-curricular updated successfully!']);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $item     = CoCurricular::where('school_id', $schoolId)
            ->where('co_curricular_id', $id)
            ->firstOrFail();

        $item->update(['is_active' => false]);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Co-curricular deleted successfully!']);
    }
}
