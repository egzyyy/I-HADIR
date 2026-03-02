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
        Schema::create('staffs', function (Blueprint $table) {
            $table->id('staff_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            
            // Core Identity
            $table->string('name');
            $table->string('ic_number', 12)->comment('No. Kad Pengenalan (12 digits, no dashes)');
            $table->string('gender', 20)->nullable();
            $table->string('profile_pic_path')->nullable();
            $table->string('staff_type')->nullable()->comment('Cleaner, Security, Admin, etc.');
            
            // Contact
            $table->string('phone_number')->nullable();
            $table->string('email')->nullable();

            // Guardian Details
            $table->string('emergency_name')->nullable();
            $table->string('emergency_phone_num')->nullable();
            $table->string('emergency_relation')->nullable()->comment('Datuk, Nenek, Bapa Saudara, etc.');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staffs');
    }
};
