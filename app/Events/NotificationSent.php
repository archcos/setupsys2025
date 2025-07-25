<?php

namespace App\Events;

use App\Models\NotificationModel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public function __construct(NotificationModel $notification)
    {
        $this->notification = $notification;
    }

    public function broadcastOn()
    {
        return new Channel('office.' . $this->notification->office_id);
    }

    public function broadcastAs()
    {
        return 'notification.received';
    }

    public function broadcastWith()
    {
        return [
            'notification' => [
                'notification_id' => $this->notification->notification_id,
                'title' => $this->notification->title,
                'message' => $this->notification->message,
                'office_id' => $this->notification->office_id,
                'is_read' => false,
                'created_at' => $this->notification->created_at,
            ]
        ];
    }
}