<?php

namespace App\Http\Controllers;

use App\Models\AttendanceSetting;
use Illuminate\Http\Request;

class TimeSettingController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id;

        $settings = AttendanceSetting::where('school_id', $schoolId)
            ->orderByDesc('is_default')
            ->get()
            ->map(fn($s) => $this->format($s));

        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'             => 'required|string|max:255',
            'check_in_start'    => 'required|date_format:H:i',
            'check_in_deadline' => 'required|date_format:H:i',
            'late_threshold'    => 'required|date_format:H:i',
            'check_out_time'    => 'required|date_format:H:i',
            'is_default'        => 'boolean',
        ]);

        $schoolId = auth()->user()->school_id;

        // Only one default allowed
        if ($request->boolean('is_default')) {
            AttendanceSetting::where('school_id', $schoolId)->update(['is_default' => false]);
        }

        $setting = AttendanceSetting::create([
            'school_id'         => $schoolId,
            'title'             => $request->title,
            'check_in_start'    => $request->check_in_start,
            'check_in_deadline' => $request->check_in_deadline,
            'late_threshold'    => $request->late_threshold,
            'check_out_time'    => $request->check_out_time,
            'is_default'        => $request->boolean('is_default'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Time setting created.',
            'data'    => $this->format($setting),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title'             => 'required|string|max:255',
            'check_in_start'    => 'required|date_format:H:i',
            'check_in_deadline' => 'required|date_format:H:i',
            'late_threshold'    => 'required|date_format:H:i',
            'check_out_time'    => 'required|date_format:H:i',
            'is_default'        => 'boolean',
        ]);

        $schoolId = auth()->user()->school_id;
        $setting  = AttendanceSetting::where('school_id', $schoolId)->findOrFail($id);

        if ($request->boolean('is_default')) {
            AttendanceSetting::where('school_id', $schoolId)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $setting->update([
            'title'             => $request->title,
            'check_in_start'    => $request->check_in_start,
            'check_in_deadline' => $request->check_in_deadline,
            'late_threshold'    => $request->late_threshold,
            'check_out_time'    => $request->check_out_time,
            'is_default'        => $request->boolean('is_default'),
        ]);

        return response()->json(['success' => true, 'message' => 'Time setting updated.']);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $setting  = AttendanceSetting::where('school_id', $schoolId)->findOrFail($id);
        $setting->delete();

        return response()->json(['success' => true, 'message' => 'Time setting deleted.']);
    }

    private function format(AttendanceSetting $s): array
    {
        return [
            'id'               => $s->id,
            'title'            => $s->title,
            'checkInStart'     => substr($s->check_in_start, 0, 5),
            'checkInDeadline'  => substr($s->check_in_deadline, 0, 5),
            'lateThreshold'    => substr($s->late_threshold, 0, 5),
            'checkOutTime'     => substr($s->check_out_time, 0, 5),
            'isDefault'        => $s->is_default,
        ];
    }
}
