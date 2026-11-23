<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VisitorLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'visitor_logs';

    protected $fillable = [
        'school_id',
        'visitor_id',
        'phone_number',
        'plate_number',
        'category',
        'person_to_meet',
        'pass_badge_no',
        'purpose',
        'notes',
        'status',
        'check_in_time',
        'check_out_time',
    ];

    protected $casts = [
        'check_in_time'  => 'datetime',
        'check_out_time' => 'datetime',
    ];

    public function visitor()
    {
        return $this->belongsTo(Visitor::class, 'visitor_id', 'visitor_id');
    }

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }
}