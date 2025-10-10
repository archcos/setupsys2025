<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
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

