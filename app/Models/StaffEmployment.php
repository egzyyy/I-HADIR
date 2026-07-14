<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffEmployment extends Model
{
    use HasFactory;

    protected $primaryKey = 'staff_employment_id';

    protected $fillable = [
        'staff_id',
        'school_session_id',
        'staff_type',
    ];

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id', 'user_id');
    }

    public function schoolSession()
    {
        return $this->belongsTo(SchoolSession::class, 'school_session_id', 'school_session_id');
    }
}