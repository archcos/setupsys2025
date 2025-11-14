<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('refunds:send-unpaid-reminders')->dailyAt('15:33');

//crontab -e
//cd /path/to/your/project
//artisan schedule:run >> /dev/null 2>&1 or php artisan schedule:run >> /dev/null 2>&1


//code for testing in windows:
    //php artisan refunds:send-unpaid-reminders