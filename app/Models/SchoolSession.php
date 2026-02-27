<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolSession extends Model
{
    use HasFactory;

    protected $table = 'school_sessions';

    // Define custom primary key
    protected $primaryKey = 'school_session_id';

    // Mass assignable attributes
    protected $fillable = [
        'school_id',
        'year',
        'start_date',
        'end_date',
        'is_active',
    ];

    // Automatically cast data types
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Define the relationship to the School model
     */
    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }
}