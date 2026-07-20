<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Demo-data seeder for SK Pulau Serai — sized and shaped to look like a real
 * small Malaysian primary school, so every dashboard/report/list in the app
 * has something believable to show instead of empty states.
 *
 * Only covers tables that actually exist in the schema: there is no
 * co_curricular_members / sport_house_members pivot (despite CLAUDE.md's
 * plan mentioning one), so individual club/house membership can't be seeded.
 *
 * Assumes a fresh database — school_code/email are unique, so re-running
 * against already-seeded data will fail on those constraints. Use
 * `php artisan migrate:fresh --seed`.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private const TOTAL_STUDENTS_PER_CLASS = 15;
    private const ATTENDANCE_SCHOOL_DAYS = 15; // trailing weekdays, most recent first

    public function run(): void
    {
        $schoolId = $this->seedSchool();
        $this->seedSchoolProfile($schoolId);
        $sessionId = $this->seedSession($schoolId);

        $users = $this->seedUsers($schoolId, $sessionId);
        $teacherIds = $users['teachers'];
        $staffIds = array_merge($users['security'], $users['cleaners']);

        $classrooms = $this->seedClassrooms($schoolId, $sessionId, $teacherIds);
        [$studentIds, $studentClassroom] = $this->seedStudentsAndEnrollments($schoolId, $sessionId, $classrooms);

        $this->seedCoCurriculars($schoolId, $teacherIds);
        $this->seedSportHouses($schoolId, $teacherIds);
        $this->seedAttendanceSettings($schoolId);
        $this->seedEvents($schoolId, $sessionId, $studentIds, $teacherIds, $staffIds);
        $this->seedAttendanceLogs($schoolId, $sessionId, $studentIds, $studentClassroom, $teacherIds, $staffIds, $users['admins']);
        $this->seedFacilityLogs($schoolId, $studentIds);
        $this->seedVisitors($schoolId);
    }

    // ─── School ─────────────────────────────────────────────────────────────

    private function seedSchool(): int
    {
        return DB::table('schools')->insertGetId([
            'school_code' => 'MEA0001',
            'name' => 'SK Pulau Serai',
            'slug' => 'pulau-serai',
            'email' => 'admin@ihadir.edu.my',
            'phone_number' => '09-848 1672',
            'fax_number' => '09-848 1672',
            'address' => 'Kampung Pulau Serai, 23000 Dungun, Terengganu',
            'postcode' => '23000',
            'city' => 'Dungun',
            'state' => 'Terengganu',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedSchoolProfile(int $schoolId): void
    {
        DB::table('school_profiles')->insert([
            'school_id' => $schoolId,
            'tagline' => 'Membina Generasi Cemerlang, Berilmu dan Berakhlak',
            'established_year' => '1968',
            'about' => "SK Pulau Serai telah berkhidmat kepada komuniti Kampung Pulau Serai, Dungun sejak 1968.\n\nSekolah ini menawarkan pendidikan rendah berkualiti kepada lebih 180 orang murid dari Tahun 1 hingga Tahun 6, disokong oleh barisan guru dan kakitangan yang berdedikasi.",
            'vision' => 'Melahirkan modal insan yang seimbang dari segi jasmani, emosi, rohani, intelek dan sosial (JERIS) selaras dengan Falsafah Pendidikan Kebangsaan.',
            'mission' => 'Menyediakan pendidikan berkualiti secara menyeluruh dan bersepadu untuk membangunkan potensi individu sepenuhnya.',
            'organization' => json_encode([
                ['name' => 'Ahmad bin Abdullah', 'position' => 'Guru Besar', 'level' => 1],
                ['name' => 'Siti binti Abu', 'position' => 'Penolong Kanan Pentadbiran', 'level' => 2],
                ['name' => 'Faridah binti Kassim', 'position' => 'Penolong Kanan Hal Ehwal Murid', 'level' => 2],
                ['name' => 'Razak bin Hamid', 'position' => 'Penolong Kanan Kokurikulum', 'level' => 2],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedSession(int $schoolId): int
    {
        return DB::table('school_sessions')->insertGetId([
            'school_id' => $schoolId,
            'year' => '2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ─── Users (admins, teachers, security, cleaning staff) ───────────────────

    private function seedUsers(int $schoolId, int $sessionId): array
    {
        $defaultPassword = Hash::make('password');
        $admins = $teachers = $security = $cleaners = [];

        // The original two admins + core staff, kept verbatim so existing
        // login credentials people already have keep working.
        $seed = [
            ['user_type' => 'admin', 'first_name' => 'System', 'last_name' => 'Admin', 'ic_number' => '900101112222', 'email' => 'admin@ihadir.com', 'position' => 'System Administrator', 'gender' => 'Male', 'phone' => '012-3456789'],
            ['user_type' => 'admin', 'first_name' => 'Backup', 'last_name' => 'Admin', 'ic_number' => '910202113333', 'email' => 'admin2@ihadir.com', 'position' => 'Co-Administrator', 'gender' => 'Female', 'phone' => '012-9876543'],
            ['user_type' => 'teacher', 'first_name' => 'Ahmad', 'last_name' => 'bin Abdullah', 'ic_number' => '800303114444', 'email' => 'teacher1@ihadir.com', 'position' => 'Guru Besar', 'gender' => 'Male', 'phone' => '013-1112222'],
            ['user_type' => 'teacher', 'first_name' => 'Siti', 'last_name' => 'binti Abu', 'ic_number' => '850404115555', 'email' => 'teacher2@ihadir.com', 'position' => 'Guru Biasa', 'gender' => 'Female', 'phone' => '013-3334444'],
            ['user_type' => 'security_staff', 'first_name' => 'Muthu', 'last_name' => 'a/l Samy', 'ic_number' => '750505116666', 'email' => 'security@ihadir.com', 'position' => 'Security Guard', 'gender' => 'Male', 'phone' => '014-5556666'],
            ['user_type' => 'staff', 'first_name' => 'Aminah', 'last_name' => 'binti Yasin', 'ic_number' => '880606117777', 'email' => 'cleaner@ihadir.com', 'position' => 'Cleaning Staff', 'gender' => 'Female', 'phone' => '014-7778888'],
        ];

        // Extra teaching + support staff for a realistic-sized small school.
        $extraTeacherPositions = [
            'Penolong Kanan Pentadbiran', 'Penolong Kanan HEM', 'Penolong Kanan Kokurikulum',
            'Guru Bahasa Melayu', 'Guru Bahasa Inggeris', 'Guru Matematik', 'Guru Sains',
            'Guru Pendidikan Islam', 'Guru Pendidikan Jasmani', 'Guru Seni & Muzik',
        ];
        $seq = 10;
        foreach ($extraTeacherPositions as $i => $position) {
            [$first, $last, $gender] = $this->randomPersonName();
            $seed[] = [
                'user_type' => 'teacher',
                'first_name' => $first,
                'last_name' => $last,
                'ic_number' => $this->generateIc(1975 + ($i % 20), $gender, $seq++),
                'email' => "teacher" . ($i + 3) . "@ihadir.com",
                'position' => $position,
                'gender' => $gender,
                'phone' => $this->randomPhone(),
            ];
        }

        $extraStaff = [
            ['type' => 'security_staff', 'position' => 'Security Guard'],
            ['type' => 'staff', 'position' => 'Cleaning Staff'],
        ];
        foreach ($extraStaff as $i => $s) {
            [$first, $last, $gender] = $this->randomPersonName();
            $seed[] = [
                'user_type' => $s['type'],
                'first_name' => $first,
                'last_name' => $last,
                'ic_number' => $this->generateIc(1980 + $i, $gender, $seq++),
                'email' => ($s['type'] === 'security_staff' ? 'security' : 'cleaner') . ($i + 2) . '@ihadir.com',
                'position' => $s['position'],
                'gender' => $gender,
                'phone' => $this->randomPhone(),
            ];
        }

        foreach ($seed as $u) {
            $userId = DB::table('users')->insertGetId([
                'school_id' => $schoolId,
                'user_type' => $u['user_type'],
                'first_name' => $u['first_name'],
                'last_name' => $u['last_name'],
                'ic_number' => $u['ic_number'],
                'gender' => $u['gender'],
                'email' => $u['email'],
                'password' => $defaultPassword,
                'position' => $u['position'],
                'phone_num' => $u['phone'],
                'street_address' => 'SK Pulau Serai',
                'city' => 'Dungun',
                'state' => 'Terengganu',
                'postcode' => '23000',
                'country' => 'Malaysia',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            match ($u['user_type']) {
                'admin' => $admins[] = $userId,
                'teacher' => $teachers[] = $userId,
                'security_staff' => $security[] = $userId,
                'staff' => $cleaners[] = $userId,
                default => null,
            };

            if ($u['user_type'] === 'teacher') {
                DB::table('teacher_employments')->insert([
                    'teacher_id' => $userId,
                    'school_session_id' => $sessionId,
                    'position' => $u['position'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            if (in_array($u['user_type'], ['security_staff', 'staff'], true)) {
                DB::table('staff_employments')->insert([
                    'staff_id' => $userId,
                    'school_session_id' => $sessionId,
                    'staff_type' => $u['position'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return ['admins' => $admins, 'teachers' => $teachers, 'security' => $security, 'cleaners' => $cleaners];
    }

    // ─── Classrooms ─────────────────────────────────────────────────────────

    private function seedClassrooms(int $schoolId, int $sessionId, array $teacherIds): array
    {
        $namesByYear = [
            1 => ['Cekal', 'Bestari'],
            2 => ['Amanah', 'Bijak'],
            3 => ['Gigih', 'Tekun'],
            4 => ['Rajin', 'Berani'],
            5 => ['Jujur', 'Setia'],
            6 => ['Cemerlang', 'Gemilang'],
        ];

        $classrooms = []; // ['id' => .., 'year' => .., 'name' => ..]
        $teacherCursor = 0;

        foreach ($namesByYear as $year => $names) {
            foreach ($names as $name) {
                $id = DB::table('classrooms')->insertGetId([
                    'school_id' => $schoolId,
                    'user_id' => $teacherIds[$teacherCursor % count($teacherIds)],
                    'name' => "{$year} {$name}",
                    'capacity' => 30,
                    'school_session_id' => $sessionId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $classrooms[] = ['id' => $id, 'year' => $year, 'name' => "{$year} {$name}"];
                $teacherCursor++;
            }
        }

        return $classrooms;
    }

    // ─── Students + Enrollments ─────────────────────────────────────────────

    private function seedStudentsAndEnrollments(int $schoolId, int $sessionId, array $classrooms): array
    {
        $studentIds = [];
        $studentClassroom = []; // studentId => classroomId
        $seq = 1;
        $rows = [];

        foreach ($classrooms as $classroom) {
            $birthYear = 2026 - ($classroom['year'] + 6);

            for ($i = 0; $i < self::TOTAL_STUDENTS_PER_CLASS; $i++) {
                [$first, $last, $gender] = $this->randomPersonName();
                $fatherName = $this->randomFatherName();
                $motherName = $this->randomMotherName();

                $rows[] = [
                    'school_id' => $schoolId,
                    'name' => trim("{$first} {$last}"),
                    'ic_number' => $this->generateIc($birthYear, $gender, $seq++),
                    'gender' => $gender,
                    'street_address' => 'Kampung Pulau Serai',
                    'city' => 'Dungun',
                    'state' => 'Terengganu',
                    'postcode' => '23000',
                    'country' => 'Malaysia',
                    'phone_num' => null,
                    'father_name' => $fatherName,
                    'father_ic' => $this->generateIc($birthYear - 30, 'Male', $seq++),
                    'father_phone_num' => $this->randomPhone(),
                    'mother_name' => $motherName,
                    'mother_ic' => $this->generateIc($birthYear - 27, 'Female', $seq++),
                    'mother_phone_num' => $this->randomPhone(),
                    'emergency_name' => $fatherName,
                    'emergency_phone_num' => $this->randomPhone(),
                    'emergency_relation' => 'Bapa',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                    '_classroom_id' => $classroom['id'], // stripped before insert
                ];
            }
        }

        // Insert per-classroom chunk so we can capture each student's classroom
        // without a second query pass (insertGetId one-at-a-time would work
        // too, but this keeps it to a handful of bulk queries instead of 180).
        foreach (array_chunk($rows, self::TOTAL_STUDENTS_PER_CLASS) as $chunk) {
            $classroomId = $chunk[0]['_classroom_id'];
            $clean = array_map(function ($r) {
                unset($r['_classroom_id']);
                return $r;
            }, $chunk);

            $firstId = DB::table('students')->insertGetId($clean[0]);
            unset($clean[0]);
            if (!empty($clean)) {
                DB::table('students')->insert(array_values($clean));
            }

            // IDs are sequential from $firstId for this chunk (fresh DB, no concurrent writers).
            $chunkIds = range($firstId, $firstId + count($chunk) - 1);

            $enrollments = [];
            foreach ($chunkIds as $studentId) {
                $studentIds[] = $studentId;
                $studentClassroom[$studentId] = $classroomId;
                $enrollments[] = [
                    'student_id' => $studentId,
                    'school_session_id' => $sessionId,
                    'classroom_id' => $classroomId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            DB::table('enrollments')->insert($enrollments);
        }

        return [$studentIds, $studentClassroom];
    }

    // ─── Co-curriculars & Sport Houses ──────────────────────────────────────

    private function seedCoCurriculars(int $schoolId, array $teacherIds): void
    {
        $clubs = [
            ['name' => 'Pengakap', 'capacity' => 40],
            ['name' => 'Puteri Islam', 'capacity' => 35],
            ['name' => 'Kelab Doktor Muda', 'capacity' => 25],
            ['name' => 'Kelab Seni Lukis & Kraf', 'capacity' => 30],
            ['name' => 'Persatuan Bahasa Melayu', 'capacity' => 30],
            ['name' => 'Kelab Sains & Matematik', 'capacity' => 30],
            ['name' => 'Unit Beruniform Bulan Sabit Merah', 'capacity' => 35],
        ];

        foreach ($clubs as $i => $club) {
            DB::table('co_curriculars')->insert([
                'school_id' => $schoolId,
                'name' => $club['name'],
                'capacity' => $club['capacity'],
                'user_id' => $teacherIds[$i % count($teacherIds)],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedSportHouses(int $schoolId, array $teacherIds): void
    {
        $houses = [
            ['name' => 'Rumah Jebat', 'color' => '#c53336'],   // red
            ['name' => 'Rumah Hang Tuah', 'color' => '#1c3068'], // blue
            ['name' => 'Rumah Lekiu', 'color' => '#eab308'],   // yellow
            ['name' => 'Rumah Lekir', 'color' => '#16a34a'],   // green
        ];

        foreach ($houses as $i => $house) {
            DB::table('sport_houses')->insert([
                'school_id' => $schoolId,
                'name' => $house['name'],
                'color' => $house['color'],
                'capacity' => 100,
                'user_id' => $teacherIds[$i % count($teacherIds)],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    // ─── Attendance time settings ───────────────────────────────────────────

    private function seedAttendanceSettings(int $schoolId): void
    {
        DB::table('attendance_time_settings')->insert([
            [
                'school_id' => $schoolId,
                'title' => 'Normal Class',
                'check_in_start' => '06:30:00',
                'check_in_deadline' => '07:30:00',
                'late_threshold' => '08:00:00',
                'absent_threshold' => '10:00:00',
                'check_out_time' => '13:30:00',
                'is_default' => true,
                'applies_to_days' => json_encode([1, 2, 3, 4, 5]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'school_id' => $schoolId,
                'title' => 'PKU / Ekstrakurikulum',
                'check_in_start' => '07:30:00',
                'check_in_deadline' => '08:00:00',
                'late_threshold' => '08:30:00',
                'absent_threshold' => '11:00:00',
                'check_out_time' => '12:30:00',
                'is_default' => false,
                'applies_to_days' => json_encode([6]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $defaultSettingId = DB::table('attendance_time_settings')
            ->where('school_id', $schoolId)->where('is_default', true)->value('id');

        DB::table('attendance_setting_overrides')->insert([
            [
                'school_id' => $schoolId,
                'date' => '2026-08-31',
                'setting_id' => null, // Merdeka Day — school closed
                'note' => 'Hari Kebangsaan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'school_id' => $schoolId,
                'date' => '2026-09-16',
                'setting_id' => null,
                'note' => 'Hari Malaysia',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    // ─── Events + attendees ─────────────────────────────────────────────────

    private function seedEvents(int $schoolId, int $sessionId, array $studentIds, array $teacherIds, array $staffIds): void
    {
        $events = [
            ['name' => 'Hari Sukan Tahunan 2026', 'date' => '2026-03-14', 'time' => '08:00:00', 'location' => 'Padang Sekolah', 'types' => ['student', 'teacher', 'staff', 'parent'], 'desc' => 'Pertandingan olahraga tahunan antara empat rumah sukan.'],
            ['name' => 'Perkhemahan Pengakap', 'date' => '2026-05-08', 'time' => '07:30:00', 'location' => 'Taman Rekreasi Dungun', 'types' => ['student', 'teacher'], 'desc' => 'Perkhemahan dua hari satu malam untuk ahli Pengakap.'],
            ['name' => 'Hari Guru', 'date' => '2026-05-16', 'time' => '10:00:00', 'location' => 'Dewan Sekolah', 'types' => ['teacher', 'staff'], 'desc' => 'Sambutan Hari Guru peringkat sekolah.'],
            ['name' => 'Minggu Bahasa Kebangsaan', 'date' => '2026-08-25', 'time' => '08:00:00', 'location' => 'Dewan Sekolah', 'types' => ['student', 'teacher'], 'desc' => 'Pertandingan pidato, sajak dan pantun.'],
            ['name' => 'Hari Terbuka Sekolah', 'date' => '2026-09-12', 'time' => '09:00:00', 'location' => 'Dewan Sekolah', 'types' => ['student', 'teacher', 'staff', 'parent'], 'desc' => 'Pameran hasil kerja murid dan sesi temu ramah ibu bapa.'],
            ['name' => 'Majlis Anugerah Cemerlang', 'date' => '2026-11-20', 'time' => '09:00:00', 'location' => 'Dewan Sekolah', 'types' => ['student', 'teacher', 'staff', 'parent'], 'desc' => 'Majlis penyampaian hadiah kecemerlangan akademik dan kokurikulum.'],
        ];

        $today = Carbon::parse('2026-07-20');

        foreach ($events as $e) {
            $eventId = DB::table('events')->insertGetId([
                'school_id' => $schoolId,
                'school_session_id' => $sessionId,
                'name' => $e['name'],
                'description' => $e['desc'],
                'event_date' => $e['date'],
                'event_time' => $e['time'],
                'location' => $e['location'],
                'banner_path' => null,
                'participant_types' => json_encode($e['types']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $eventDate = Carbon::parse($e['date']);
            if ($eventDate->lessThanOrEqualTo($today)) {
                $this->seedEventAttendees($eventId, $eventDate, $e['types'], $studentIds, $teacherIds, $staffIds);
            }
        }
    }

    private function seedEventAttendees(int $eventId, Carbon $eventDate, array $types, array $studentIds, array $teacherIds, array $staffIds): void
    {
        $rows = [];
        $checkInBase = $eventDate->copy()->setTime(8, 0);

        if (in_array('student', $types, true)) {
            foreach ($this->randomSample($studentIds, 25) as $id) {
                $rows[] = $this->attendeeRow($eventId, 'student', $id, $checkInBase);
            }
        }
        if (in_array('teacher', $types, true)) {
            foreach ($teacherIds as $id) {
                $rows[] = $this->attendeeRow($eventId, 'teacher', $id, $checkInBase);
            }
        }
        if (in_array('staff', $types, true)) {
            foreach ($staffIds as $id) {
                $rows[] = $this->attendeeRow($eventId, 'staff', $id, $checkInBase);
            }
        }

        if (!empty($rows)) {
            DB::table('event_attendees')->insert($rows);
        }
    }

    private function attendeeRow(int $eventId, string $type, int $userId, Carbon $checkInBase): array
    {
        return [
            'event_id' => $eventId,
            'user_type' => $type,
            'user_id' => (string) $userId,
            'check_in_time' => $checkInBase->copy()->addMinutes(rand(-15, 45)),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    // ─── Attendance logs (the big one — drives Dashboard/Reports demo data) ──

    private function seedAttendanceLogs(int $schoolId, int $sessionId, array $studentIds, array $studentClassroom, array $teacherIds, array $staffIds, array $adminIds): void
    {
        $days = $this->trailingSchoolDays(Carbon::parse('2026-07-20'), self::ATTENDANCE_SCHOOL_DAYS);
        // Admins aren't tracked in attendance_logs (user_type enum is student/teacher/staff only).
        $people = [];
        foreach ($studentIds as $id) $people[] = ['type' => 'student', 'id' => $id, 'classroom_id' => $studentClassroom[$id]];
        foreach ($teacherIds as $id) $people[] = ['type' => 'teacher', 'id' => $id, 'classroom_id' => null];
        foreach ($staffIds as $id) $people[] = ['type' => 'staff', 'id' => $id, 'classroom_id' => null];

        $scannerId = $adminIds[0] ?? null;

        foreach ($days as $date) {
            $rows = [];
            foreach ($people as $person) {
                $roll = rand(1, 100);
                if ($roll <= 82) {
                    $status = 'present';
                    $checkIn = $date->copy()->setTime(6, rand(50, 59))->addMinutes(rand(0, 39)); // ~06:50-07:29
                } elseif ($roll <= 94) {
                    $status = 'late';
                    $checkIn = $date->copy()->setTime(7, rand(31, 59));
                } else {
                    $status = 'absent';
                    $checkIn = null;
                }

                $checkOut = null;
                if ($checkIn !== null) {
                    // Recent days may not have a check-out yet (still "in progress").
                    $hasCheckedOut = $date->lessThan(Carbon::parse('2026-07-20')) || rand(0, 1) === 1;
                    if ($hasCheckedOut) {
                        $checkOut = $date->copy()->setTime(13, rand(0, 45));
                    }
                }

                $rows[] = [
                    'school_id' => $schoolId,
                    'school_session_id' => $sessionId,
                    'user_type' => $person['type'],
                    'user_id' => (string) $person['id'],
                    'classroom_id' => $person['classroom_id'],
                    'date' => $date->toDateString(),
                    'check_in_time' => $checkIn,
                    'check_out_time' => $checkOut,
                    'status' => $status,
                    'scan_method' => $status === 'absent' ? 'manual' : 'qr',
                    'scanned_by' => $status === 'absent' ? $scannerId : null,
                    'reason_manual' => $status === 'absent' ? 'Tidak hadir tanpa sebab' : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach (array_chunk($rows, 400) as $chunk) {
                DB::table('attendance_logs')->insert($chunk);
            }
        }
    }

    // ─── Facility logs ──────────────────────────────────────────────────────

    private function seedFacilityLogs(int $schoolId, array $studentIds): void
    {
        $days = $this->trailingSchoolDays(Carbon::parse('2026-07-20'), self::ATTENDANCE_SCHOOL_DAYS);
        $facilities = ['prayer', 'pss', 'ict', 'rmt'];
        $rows = [];

        foreach ($days as $date) {
            foreach ($facilities as $facility) {
                $visitors = $this->randomSample($studentIds, rand(5, 15));
                foreach ($visitors as $studentId) {
                    $checkIn = $date->copy()->setTime(rand(9, 12), rand(0, 59));
                    $rows[] = [
                        'school_id' => $schoolId,
                        'user_type' => 'student',
                        'user_id' => (string) $studentId,
                        'facility_type' => $facility,
                        'date' => $date->toDateString(),
                        'check_in_time' => $checkIn,
                        'check_out_time' => rand(0, 4) > 0 ? $checkIn->copy()->addMinutes(rand(15, 45)) : null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        foreach (array_chunk($rows, 400) as $chunk) {
            DB::table('facility_logs')->insert($chunk);
        }
    }

    // ─── Visitors ───────────────────────────────────────────────────────────

    private function seedVisitors(int $schoolId): void
    {
        $categories = ['Parent/Guardian', 'Official', 'Contractor', 'Vendor', 'Public'];
        $purposes = ['Meeting', 'Pickup', 'Delivery', 'Maintenance', 'Other'];
        $peopleToMeet = ['Guru Besar', 'Penolong Kanan HEM', 'Guru Kelas', 'Pejabat Sekolah', 'Guru Disiplin'];

        $rows = [];
        $today = Carbon::parse('2026-07-20');

        for ($i = 0; $i < 18; $i++) {
            [$first, $last] = $this->randomPersonName();
            $checkedIn = $today->copy()->subDays(rand(0, 6))->setTime(rand(8, 15), rand(0, 59));
            $checkedOut = rand(0, 4) > 0; // most visitors from prior days have checked out

            $rows[] = [
                'school_id' => $schoolId,
                'name' => trim("{$first} {$last}"),
                'phone_number' => $this->randomPhone(),
                'plate_number' => rand(0, 1) ? strtoupper(chr(rand(65, 90)) . chr(rand(65, 90))) . rand(1000, 9999) : null,
                'category' => $categories[array_rand($categories)],
                'person_to_meet' => $peopleToMeet[array_rand($peopleToMeet)],
                'pass_badge_no' => 'V' . str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
                'purpose' => $purposes[array_rand($purposes)],
                'notes' => null,
                'status' => $checkedOut ? 'Checked Out' : 'In Premise',
                'check_out_time' => $checkedOut ? $checkedIn->copy()->addMinutes(rand(20, 90)) : null,
                'created_at' => $checkedIn,
                'updated_at' => $checkedIn,
            ];
        }

        DB::table('visitors')->insert($rows);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /** @return array{0:string,1:string,2:string} [firstName, lastName, gender] */
    private function randomPersonName(?string $forceGender = null): array
    {
        $maleFirst = ['Ahmad', 'Muhammad', 'Amir', 'Farid', 'Hafiz', 'Zulkifli', 'Azman', 'Faisal', 'Rizal', 'Syafiq', 'Danial', 'Aiman', 'Haziq', 'Iskandar', 'Zaki', 'Firdaus', 'Amirul', 'Hakim', 'Naufal', 'Adam', 'Arif', 'Ridzuan', 'Shahril', 'Fahmi', 'Azlan', 'Wei Ming', 'Kah Wai', 'Jun Hao', 'Karthik', 'Suresh'];
        $femaleFirst = ['Siti', 'Nur', 'Nurul', 'Aisyah', 'Fatimah', 'Aina', 'Alia', 'Balqis', 'Farah', 'Hana', 'Iman', 'Izzati', 'Liyana', 'Mia', 'Nadia', 'Qistina', 'Sofea', 'Syafiqah', 'Wani', 'Zulaikha', 'Amira', 'Batrisyia', 'Ellina', 'Humaira', 'Khadijah', 'Xiu Ying', 'Mei Ling', 'Wan Ting', 'Kavitha', 'Priya'];
        $patronym = ['Abdullah', 'Ismail', 'Hassan', 'Ibrahim', 'Ahmad', 'Rahman', 'Yusof', 'Mahmud', 'Bakar', 'Osman', 'Zulkifli', 'Kassim', 'Hamid', 'Salleh', 'Rashid', 'Aziz', 'Karim', 'Sulaiman', 'Talib', 'Mansor'];
        $surname = ['Tan', 'Lim', 'Wong', 'Lee', 'Chan', 'Muthu', 'Raju', 'Samy', 'Kumar', 'Pillai'];

        $gender = $forceGender ?? (rand(0, 1) ? 'Male' : 'Female');
        $first = $gender === 'Male' ? $maleFirst[array_rand($maleFirst)] : $femaleFirst[array_rand($femaleFirst)];

        // ~70% Malay "bin/binti Father" style, ~30% Chinese/Indian surname style.
        if (rand(1, 100) <= 70) {
            $last = ($gender === 'Male' ? 'bin ' : 'binti ') . $patronym[array_rand($patronym)];
        } else {
            $last = $surname[array_rand($surname)];
        }

        return [$first, $last, $gender];
    }

    private function randomFatherName(): string
    {
        [$first, $last] = $this->randomPersonName('Male');
        return trim("{$first} {$last}");
    }

    private function randomMotherName(): string
    {
        [$first, $last] = $this->randomPersonName('Female');
        return trim("{$first} {$last}");
    }

    private function generateIc(int $birthYear, string $gender, int $seq): string
    {
        $month = str_pad((string) rand(1, 12), 2, '0', STR_PAD_LEFT);
        $day = str_pad((string) rand(1, 28), 2, '0', STR_PAD_LEFT);
        $ymd = str_pad((string) ($birthYear % 100), 2, '0', STR_PAD_LEFT) . $month . $day;
        $placeOfBirth = '13'; // Terengganu
        $serial = str_pad((string) ($seq % 1000), 3, '0', STR_PAD_LEFT);
        $genderDigit = $gender === 'Male' ? (string) (2 * rand(0, 4) + 1) : (string) (2 * rand(0, 4));

        return $ymd . $placeOfBirth . $serial . $genderDigit;
    }

    private function randomPhone(): string
    {
        return '01' . rand(0, 9) . '-' . rand(1000000, 9999999);
    }

    /** @param int[] $pool @return int[] */
    private function randomSample(array $pool, int $count): array
    {
        $count = min($count, count($pool));
        $keys = array_rand($pool, $count);
        if (!is_array($keys)) {
            $keys = [$keys];
        }
        return array_map(fn($k) => $pool[$k], $keys);
    }

    /** Trailing weekdays ending on (and including) $end, oldest first. */
    private function trailingSchoolDays(Carbon $end, int $count): array
    {
        $days = [];
        $cursor = $end->copy();
        while (count($days) < $count) {
            if ($cursor->isWeekday()) {
                $days[] = $cursor->copy();
            }
            $cursor->subDay();
        }
        return array_reverse($days);
    }
}
