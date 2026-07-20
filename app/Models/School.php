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
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function schoolSession()
    {
        return $this->hasMany(SchoolSession::class, 'school_id', 'school_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'school_id', 'school_id');
    }
}