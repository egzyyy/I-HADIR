<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkOrder extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'work_order_id';

    protected $fillable = [
        'school_id',
        'school_session_id',
        'user_id',
        'description',
        'date_from',
        'date_to',
        'location',
        'category',
        'document_path',
        'document_name',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'date_from'    => 'date:Y-m-d',
        'date_to'      => 'date:Y-m-d',
        'submitted_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function participants()
    {
        return $this->hasMany(WorkOrderParticipant::class, 'work_order_id', 'work_order_id');
    }
}
