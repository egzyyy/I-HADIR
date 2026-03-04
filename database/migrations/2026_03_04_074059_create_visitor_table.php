<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id('visitor_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            
            // Core Identity (Removed IC Number)
            $table->string('name');
            $table->string('phone_number');
            $table->string('plate_number')->nullable();
            
            // Visit Details
            $table->string('category')->comment('Parent/Guardian, Official, Contractor, Vendor, Public');
            $table->string('person_to_meet');
            $table->string('pass_badge_no')->nullable()->comment('Physical pass given at guardhouse');
            $table->string('purpose')->comment('Meeting, Pickup, Delivery, Maintenance, Other');
            $table->text('notes')->nullable();
            
            // Status & Time Tracking
            $table->string('status')->default('In Premise')->comment('In Premise, Checked Out');
            $table->timestamp('check_out_time')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};