<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    // ─── CRUD ────────────────────────────────────────────────────────────────

    public function index()
    {
        $schoolId = auth()->user()->school_id;

        $shifts = Shift::where('school_id', $schoolId)
            ->orderBy('start_time')
            ->get()
            ->map(fn($s) => $this->formatShift($s));

        return response()->json(['success' => true, 'data' => $shifts]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i',
            'is_active'  => 'boolean',
        ]);

        $schoolId    = auth()->user()->school_id;
        $isOvernight = $request->end_time <= $request->start_time;

        $conflict = $this->findOverlap($schoolId, $request->start_time, $request->end_time, $isOvernight);
        if ($conflict) {
            return response()->json([
                'message' => "This shift overlaps with \"{$conflict->name}\" ({$conflict->start_time}-{$conflict->end_time}).",
            ], 422);
        }

        $shift = Shift::create([
            'school_id'    => $schoolId,
            'name'         => $this->formatShiftName($request->start_time, $request->end_time),
            'start_time'   => $request->start_time,
            'end_time'     => $request->end_time,
            'is_overnight' => $isOvernight,
            'is_active'    => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift created.',
            'data'    => $this->formatShift($shift),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i',
            'is_active'  => 'boolean',
        ]);

        $schoolId = auth()->user()->school_id;
        $shift    = Shift::where('school_id', $schoolId)->findOrFail($id);
        $isOvernight = $request->end_time <= $request->start_time;

        $conflict = $this->findOverlap($schoolId, $request->start_time, $request->end_time, $isOvernight, $shift->id);
        if ($conflict) {
            return response()->json([
                'message' => "This shift overlaps with \"{$conflict->name}\" ({$conflict->start_time}-{$conflict->end_time}).",
            ], 422);
        }

        $shift->update([
            'name'         => $this->formatShiftName($request->start_time, $request->end_time),
            'start_time'   => $request->start_time,
            'end_time'     => $request->end_time,
            'is_overnight' => $isOvernight,
            'is_active'    => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift updated.',
            'data'    => $this->formatShift($shift->fresh()),
        ]);
    }

    public function destroy($id)
    {
        $schoolId = auth()->user()->school_id;
        $shift    = Shift::where('school_id', $schoolId)->findOrFail($id);
        $shift->delete();

        return response()->json(['success' => true, 'message' => 'Shift deleted.']);
    }

    // ─── Selectable list for check-in (self-service page + public kiosk) ────

    public function activeForCheckIn()
    {
        // Public kiosk scanning works logged-out, same fallback as AttendanceController::checkIn
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        $shifts = Shift::where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderBy('start_time')
            ->get()
            ->map(fn($s) => $this->formatShift($s));

        return response()->json(['success' => true, 'data' => $shifts]);
    }

    // ─── Overlap validation ──────────────────────────────────────────────────

    private function findOverlap(int $schoolId, string $start, string $end, bool $overnight, ?int $excludeId = null): ?Shift
    {
        $shifts = Shift::where('school_id', $schoolId)
            ->where('is_active', true)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->get();

        foreach ($shifts as $shift) {
            if ($this->shiftsOverlap($shift->start_time, $shift->end_time, $shift->is_overnight, $start, $end, $overnight)) {
                return $shift;
            }
        }

        return null;
    }

    private function shiftsOverlap(string $aStart, string $aEnd, bool $aOvernight, string $bStart, string $bEnd, bool $bOvernight): bool
    {
        $intervalsA = $this->intervalsFor($aStart, $aEnd, $aOvernight);
        $intervalsB = $this->intervalsFor($bStart, $bEnd, $bOvernight);

        foreach ($intervalsA as $a) {
            foreach ($intervalsB as $b) {
                if ($a[0] < $b[1] && $b[0] < $a[1]) {
                    return true;
                }
            }
        }

        return false;
    }

    // Represents a shift as one or two [start,end) minute-of-day intervals,
    // splitting overnight shifts at midnight so overlap can be checked with plain range math.
    private function intervalsFor(string $start, string $end, bool $overnight): array
    {
        $s = $this->toMinutes($start);
        $e = $this->toMinutes($end);

        return $overnight ? [[$s, 1440], [0, $e]] : [[$s, $e]];
    }

    private function toMinutes(string $time): int
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        return $h * 60 + $m;
    }

    // ─── Formatter ───────────────────────────────────────────────────────────

    // Shift names are derived from their time window, not admin-typed, so the
    // name can never drift out of sync with what the shift actually is —
    // e.g. "7:00 PM - 5:00 AM".
    private function formatShiftName(string $start, string $end): string
    {
        $fmt = fn(string $t) => \Illuminate\Support\Carbon::createFromFormat('H:i', $t)->format('g:i A');
        return "{$fmt($start)} - {$fmt($end)}";
    }

    private function formatShift(Shift $s): array
    {
        return [
            'id'          => $s->id,
            'name'        => $s->name,
            'startTime'   => substr($s->start_time, 0, 5),
            'endTime'     => substr($s->end_time, 0, 5),
            'isOvernight' => $s->is_overnight,
            'isActive'    => $s->is_active,
        ];
    }
}
