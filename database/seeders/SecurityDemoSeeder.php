<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Standalone demo data for the security-staff shift feature: three shifts
 * (day / evening / overnight) plus a spread of attendance_logs showing
 * present, late, incomplete (left early), incomplete (never checked out,
 * caught by the self-healing sweep), and one guard still checked in right
 * now. Doesn't touch the main DatabaseSeeder — run on top of an already
 * seeded database:
 *
 *   php artisan db:seed --class=SecurityDemoSeeder
 *
 * Requires the two pending migrations (incomplete status enum value,
 * dropped shift thresholds) to already be applied.
 */
class SecurityDemoSeeder extends Seeder
{
    public function run(): void
    {
        $schoolId = DB::table('schools')->value('school_id');
        if (!$schoolId) {
            $this->command->error('No school found — run the main DatabaseSeeder first.');
            return;
        }

        $sessionId = DB::table('school_sessions')
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->value('school_session_id');

        $guards = $this->ensureSecurityGuards($schoolId, $sessionId);
        $shiftIds = $this->seedShifts($schoolId);
        $this->seedLogs($schoolId, $sessionId, $guards, $shiftIds);

        $this->command->info('Security demo ready: ' . count($shiftIds) . ' shifts, ' . count($guards) . ' guards, 5 attendance logs.');
    }

    private function ensureSecurityGuards(int $schoolId, ?int $sessionId): array
    {
        $existing = DB::table('users')
            ->where('school_id', $schoolId)
            ->where('user_type', 'security_staff')
            ->pluck('user_id')
            ->all();

        $names = [
            ['first' => 'Rosli',  'last' => 'bin Musa',    'ic' => '850112136601'],
            ['first' => 'Halim',  'last' => 'bin Yaacob',  'ic' => '900623136602'],
            ['first' => 'Suresh', 'last' => 'a/l Kumar',   'ic' => '881230136603'],
        ];

        $password = Hash::make('password');
        $needed = max(0, 3 - count($existing));

        for ($i = 0; $i < $needed; $i++) {
            $n = $names[$i];
            $userId = DB::table('users')->insertGetId([
                'school_id'          => $schoolId,
                'user_type'          => 'security_staff',
                'first_name'         => $n['first'],
                'last_name'          => $n['last'],
                'ic_number'          => $n['ic'],
                'gender'             => 'Male',
                'email'              => 'guard' . ($i + 1) . '.demo@ihadir.com',
                'password'           => $password,
                'position'           => 'Security Guard',
                'phone_num'          => '019-' . rand(1000000, 9999999),
                'street_address'     => 'SK Pulau Serai',
                'city'               => 'Dungun',
                'state'              => 'Terengganu',
                'postcode'           => '23000',
                'country'            => 'Malaysia',
                'is_active'          => true,
                'email_verified_at'  => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);

            if ($sessionId) {
                DB::table('staff_employments')->insert([
                    'staff_id'           => $userId,
                    'school_session_id'  => $sessionId,
                    'staff_type'         => 'Security Guard',
                    'created_at'         => now(),
                    'updated_at'         => now(),
                ]);
            }

            $existing[] = $userId;
        }

        return $existing;
    }

    private function seedShifts(int $schoolId): array
    {
        // Re-runnable: clear prior demo shifts first so the overlap guard doesn't reject them.
        DB::table('shifts')->where('school_id', $schoolId)->delete();

        $defs = [
            ['start' => '07:00', 'end' => '15:00'],
            ['start' => '15:00', 'end' => '23:00'],
            ['start' => '23:00', 'end' => '07:00'], // overnight
        ];

        $ids = [];
        foreach ($defs as $d) {
            $ids[] = DB::table('shifts')->insertGetId([
                'school_id'    => $schoolId,
                'name'         => $this->shiftName($d['start'], $d['end']),
                'start_time'   => $d['start'],
                'end_time'     => $d['end'],
                'is_overnight' => $d['end'] <= $d['start'],
                'is_active'    => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        return $ids;
    }

    private function shiftName(string $start, string $end): string
    {
        $fmt = fn(string $t) => Carbon::createFromFormat('H:i', $t)->format('g:i A');
        return "{$fmt($start)} - {$fmt($end)}";
    }

    private function seedLogs(int $schoolId, ?int $sessionId, array $guards, array $shiftIds): void
    {
        DB::table('attendance_logs')
            ->where('school_id', $schoolId)
            ->where('user_type', 'staff')
            ->whereIn('user_id', array_map('strval', $guards))
            ->delete();

        [$dayShiftId, $eveningShiftId, $nightShiftId] = $shiftIds;
        $today = Carbon::today();
        $yesterday = $today->copy()->subDay();
        $twoDaysAgo = $today->copy()->subDays(2);

        $rows = [
            // Guard 1 yesterday — on time, completed the day shift cleanly.
            $this->row($schoolId, $sessionId, $guards[0], $dayShiftId, $yesterday,
                $yesterday->copy()->setTime(6, 55), $yesterday->copy()->setTime(15, 5), 'present'),

            // Guard 2 yesterday — late arrival, completed the evening shift.
            $this->row($schoolId, $sessionId, $guards[1], $eveningShiftId, $yesterday,
                $yesterday->copy()->setTime(15, 22), $yesterday->copy()->setTime(23, 10), 'late'),

            // Guard 3 yesterday — checked out well before the day shift ended.
            $this->row($schoolId, $sessionId, $guards[2], $dayShiftId, $yesterday,
                $yesterday->copy()->setTime(7, 0), $yesterday->copy()->setTime(12, 30), 'incomplete'),

            // Guard 1 today — currently checked in to the day shift, still open.
            $this->row($schoolId, $sessionId, $guards[0], $dayShiftId, $today,
                $today->copy()->setTime(6, 58), null, 'present'),

            // Guard 2, two nights ago — checked into an overnight shift and never checked out.
            // The shift has long since ended, so the app's self-healing sweep
            // (closeOverdueShifts) should flip this to 'incomplete' the instant any
            // attendance page loads. (Kept off yesterday's date to avoid colliding with
            // Guard 2's other row above — one attendance_logs row per person per day.)
            $this->row($schoolId, $sessionId, $guards[1], $nightShiftId, $twoDaysAgo,
                $twoDaysAgo->copy()->setTime(23, 5), null, 'present'),
        ];

        DB::table('attendance_logs')->insert($rows);
    }

    private function row(int $schoolId, ?int $sessionId, int $userId, int $shiftId, Carbon $date, Carbon $checkIn, ?Carbon $checkOut, string $status): array
    {
        return [
            'school_id'         => $schoolId,
            'school_session_id' => $sessionId,
            'user_type'         => 'staff',
            'user_id'           => (string) $userId,
            'classroom_id'      => null,
            'shift_id'          => $shiftId,
            'date'              => $date->toDateString(),
            'check_in_time'     => $checkIn,
            'check_out_time'    => $checkOut,
            'status'            => $status,
            'scan_method'       => 'qr',
            'scanned_by'        => null,
            'reason_manual'     => null,
            'created_at'        => now(),
            'updated_at'        => now(),
        ];
    }
}
