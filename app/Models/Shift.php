<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'start_time',
        'end_time',
        'is_overnight',
        'is_active',
    ];

    protected $casts = [
        'is_overnight' => 'boolean',
        'is_active'    => 'boolean',
    ];
}
