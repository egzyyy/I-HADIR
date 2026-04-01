<?php

namespace App\Http\Controllers;

use App\Models\AttendanceSetting;
use App\Models\AttendanceSettingOverride;
use Illuminate\Http\Request;

class TimeSettingController extends Controller
{
    // ─── Settings CRUD ───────────────────────────────────────────────────────

    public function index()
    {
        $schoolId = auth()->user()->school_id;

        $settings = AttendanceSetting::where('school_id', $schoolId)
            ->orderByDesc('is_default')
            ->get()
            ->map(fn($s) => $this->formatSetting($s));

        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'            => 'required|string|max:255',
            'check_in_start'   => 'required|date_format:H:i',
            'check_in_deadline'=> 'required|date_format:H:i',
            'late_threshold'   => 'required|date_format:H:i',
            'absent_threshold' => 'nullable|date_format:H:i',
            'check_out_time'   => 'required|date_format:H:i',
            'is_default'       => 'boolean',
            'applies_to_days'  => 'nullable|array',
            'applies_to_days.*'=> 'integer|between:1,7',
        ]);

        $schoolId = auth()->user()->school_id;

        if ($request->boolean('is_default')) {
            AttendanceSetting::where('school_id', $schoolId)->update(['is_default' => false]);
        }

        $setting = AttendanceSetting::create([
            'school_id'         => $schoolId,
            'title'             => $request->title,
            'check_in_start'    => $request->check_in_start,
            'check_in_deadline' => $request->check_in_deadline,
            'late_threshold'    => $request->late_threshold,
            'absent_threshold'  => $request->absent_threshold,
            'check_out_time'    => $request->check_out_time,
            'is_default'        => $request->boolean('is_default'),
            'applies_to_days'   => $request->applies_to_days ?? [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Time setting created.',
            'data'    => $this->formatSetting($setting),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title'            => 'required|string|max:255',
            'check_in_start'   => 'required|date_format:H:i',
            'check_in_deadline'=> 'required|date_format:H:i',
            'late_threshold'   => 'required|date_format:H:i',
            'absent_threshold' => 'nullable|date_format:H:i',
            'check_out_time'   => 'required|date_format:H:i',
            'is_default'       => 'boolean',
            'applies_to_days'  => 'nullable|array',
            'applies_to_days.*'=> 'integer|between:1,7',
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
            'absent_threshold'  => $request->absent_threshold,
            'check_out_time'    => $request->check_out_time,
            'is_default'        => $request->boolean('is_default'),
            'applies_to_days'   => $request->applies_to_days ?? [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Time setting updated.',
            'data'    => $this->formatSetting($setting->fresh()),
        ]);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $setting  = AttendanceSetting::where('school_id', $schoolId)->findOrFail($id);
        $setting->delete();

        return response()->json(['success' => true, 'message' => 'Time setting deleted.']);
    }

    // ─── Calendar Overrides CRUD ─────────────────────────────────────────────

    public function getOverrides(Request $request)
    {
        $schoolId = auth()->user()->school_id;

        $query = AttendanceSettingOverride::where('school_id', $schoolId)
            ->with('setting');

        // Optionally filter by month: ?month=2026-04
        if ($request->month) {
            $query->whereYear('date', substr($request->month, 0, 4))
                  ->whereMonth('date', substr($request->month, 5, 2));
        }

        $overrides = $query->orderBy('date')->get()
            ->map(fn($o) => $this->formatOverride($o));

        return response()->json(['success' => true, 'data' => $overrides]);
    }

    public function storeOverride(Request $request)
    {
        $request->validate([
            'date'       => 'required|date',
            'setting_id' => 'nullable|integer',
            'note'       => 'nullable|string|max:255',
        ]);

        $schoolId = auth()->user()->school_id;

        // Validate setting belongs to this school if provided
        if ($request->setting_id) {
            AttendanceSetting::where('school_id', $schoolId)->findOrFail($request->setting_id);
        }

        $override = AttendanceSettingOverride::updateOrCreate(
            ['school_id' => $schoolId, 'date' => $request->date],
            [
                'setting_id' => $request->setting_id,
                'note'       => $request->note,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Override saved.',
            'data'    => $this->formatOverride($override->load('setting')),
        ], 201);
    }

    public function updateOverride(Request $request, $id)
    {
        $request->validate([
            'setting_id' => 'nullable|integer',
            'note'       => 'nullable|string|max:255',
        ]);

        $schoolId = auth()->user()->school_id;
        $override = AttendanceSettingOverride::where('school_id', $schoolId)->findOrFail($id);

        if ($request->setting_id) {
            AttendanceSetting::where('school_id', $schoolId)->findOrFail($request->setting_id);
        }

        $override->update([
            'setting_id' => $request->setting_id,
            'note'       => $request->note,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Override updated.',
            'data'    => $this->formatOverride($override->load('setting')),
        ]);
    }

    public function destroyOverride($id)
    {
        $schoolId = auth()->user()->school_id;
        $override = AttendanceSettingOverride::where('school_id', $schoolId)->findOrFail($id);
        $override->delete();

        return response()->json(['success' => true, 'message' => 'Override removed.']);
    }

    // ─── Formatters ──────────────────────────────────────────────────────────

    private function formatSetting(AttendanceSetting $s): array
    {
        return [
            'id'              => $s->id,
            'title'           => $s->title,
            'checkInStart'    => substr($s->check_in_start, 0, 5),
            'checkInDeadline' => substr($s->check_in_deadline, 0, 5),
            'lateThreshold'   => substr($s->late_threshold, 0, 5),
            'absentThreshold' => $s->absent_threshold ? substr($s->absent_threshold, 0, 5) : null,
            'checkOutTime'    => substr($s->check_out_time, 0, 5),
            'isDefault'       => $s->is_default,
            'appliesToDays'   => $s->applies_to_days ?? [],
        ];
    }

    private function formatOverride(AttendanceSettingOverride $o): array
    {
        return [
            'id'          => $o->id,
            'date'        => $o->date->format('Y-m-d'),
            'setting_id'  => $o->setting_id,
            'settingTitle'=> $o->setting?->title,
            'note'        => $o->note,
            'isClosed'    => $o->setting_id === null,
        ];
    }
}
