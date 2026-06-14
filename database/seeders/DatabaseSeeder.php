<?php

namespace Database\Seeders;

use App\Models\User;
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

        // 2. Create Active School Session (Using insertGetId to link employments)
        $sessionId = DB::table('school_sessions')->insertGetId([
            'school_id' => $schoolId,
            'year' => '2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Create Admin User
        DB::table('users')->insert([
            'school_id' => $schoolId,
            'first_name' => 'Admin',
            'last_name' => 'I-Hadir',
            'ic_number' => '909090909090',
            'email' => 'admin@ihadir.com',
            'password' => Hash::make('password'),
            'position' => 'System Administrator',
            'phone_num' => '012-3456789',
            'address' => '123 Admin Street, Kuala Lumpur',
            'city' => 'Kuala Lumpur',
            'state' => 'W.P Kuala Lumpur',
            'postcode' => '50000',
            'country' => 'Malaysia',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3b. Create Teacher Login User (same login table as admin)
        DB::table('users')->insert([
            'school_id' => $schoolId,
            'first_name' => 'Teacher',
            'last_name' => 'I-Hadir',
            'ic_number' => '808080808080',
            'email' => 'teacher@ihadir.com',
            'password' => Hash::make('password'),
            'position' => 'Teacher',
            'phone_num' => '012-3456788',
            'address' => 'Kuarters Guru SK Pulau Serai',
            'city' => 'Dungun',
            'state' => 'Terengganu',
            'postcode' => '23000',
            'country' => 'Malaysia',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3c. Create Security Login User (same login table as admin)
        DB::table('users')->insert([
            'school_id' => $schoolId,
            'first_name' => 'Security',
            'last_name' => 'I-Hadir',
            'ic_number' => '707070707070',
            'email' => 'security@ihadir.com',
            'password' => Hash::make('password'),
            'position' => 'Security',
            'phone_num' => '012-3456787',
            'address' => 'Pondok Pengawal SK Pulau Serai',
            'city' => 'Dungun',
            'state' => 'Terengganu',
            'postcode' => '23000',
            'country' => 'Malaysia',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Seed Teachers & Their Employments
        $teachers = [
            ['name' => 'Ahmad bin Abdullah', 'ic' => '800101112222', 'gender' => 'Male', 'phone' => '0123456701', 'position' => 'Pengetua'],
            ['name' => 'Siti binti Abu', 'ic' => '850202113333', 'gender' => 'Female', 'phone' => '0123456702', 'position' => 'PK HEM'],
            ['name' => 'Chong Wei', 'ic' => '900303114444', 'gender' => 'Male', 'phone' => '0123456703', 'position' => 'Guru Biasa'],
        ];

        foreach ($teachers as $t) {
            $teacherId = DB::table('teachers')->insertGetId([
                'school_id' => $schoolId,
                'name' => $t['name'],
                'ic_number' => $t['ic'],
                'gender' => $t['gender'],
                'phone_number' => $t['phone'],
                'email' => strtolower(str_replace(' ', '', $t['name'])) . '@school.edu.my',
                'address' => 'Kuarters Guru SK Pulau Serai',
                'emergency_name' => 'Emergency Contact',
                'emergency_phone_num' => '0198765432',
                'emergency_relation' => 'Spouse',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Link Teacher to Session via Pivot Table
            DB::table('teacher_employments')->insert([
                'teacher_id' => $teacherId,
                'school_session_id' => $sessionId,
                'position' => $t['position'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 5. Seed Staffs & Their Employments
        $staffs = [
            ['name' => 'Muthu a/l Samy', 'ic' => '750404115555', 'gender' => 'Male', 'phone' => '0123456704', 'type' => 'security_staff'],
            ['name' => 'Aminah binti Yasin', 'ic' => '880505116666', 'gender' => 'Female', 'phone' => '0123456705', 'type' => 'admin_clerk'],
            ['name' => 'Raju a/l Kumar', 'ic' => '820606117777', 'gender' => 'Male', 'phone' => '0123456706', 'type' => 'cleaning_staff'],
        ];

        foreach ($staffs as $s) {
            $staffId = DB::table('staffs')->insertGetId([
                'school_id' => $schoolId,
                'name' => $s['name'],
                'ic_number' => $s['ic'],
                'gender' => $s['gender'],
                'phone_number' => $s['phone'],
                'email' => strtolower(explode(' ', $s['name'])[0]) . '@school.edu.my',
                'address' => 'Kampung Pulau Serai',
                'emergency_name' => 'Family Member',
                'emergency_phone_num' => '0198765433',
                'emergency_relation' => 'Sibling',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Link Staff to Session via Pivot Table
            DB::table('staff_employments')->insert([
                'staff_id' => $staffId,
                'school_session_id' => $sessionId,
                'staff_type' => $s['type'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}