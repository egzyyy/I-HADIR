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
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->foreignId('school_id')->nullable()->references('school_id')->on('schools')->cascadeOnDelete();
            
            // Core Identity & Auth
            $table->string('first_name');
            $table->string('last_name');
            $table->string('ic_number', 12)->unique()->nullable()->comment('No. Kad Pengenalan');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // Job & Contact Details
            $table->string('phone_num')->nullable();
            $table->string('position')->nullable()->comment('E.g., Pengetua, PKHEM, Guru Data, Admin IT');
            $table->text('bio_desc')->nullable();
            
            // Address
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postcode', 10)->nullable();
            $table->string('country')->default('Malaysia');

            // Emergency Contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_relationship')->nullable();
            $table->string('emergency_phone_num')->nullable();

            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes(); // Protects admin records from accidental permanent deletion
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
