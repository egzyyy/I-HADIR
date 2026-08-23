<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class School extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'schools';
    protected $primaryKey = 'school_id';

    protected $fillable = [
        'school_code',
        'name',
        'slug',
        'email',
        'phone_number',
        'fax_number',
        'address',
        'postcode',
        'city',
        'state',
        'logo_path',
        'is_active',
        'latitude',
        'longitude',
        'geofence_radius_m',
        'geofence_enabled',
    ];

    protected $casts = [
        'is_active'         => 'boolean',
        'geofence_enabled'  => 'boolean',
        'latitude'          => 'float',
        'longitude'         => 'float',
        'geofence_radius_m' => 'integer',
    ];

    /** A geofence is only usable once coordinates have actually been set. */
    public function hasGeofence(): bool
    {
        return $this->geofence_enabled
            && $this->latitude !== null
            && $this->longitude !== null;
    }

    /**
     * Great-circle distance in metres from the school to a point (Haversine).
     * Accurate to well under a metre at the scale of a school compound.
     */
    public function distanceMetersTo(float $lat, float $lng): float
    {
        $earthRadius = 6371000;

        $dLat = deg2rad($lat - (float) $this->latitude);
        $dLng = deg2rad($lng - (float) $this->longitude);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad((float) $this->latitude)) * cos(deg2rad($lat)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    public function schoolSession()
    {
        return $this->hasMany(SchoolSession::class, 'school_id', 'school_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'school_id', 'school_id');
    }
}