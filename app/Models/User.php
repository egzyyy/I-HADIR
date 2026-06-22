<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    // 1. Define custom primary key
    protected $primaryKey = 'user_id';

    // 2. Add all the new fields to the fillable array
    protected $fillable = [
        'school_id',
        'user_type',
        'first_name',
        'last_name',
        'ic_number',
        'gender',
        'profile_pic_path',
        'email',
        'password',
        'phone_num',
        'position',
        'bio_desc',
        'street_address',
        'city',
        'state',
        'postcode',
        'country',
        'emergency_contact_name',
        'emergency_relationship',
        'emergency_phone_num',
        'is_active',
    ];

    // 3. Hide sensitive data from arrays/JSON
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // 4. Cast dates and hashed passwords
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // 5. Relationship to the school
    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }

    // 6. Get full name accessor
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    
}