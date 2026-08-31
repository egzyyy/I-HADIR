<?php

namespace App\Console\Commands;

use App\Models\School;
use Illuminate\Console\Command;

class ConfigureGeofence extends Command
{
    protected $signature = 'school:geofence
                            {--school= : School slug (defaults to the only active school)}
                            {--lat= : Latitude, e.g. 4.7566000}
                            {--lng= : Longitude, e.g. 103.4246000}
                            {--radius= : Allowed distance from those coordinates, in metres}
                            {--enable : Turn the geofence on}
                            {--disable : Turn the geofence off}';

    protected $description = 'Show or set the kiosk-scanner geofence for a school';

    public function handle(): int
    {
        $school = $this->option('school')
            ? School::where('slug', $this->option('school'))->first()
            : School::where('is_active', true)->first();

        if (!$school) {
            $this->error('School not found.');
            return self::FAILURE;
        }

        if ($this->option('lat') !== null) {
            $school->latitude = (float) $this->option('lat');
        }
        if ($this->option('lng') !== null) {
            $school->longitude = (float) $this->option('lng');
        }
        if ($this->option('radius') !== null) {
            $school->geofence_radius_m = (int) $this->option('radius');
        }
        if ($this->option('enable')) {
            $school->geofence_enabled = true;
        }
        if ($this->option('disable')) {
            $school->geofence_enabled = false;
        }

        if ($school->geofence_enabled && ($school->latitude === null || $school->longitude === null)) {
            $this->error('Refusing to enable a geofence with no coordinates — every check-in would be rejected.');
            return self::FAILURE;
        }

        $school->save();

        $this->newLine();
        $this->line("  <info>{$school->name}</info>");
        $this->line('  coordinates : ' . ($school->latitude !== null
            ? $school->latitude . ', ' . $school->longitude
            : '<comment>not set</comment>'));
        $this->line('  radius      : ' . $school->geofence_radius_m . ' m');
        $this->line('  status      : ' . ($school->hasGeofence()
            ? '<info>ENABLED</info>'
            : '<comment>disabled</comment>'));
        $this->newLine();

        if (!$school->hasGeofence()) {
            $this->line('  Set it with:');
            $this->line('    php artisan school:geofence --lat=<lat> --lng=<lng> --radius=150 --enable');
            $this->newLine();
        }

        return self::SUCCESS;
    }
}
