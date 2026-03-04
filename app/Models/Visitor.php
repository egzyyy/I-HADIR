<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Visitor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'visitors';
    protected $primaryKey = 'visitor_id';

    protected $fillable = [
        'school_id',
        'name',
        'phone_number', // IC Number removed here
        'plate_number',
        'category',
        'person_to_meet',
        'pass_badge_no',
        'purpose',
        'notes',
        'status',
        'check_out_time',
    ];

    protected $casts = [
        'check_out_time' => 'datetime',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }
}