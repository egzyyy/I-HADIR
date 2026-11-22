<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkOrderParticipant extends Model
{
    protected $fillable = [
        'work_order_id',
        'participant_type',
        'participant_id',
    ];

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
    }
}
