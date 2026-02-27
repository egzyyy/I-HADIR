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
        Schema::create('schools', function (Blueprint $table) {
            // Custom Primary Key
            $table->id('school_id');
            
            // Core Identity
            $table->string('school_code')->unique()->comment('Kod Sekolah (e.g., MEA1001)');
            $table->string('name');
            
            // Contact Information
            $table->string('email')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('fax_number')->nullable();
            
            // Address Details
            $table->text('address')->nullable();
            $table->string('postcode', 10)->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            
            // Settings & System flags
            $table->string('logo_path')->nullable(); 
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
        Schema::dropIfExists('schools');
    }
}; 