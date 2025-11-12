<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProjectModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendUnpaidLoanReminders extends Command
{
    protected $signature = 'refunds:send-unpaid-reminders';
    protected $description = 'Send email reminders to companies with unpaid refunds for the current month';

    public function handle()
    {
        $today = Carbon::today();

        // Only run on the 7th, 10th, 14th, and 15th of the month
        if (!in_array($today->day, [7, 10, 14, 15])) {
            $this->info('Not the 7th, 10th, 14th, or 15th. Skipping.');
            return;
        }

        // Calculate days left until deadline (15th)
        $deadline = Carbon::create($today->year, $today->month, 15);
        $daysLeft = $today->diffInDays($deadline, false);
        $isDeadlineDay = ($today->day === 15);

        $month = $today->month;
        $year  = $today->year;

        $this->info("Checking unpaid refunds for {$month}/{$year}... " . 
                    ($isDeadlineDay ? "(TODAY IS THE DEADLINE!)" : "({$daysLeft} days until deadline)"));

        $projects = ProjectModel::with([
                'company',
                'refunds' => function ($q) use ($month, $year) {
                    $q->whereMonth('month_paid', $month)
                      ->whereYear('month_paid', $year)
                      ->latest();
                }
            ])
            // Must be in refund/payment period
            ->whereDate('refund_initial', '<=', $today)
            ->whereDate('refund_end', '>=', $today)
            // Must have a valid email
            ->whereHas('company', function ($q) {
                $q->whereNotNull('email')->where('email', '!=', '');
            })
            // Must have loans for the current month that are unpaid
            ->whereHas('refunds', function ($q) use ($month, $year) {
                $q->whereMonth('month_paid', $month)
                  ->whereYear('month_paid', $year)
                  ->where('status', 'unpaid');
            })
            ->get();

        if ($projects->isEmpty()) {
            $this->info('No unpaid refunds found for this month.');
            return;
        }

        foreach ($projects as $project) {
            $companyEmail = $project->company->email;
            if (!$companyEmail) {
                Log::info("Skipping project {$project->project_id} - no email");
                continue;
            }

            try {
                $deadlineMessage = $isDeadlineDay 
                    ? "TODAY IS THE DEADLINE!" 
                    : "{$daysLeft} days (Deadline: 15th)";

                Mail::raw(
                    "Dear {$project->company->company_name},\n\n".
                    "This is a reminder that your refund obligation for {$today->format('F Y')} is currently unpaid.\n\n".
                    "Project: {$project->project_title}\n".
                    "Amount Due: {$project->refund_amount}\n".
                    "Days Left Until Deadline: {$deadlineMessage}\n\n".
                    "Please make payment at your earliest convenience.\n\n".
                    "Note: If you submitted a Project Restructure for this time period, please disregard this reminder.",
                    function ($message) use ($companyEmail, $project) {
                        $message->to($companyEmail)
                                ->subject("Unpaid Refund Reminder - {$project->project_title}");
                    }
                );

                Log::info("Reminder sent to {$companyEmail} for project {$project->project_id}");
            } catch (\Exception $e) {
                Log::error("Failed to send email to {$companyEmail}: " . $e->getMessage());
            }
        }

        $this->info('Unpaid refund reminders processed.');
    }
}