<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacilityLog extends Model
{
    protected $table = 'facility_logs';

    protected $fillable = [
        'school_id',
        'user_type',
        'user_id',
        'facility_type',
        'date',
        'check_in_time',
        'check_out_time',
    ];

    protected $casts = [
        'date'           => 'date',
        'check_in_time'  => 'datetime',
        'check_out_time' => 'datetime',
    ];
}
