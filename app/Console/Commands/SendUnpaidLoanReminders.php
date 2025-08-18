<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProjectModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendUnpaidLoanReminders extends Command
{
    protected $signature = 'loans:send-unpaid-reminders';
    protected $description = 'Send email reminders to companies with unpaid loans for the current month';

    public function handle()
    {
        $today = Carbon::today();

        // Only run on the 15th of the month
        if ($today->day !== 15) {
            $this->info('Not the 15th. Skipping.');
            return;
        }

        $month = $today->month;
        $year  = $today->year;

        $this->info("Checking unpaid loans for {$month}/{$year}...");

        $projects = ProjectModel::with([
                'company',
                'loans' => function ($q) use ($month, $year) {
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
            ->whereHas('loans', function ($q) use ($month, $year) {
                $q->whereMonth('month_paid', $month)
                  ->whereYear('month_paid', $year)
                  ->where('status', 'unpaid');
            })
            ->get();

        if ($projects->isEmpty()) {
            $this->info('No unpaid loans found for this month.');
            return;
        }

        foreach ($projects as $project) {
            $companyEmail = $project->company->email;
            if (!$companyEmail) {
                Log::info("Skipping project {$project->project_id} - no email");
                continue;
            }

            try {
                Mail::raw(
                    "Dear {$project->company->company_name},\n\n".
                    "PLEASE DISREGARD! This is a test reminder that for {$today->format('F Y')} is currently unpaid.\n\n".
                    "Project: {$project->project_title}\n".
                    "Amount Due: {$project->refund_amount}\n\n".
                    "Please make payment at your earliest convenience.",
                    function ($message) use ($companyEmail, $project) {
                        $message->to($companyEmail)
                                ->subject("Unpaid Loan Reminder - {$project->project_title}");
                    }
                );

                Log::info("Reminder sent to {$companyEmail} for project {$project->project_id}");
            } catch (\Exception $e) {
                Log::error("Failed to send email to {$companyEmail}: " . $e->getMessage());
            }
        }

        $this->info('Unpaid loan reminders processed.');
    }
}
