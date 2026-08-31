<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Geofence for the public kiosk scanner: an anonymous scan must come from
     * within `geofence_radius_m` of the school's coordinates.
     *
     * Ships disabled with no coordinates on purpose — enabling it against a
     * guessed location would reject every legitimate check-in at the school.
     * Set real coordinates first (php artisan school:geofence).
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('state');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->unsignedInteger('geofence_radius_m')->default(150)->after('longitude');
            $table->boolean('geofence_enabled')->default(false)->after('geofence_radius_m');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn([
                'latitude',
                'longitude',
                'geofence_radius_m',
                'geofence_enabled',
            ]);
        });
    }
};
