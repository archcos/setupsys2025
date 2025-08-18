<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('loans:send-unpaid-reminders')->dailyAt('14:59');

//crontab -e
//cd /path/to/your/project
//artisan schedule:run >> /dev/null 2>&1 or php artisan schedule:run >> /dev/null 2>&1
