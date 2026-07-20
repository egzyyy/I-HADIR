<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create School
        $schoolId = DB::table('schools')->insertGetId([
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

        // 2. Create Active School Session
        $sessionId = DB::table('school_sessions')->insertGetId([
            'school_id' => $schoolId,
            'year' => '2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Define the Users to Seed
        $usersToSeed = [
            // --- ADMINS (2) ---
            [
                'user_type' => 'admin',
                'first_name' => 'System',
                'last_name' => 'Admin',
                'ic_number' => '900101112222',
                'email' => 'admin@ihadir.com',
                'position' => 'System Administrator',
                'gender' => 'Male',
                'phone' => '012-3456789',
            ],
            [
                'user_type' => 'admin',
                'first_name' => 'Backup',
                'last_name' => 'Admin',
                'ic_number' => '910202113333',
                'email' => 'admin2@ihadir.com',
                'position' => 'Co-Administrator',
                'gender' => 'Female',
                'phone' => '012-9876543',
            ],

            // --- TEACHERS (2) ---
            [
                'user_type' => 'teacher',
                'first_name' => 'Ahmad',
                'last_name' => 'bin Abdullah',
                'ic_number' => '800303114444',
                'email' => 'teacher1@ihadir.com',
                'position' => 'Guru Besar',
                'gender' => 'Male',
                'phone' => '013-1112222',
            ],
            [
                'user_type' => 'teacher',
                'first_name' => 'Siti',
                'last_name' => 'binti Abu',
                'ic_number' => '850404115555',
                'email' => 'teacher2@ihadir.com',
                'position' => 'Guru Biasa',
                'gender' => 'Female',
                'phone' => '013-3334444',
            ],

            // --- SECURITY STAFF (1) ---
            [
                'user_type' => 'security_staff',
                'first_name' => 'Muthu',
                'last_name' => 'a/l Samy',
                'ic_number' => '750505116666',
                'email' => 'security@ihadir.com',
                'position' => 'Security Guard',
                'gender' => 'Male',
                'phone' => '014-5556666',
            ],

            // --- CLEANING STAFF (1) ---
            [
                'user_type' => 'staff',
                'first_name' => 'Aminah',
                'last_name' => 'binti Yasin',
                'ic_number' => '880606117777',
                'email' => 'cleaner@ihadir.com',
                'position' => 'Cleaning Staff',
                'gender' => 'Female',
                'phone' => '014-7778888',
            ],
        ];

        // 4. Insert Users and Link Employments
        $defaultPassword = Hash::make('password');

        foreach ($usersToSeed as $u) {
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

            // Link Teacher Employments
            if ($u['user_type'] === 'teacher') {
                DB::table('teacher_employments')->insert([
                    'teacher_id' => $userId, // Now references user_id in the users table
                    'school_session_id' => $sessionId,
                    'position' => $u['position'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Link Staff Employments (Security and Cleaners)
            if ($u['user_type'] === 'security_staff' || $u['user_type'] === 'staff') {
                DB::table('staff_employments')->insert([
                    'staff_id' => $userId, // Now references user_id in the users table
                    'school_session_id' => $sessionId,
                    'staff_type' => $u['position'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}