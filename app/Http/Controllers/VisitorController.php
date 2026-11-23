<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use App\Models\VisitorLog;
use Illuminate\Http\Request;
use App\Models\FacilityLog;
use Illuminate\Support\Carbon;

class VisitorController extends Controller
{
    private function normalizeIc(?string $ic): string
    {
        return preg_replace('/[^0-9]/', '', (string) $ic);
    }

    // 1. Check if visitor IC exists AND whether they are currently In Premise
    public function checkIc(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string|max:20',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        $cleanIc  = $this->normalizeIc($request->ic_number);

        if (strlen($cleanIc) < 6) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter a valid IC number.',
            ], 422);
        }

        $visitor = Visitor::where('school_id', $schoolId)
            ->where('ic_number', $cleanIc)
            ->first();

        if ($visitor) {
            $activeLog = VisitorLog::where('school_id', $schoolId)
                ->where('visitor_id', $visitor->visitor_id)
                ->where('status', 'In Premise')
                ->latest('check_in_time')
                ->first();

            return response()->json([
                'success'    => true,
                'found'      => true,
                'in_premise' => (bool) $activeLog,
                'message'    => $activeLog
                    ? 'This visitor is already checked in to the school premise. Please check out first.'
                    : 'Visitor IC found.',
                'visitor'    => [
                    'visitor_id' => $visitor->visitor_id,
                    'ic_number'  => $visitor->ic_number,
                    'name'       => $visitor->name,
                ],
            ]);
        }

        return response()->json([
            'success'    => true,
            'found'      => false,
            'in_premise' => false,
            'message'    => 'Visitor IC not found. Please register as a new visitor.',
            'visitor'    => null,
        ]);
    }

    // 2. Fetch ALL visitors for TODAY (Malaysia time, safe for both UTC and +08 app configs)
    public function index()
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        $appTz    = config('app.timezone', 'UTC');

        $startOfToday = Carbon::today('Asia/Kuala_Lumpur')->timezone($appTz);
        $endOfToday   = Carbon::today('Asia/Kuala_Lumpur')->endOfDay()->timezone($appTz);

        $logs = VisitorLog::with('visitor')
            ->where('school_id', $schoolId)
            ->where(function ($q) use ($startOfToday, $endOfToday) {
                $q->whereBetween('check_in_time', [$startOfToday, $endOfToday])
                  ->orWhere(function ($q2) use ($startOfToday, $endOfToday) {
                      $q2->whereNull('check_in_time')
                         ->whereBetween('created_at', [$startOfToday, $endOfToday]);
                  });
            })
            ->orderByDesc('check_in_time')
            ->orderByDesc('id')
            ->get()
            ->map(function ($log) {
                $timeIn  = ($log->check_in_time ?? $log->created_at)?->copy()->timezone('Asia/Kuala_Lumpur');
                $timeOut = $log->check_out_time?->copy()->timezone('Asia/Kuala_Lumpur');

                return [
                    'id'          => $log->id,
                    'visitor_id'  => $log->visitor_id,
                    'ic_number'   => $log->visitor?->ic_number ?? '-',
                    'name'        => $log->visitor?->name ?? 'Unknown',
                    'passNo'      => $log->pass_badge_no ?: '-',
                    'plateNumber' => $log->plate_number ?: '-',
                    'status'      => $log->status ?? 'In Premise',
                    'date'        => $timeIn ? $timeIn->format('d M Y, h:i A') : '-',
                    'timeOut'     => $timeOut ? $timeOut->format('h:i A') : '-',
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }

    // 3. Fetch ALL visitor logs for Admin / Security Visitor List (Entrance or Facility)
    public function getAllVisitors(Request $request)
    {
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        $location = strtolower($request->query('location', 'entrance'));

        // Facility Visitor Logs (Surau / Prayer, PSS, ICT)
        if (in_array($location, ['prayer', 'pss', 'ict'])) {
            $facilityLogs = FacilityLog::where('school_id',$schoolId)
                ->where('user_type', 'visitor')
                ->where('facility_type', $location)
                ->orderByDesc('check_in_time')
                ->get();

            $visitorIds =$facilityLogs->pluck('user_id')->unique()->values();

            $visitorsMap = Visitor::whereIn('visitor_id',$visitorIds)
                ->get()
                ->keyBy('visitor_id');

            $visitLogsByVisitor = VisitorLog::where('school_id',$schoolId)
                ->whereIn('visitor_id', $visitorIds)
                ->orderByDesc('check_in_time')
                ->get()
                ->groupBy('visitor_id');

            $data = $facilityLogs->map(function ($log) use ($visitorsMap,$visitLogsByVisitor) {
                $visitor =$visitorsMap->get($log->user_id);$timeIn  = ($log->check_in_time ?? $log->created_at)?->copy()->timezone('Asia/Kuala_Lumpur');
                $timeOut =$log->check_out_time?->copy()->timezone('Asia/Kuala_Lumpur');

                // Match the visitor's entrance log for that same day (fallback to their latest log)
                $candidateLogs =$visitLogsByVisitor->get($log->user_id, collect());$matchedVisit  = $candidateLogs->first(function ($vLog) use ($timeIn) {$vDate = ($vLog->check_in_time ?? $vLog->created_at)?->copy()->timezone('Asia/Kuala_Lumpur')?->toDateString();
                    return $timeIn && $vDate ===$timeIn->toDateString();
                }) ?? $candidateLogs->first();

                return [
                    'id'           => $log->id,
                    'visitor_id'   => $log->user_id,
                    'icNumber'     => $visitor?->ic_number ?? '-',
                    'name'         => $visitor?->name ?? 'Unknown Visitor',
                    'phone'        => $matchedVisit?->phone_number ?? '-',
                    'plateNumber'  => $matchedVisit?->plate_number ?: '-',
                    'category'     => $matchedVisit?->category ?? 'Visitor',
                    'personToMeet' => $matchedVisit?->person_to_meet ?? '-',
                    'passNo'       => $matchedVisit?->pass_badge_no ?: '-',
                    'purpose'      => $matchedVisit?->purpose ?? '-',
                    'status'       => $log->check_out_time ? 'Checked Out' : 'In Premise',
                    'timeIn'       => $timeIn ? $timeIn->format('d/m/Y, h:i A') : '-',
                    'rawTimeIn'    => $timeIn ? $timeIn->format('Y-m-d') : '',
                    'timestamp'    => $timeIn ? $timeIn->timestamp : 0,
                    'timeOut'      => $timeOut ? $timeOut->format('d/m/Y, h:i A') : '-',
                    'notes'        => $matchedVisit?->notes ?? '-',
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $data->values(),
            ]);
        }

        // Default: School Entrance Visitor Logs
        $logs = VisitorLog::with('visitor')
            ->where('school_id', $schoolId)
            ->orderByDesc('check_in_time')
            ->get()
            ->map(function ($log) {$timeIn  = ($log->check_in_time ?? $log->created_at)?->copy()->timezone('Asia/Kuala_Lumpur');
                $timeOut =$log->check_out_time?->copy()->timezone('Asia/Kuala_Lumpur');

                return [
                    'id'           => $log->id,
                    'visitor_id'   => $log->visitor_id,
                    'icNumber'     => $log->visitor?->ic_number ?? '-',
                    'name'         => $log->visitor?->name ?? 'Unknown',
                    'phone'        => $log->phone_number ?? '-',
                    'plateNumber'  => $log->plate_number ?: '-',
                    'category'     => $log->category ?? '-',
                    'personToMeet' => $log->person_to_meet ?? '-',
                    'passNo'       => $log->pass_badge_no ?: '-',
                    'purpose'      => $log->purpose ?? '-',
                    'status'       => $log->status,
                    'timeIn'       => $timeIn ? $timeIn->format('d/m/Y, h:i A') : '-',
                    'rawTimeIn'    => $timeIn ? $timeIn->format('Y-m-d') : '',
                    'timestamp'    => $timeIn ? $timeIn->timestamp : 0,
                    'timeOut'      => $timeOut ? $timeOut->format('d/m/Y, h:i A') : '-',
                    'notes'        => $log->notes ?? '-',
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }

    // 4. Register / Check in visitor (creates master profile if new, then logs visit)
    public function store(Request $request)
    {
        $request->validate([
            'icNumber'     => 'required|string|max:20',
            'name'         => 'required|string|max:255',
            'phone'        => 'required|string|max:20',
            'plateNumber'  => 'nullable|string|max:20',
            'category'     => 'required|string|max:100',
            'personToMeet' => 'required|string|max:255',
            'passBadgeNo'  => 'nullable|string|max:50',
            'purpose'      => 'required|string|max:100',
            'notes'        => 'nullable|string',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        $cleanIc  = $this->normalizeIc($request->icNumber);

        // Save or retrieve permanent visitor identity (IC + Name only)
        $visitor = Visitor::firstOrCreate(
            ['school_id' => $schoolId, 'ic_number' => $cleanIc],
            ['name' => trim($request->name)]
        );

        // Block duplicate check-in if visitor is already In Premise
        $alreadyInPremise = VisitorLog::where('school_id', $schoolId)
            ->where('visitor_id', $visitor->visitor_id)
            ->where('status', 'In Premise')
            ->exists();

        if ($alreadyInPremise) {
            return response()->json([
                'success' => false,
                'message' => 'This visitor is already checked in to the school premise. Please check out first.',
            ], 409);
        }

        $isNewVisitor = $visitor->wasRecentlyCreated;

        // Create today's visit log with changeable details
        $log = VisitorLog::create([
            'school_id'      => $schoolId,
            'visitor_id'     => $visitor->visitor_id,
            'phone_number'   => $request->phone,
            'plate_number'   => $request->plateNumber ? strtoupper(trim($request->plateNumber)) : null,
            'category'       => $request->category,
            'person_to_meet' => $request->personToMeet,
            'pass_badge_no'  => $request->passBadgeNo,
            'purpose'        => $request->purpose,
            'notes'          => $request->notes,
            'status'         => 'In Premise',
            'check_in_time'  => now(),
        ]);

        return response()->json([
            'success'        => true,
            'message'        => $isNewVisitor
                ? 'Visitor registered and checked in successfully!'
                : 'Welcome back! Visitor checked in successfully!',
            'is_new_visitor' => $isNewVisitor,
            'log_id'         => $log->id,
            'qr_payload'     => $visitor->ic_number,
            'visitor'        => [
                'visitor_id' => $visitor->visitor_id,
                'ic_number'  => $visitor->ic_number,
                'name'       => $visitor->name,
            ],
        ]);
    }

    // 5. Entrance QR Scan for Visitors (Check-In / Check-Out)
    public function scan(Request $request)
    {
        $request->validate([
            'ic_number' => 'required|string|max:20',
            'mode'      => 'nullable|in:check-in,check-out',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        $cleanIc  = $this->normalizeIc($request->ic_number);
        $mode     = $request->mode ?? 'check-in';

        $visitor = Visitor::where('school_id', $schoolId)
            ->where('ic_number', $cleanIc)
            ->first();

        if (!$visitor) {
            return response()->json([
                'success' => false,
                'message' => 'Visitor IC not registered in system.',
            ], 404);
        }

        $activeLog = VisitorLog::where('school_id', $schoolId)
            ->where('visitor_id', $visitor->visitor_id)
            ->where('status', 'In Premise')
            ->latest('check_in_time')
            ->first();

        if ($mode === 'check-out') {
            if (!$activeLog) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot check out. Visitor is not currently in the school premise.',
                ], 404);
            }

            $now = Carbon::now('Asia/Kuala_Lumpur');
            $activeLog->update([
                'status'         => 'Checked Out',
                'check_out_time' => $now,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Visitor checked out via QR.',
                'name'    => $visitor->name,
                'time'    => $now->format('h:i A'),
            ]);
        }

        // Check-in mode: reject if already In Premise
        if ($activeLog) {
            return response()->json([
                'success'   => false,
                'duplicate' => true,
                'message'   => 'Visitor is already in the school premise. Please check out first.',
                'name'      => $visitor->name,
                'time'      => ($activeLog->check_in_time ?? $activeLog->created_at)->format('h:i A'),
            ], 409);
        }

        $now = Carbon::now('Asia/Kuala_Lumpur');
        VisitorLog::create([
            'school_id'     => $schoolId,
            'visitor_id'    => $visitor->visitor_id,
            'status'        => 'In Premise',
            'check_in_time' => $now,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Visitor check-in recorded via QR.',
            'name'    => $visitor->name,
            'time'    => $now->format('h:i A'),
        ]);
    }

    // 6. Force Check Out a visitor log (supports both Entrance and Facility logs)
    public function checkout(Request $request,$id)
    {
        $location = strtolower($request->input('location', 'entrance'));$now      = Carbon::now('Asia/Kuala_Lumpur');

        if (in_array($location, ['prayer', 'pss', 'ict'])) {$facilityLog = FacilityLog::findOrFail($id);$facilityLog->update([
                'check_out_time' => $now,
            ]);

            return response()->json(['success' => true, 'message' => 'Visitor checked out from facility!']);
        }

        $log = VisitorLog::findOrFail($id);$log->update([
            'status'         => 'Checked Out',
            'check_out_time' => $now,
        ]);

        return response()->json(['success' => true, 'message' => 'Visitor checked out!']);
    }
}