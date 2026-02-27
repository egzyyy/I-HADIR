<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id('teacher_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            
            // Core Identity
            $table->string('name');
            $table->string('ic_number', 12)->unique()->comment('No. Kad Pengenalan (12 digits, no dashes)');
            $table->string('gender', 20)->nullable();
            
            // New Demographic & Qualification Fields
            $table->string('race', 50)->nullable();
            $table->string('religion', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('qualifications')->nullable()->comment('E.g., Ijazah Sarjana Muda Pendidikan');
            
            // Contact
            $table->string('phone_number')->nullable();
            $table->string('email')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};