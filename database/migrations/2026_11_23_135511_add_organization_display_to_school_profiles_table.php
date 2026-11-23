<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_profiles', function (Blueprint $table) {
            $table->string('organization_mode', 20)->default('builder')->after('organization');$table->string('organization_image', 255)->nullable()->after('organization_mode');
        });
    }

    public function down(): void
    {
        Schema::table('school_profiles', function (Blueprint $table) {$table->dropColumn(['organization_mode', 'organization_image']);
        });
    }
};