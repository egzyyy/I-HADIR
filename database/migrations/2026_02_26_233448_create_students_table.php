<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id('student_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            
            // Core Identity
            $table->string('name');
            $table->string('ic_number', 12)->comment('No. MyKad / MyKid (12 digits, no dashes)');
            $table->string('gender', 20)->nullable();
            $table->string('class')->nullable();
            $table->string('profile_pic_path')->nullable();
        
            // Student Contact & Address
            $table->text('address')->nullable();
            $table->string('email')->nullable();
            $table->string('phone_num')->nullable();
            
            // Father Details
            $table->string('father_name')->nullable();
            $table->string('father_ic', 12)->nullable();
            $table->string('father_phone_num')->nullable();

            // Mother Details
            $table->string('mother_name')->nullable();
            $table->string('mother_ic', 12)->nullable();
            $table->string('mother_phone_num')->nullable();

            // Guardian Details
            $table->string('emergency_name')->nullable();
            $table->string('emergency_phone_num')->nullable();
            $table->string('emergency_relation')->nullable()->comment('Datuk, Nenek, Bapa Saudara, etc.');

            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};