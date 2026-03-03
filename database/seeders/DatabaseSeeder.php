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

        // 2. Create Active School Session
        DB::table('school_sessions')->insert([
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
    }
}
