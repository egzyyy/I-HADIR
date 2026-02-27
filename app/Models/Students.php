<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'student_id';

    protected $fillable = [
        'school_id',
        'name',
        'ic_number',
        'gender',
        'race',
        'religion',
        'address',
        'city',
        'state',
        'email',
        'phone_num',
        'father_name',
        'father_ic',
        'father_phone_num',
        'father_status',
        'mother_name',
        'mother_ic',
        'mother_phone_num',
        'mother_status',
        'guardian_name',
        'guardian_ic',
        'guardian_phone_num',
        'guardian_relation',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }
}