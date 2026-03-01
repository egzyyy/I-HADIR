<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $table = 'staffs';

    protected $primaryKey = 'staff_id';

    protected $fillable = [
        'school_id',
        'name',
        'ic_number',
        'phone_number',
        'email',
        'gender',
        'staff_type',
        'profile_pic_path',
        'emergency_name',
        'emergency_phone_num',
        'emergency_relation',
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
