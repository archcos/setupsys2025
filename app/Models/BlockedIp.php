<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    use LogsActivity;
    protected $table = 'blocked_ips';

    protected $fillable = [
        'ip',
        'reason',
        'blocked_until',
    ];

    protected $dates = [
        'blocked_until',
    ];
}

