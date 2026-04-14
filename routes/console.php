<?php

use Illuminate\Support\Facades\Schedule;

$schedule->command('refunds:send-unpaid-reminders')
    ->cron('30 8 7,10,14,15 * *'); //30 mins, 8am, 7th, 10th, 14th, 15th of every month, * * any year, any month, any day of week)

//crontab -e
//cd /path/to/your/project
//artisan schedule:run >> /dev/null 2>&1 or php artisan schedule:run >> /dev/null 2>&1


//code for testing in windows:
    //php artisan refunds:send-unpaid-reminders