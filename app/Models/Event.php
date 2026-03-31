<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'event_id';

    protected $fillable = [
        'school_id',
        'school_session_id',
        'name',
        'description',
        'event_date',
        'event_time',
        'location',
        'banner_path',
        'participant_types',
        'is_active',
    ];

    protected $casts = [
        'event_date'        => 'date',
        'participant_types' => 'array',
        'is_active'         => 'boolean',
    ];
}
