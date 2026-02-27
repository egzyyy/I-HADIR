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
            $table->string('ic_number', 12)->unique()->comment('No. MyKad / MyKid (12 digits, no dashes)');
            $table->string('gender', 20)->nullable();
            $table->string('race', 50)->nullable();
            $table->string('religion', 50)->nullable();
            
            // Student Contact & Address
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('email')->nullable();
            $table->string('phone_num')->nullable();
            
            // Father Details
            $table->string('father_name')->nullable();
            $table->string('father_ic', 12)->nullable();
            $table->string('father_phone_num')->nullable();
            $table->string('father_status')->nullable()->comment('Masih Hidup, Meninggal Dunia, Bercerai, etc.');

            // Mother Details
            $table->string('mother_name')->nullable();
            $table->string('mother_ic', 12)->nullable();
            $table->string('mother_phone_num')->nullable();
            $table->string('mother_status')->nullable()->comment('Masih Hidup, Meninggal Dunia, Bercerai, etc.');

            // Guardian Details
            $table->string('guardian_name')->nullable();
            $table->string('guardian_ic', 12)->nullable();
            $table->string('guardian_phone_num')->nullable();
            $table->string('guardian_relation')->nullable()->comment('Datuk, Nenek, Bapa Saudara, etc.');

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