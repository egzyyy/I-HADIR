<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add user_type to distinguish between admin, teacher, and security staff
            $table->enum('user_type', ['admin', 'teacher', 'security_staff'])
                ->default('admin')
                ->after('school_id')
                ->comment('Type of user: admin, teacher, or security_staff');
            
            // Add gender field for consistency with teacher/staff tables
            $table->enum('gender', ['Male', 'Female'])->nullable()->after('ic_number');
            
            // Rename address to street_address for clarity
            $table->renameColumn('address', 'street_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['user_type', 'gender']);
            $table->renameColumn('street_address', 'address');
        });
    }
};
