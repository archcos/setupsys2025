<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProjectModel;
use App\Models\RestructureModel;
use App\Models\RestructureUpdateModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\UnpaidRefundReminderMail;

class SendUnpaidLoanReminders extends Command
{
    protected $signature = 'refunds:send-unpaid-reminders';
    protected $description = 'Send email reminders to companies with unpaid refunds for the current month';

    /**
     * Helper method to get the refund amount for a specific month considering restructures
     * 
     * @param ProjectModel $project
     * @param Carbon $monthDate
     * @return float
     */
    private function getRefundAmountForMonth(ProjectModel $project, Carbon $monthDate)
    {
        // Check if there's an approved restructure with updates for this month
        $approvedRestructures = RestructureModel::where('project_id', $project->project_id)
            ->where('status', 'approved')
            ->get();

        foreach ($approvedRestructures as $restructure) {
            $restructureStart = Carbon::parse($restructure->restruct_start);
            $restructureEnd = Carbon::parse($restructure->restruct_end);

            // Check if there are updates for this restructure
            $updates = RestructureUpdateModel::where('restruct_id', $restructure->restruct_id)->get();

            foreach ($updates as $update) {
                $updateStart = Carbon::parse($update->update_start);
                $updateEnd = Carbon::parse($update->update_end);

                // If the month falls within the update period, use the update amount
                if ($monthDate->isBetween($updateStart, $updateEnd)) {
                    return $update->update_amount;
                }
            }
        }

        // If no updates apply, use the default refund amount
        // Check if it's the last month
        if ($project->refund_end && $monthDate->isSameMonth(Carbon::parse($project->refund_end))) {
            return $project->last_refund ?? 0;
        }

        return $project->refund_amount ?? 0;
    }

    /**
     * Check if a project should skip reminder for the current month
     * Only skip if in restructure period WITHOUT any update amounts
     * 
     * @param ProjectModel $project
     * @param Carbon $monthDate
     * @return bool
     */
    private function shouldSkipReminderForMonth(ProjectModel $project, Carbon $monthDate)
    {
        $approvedRestructures = RestructureModel::where('project_id', $project->project_id)
            ->where('status', 'approved')
            ->get();

        foreach ($approvedRestructures as $restructure) {
            $restructureStart = Carbon::parse($restructure->restruct_start);
            $restructureEnd = Carbon::parse($restructure->restruct_end);

            // Check if month is within restructure period
            if ($monthDate->isBetween($restructureStart, $restructureEnd)) {
                // Check if there are updates for this restructure
                $updates = RestructureUpdateModel::where('restruct_id', $restructure->restruct_id)->get();

                // If there are no updates at all, skip the reminder
                if ($updates->isEmpty()) {
                    return true;
                }

                // Check if this specific month has an update with an amount
                foreach ($updates as $update) {
                    $updateStart = Carbon::parse($update->update_start);
                    $updateEnd = Carbon::parse($update->update_end);

                    // If the month falls within an update period with an amount, DON'T skip
                    if ($monthDate->isBetween($updateStart, $updateEnd) && $update->update_amount > 0) {
                        return false;
                    }
                }

                // If in restructure period but not in any update period, skip
                return true;
            }
        }

        return false;
    }

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

        // Get projects with unpaid refunds
        $projectsWithUnpaid = ProjectModel::with([
                'company',
                'refunds' => function ($q) use ($month, $year) {
                    $q->whereMonth('month_paid', $month)
                      ->whereYear('month_paid', $year)
                      ->latest();
                }
            ])
            ->whereDate('refund_initial', '<=', $today)
            ->whereDate('refund_end', '>=', $today)
            ->whereHas('company', function ($q) {
                $q->whereNotNull('email')->where('email', '!=', '');
            })
            ->whereHas('refunds', function ($q) use ($month, $year) {
                $q->whereMonth('month_paid', $month)
                  ->whereYear('month_paid', $year)
                  ->where('status', 'unpaid');
            })
            ->get();

        // Get projects that should be paying this month but have no refund record
        $projectsWithoutRecord = ProjectModel::with(['company'])
            ->whereDate('refund_initial', '<=', $today)
            ->whereDate('refund_end', '>=', $today)
            ->whereHas('company', function ($q) {
                $q->whereNotNull('email')->where('email', '!=', '');
            })
            ->whereDoesntHave('refunds', function ($q) use ($month, $year) {
                $q->whereMonth('month_paid', $month)
                  ->whereYear('month_paid', $year);
            })
            ->get();

        // Filter out projects that should skip reminders (restructured without updates)
        $projectsWithoutRecord = $projectsWithoutRecord->reject(function ($project) use ($today) {
            return $this->shouldSkipReminderForMonth($project, $today);
        });

        // Merge both collections
        $projects = $projectsWithUnpaid->merge($projectsWithoutRecord);

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
                $monthFormatted = $today->format('F Y');
                
                // Get the correct refund amount for this month (considering restructures)
                $refundAmount = $this->getRefundAmountForMonth($project, $today);
                
                Mail::to($companyEmail)->send(
                    new UnpaidRefundReminderMail(
                        $project->company->company_name,
                        $project->project_title,
                        $refundAmount,
                        $monthFormatted,
                        $daysLeft,
                        $isDeadlineDay
                    )
                );

                Log::info("Reminder sent to {$companyEmail} for project {$project->project_id} (Amount: ₱{$refundAmount})");
                $this->info("✓ Sent reminder to {$companyEmail} (₱" . number_format($refundAmount, 2) . ")");
            } catch (\Exception $e) {
                Log::error("Failed to send email to {$companyEmail}: " . $e->getMessage());
                $this->error("✗ Failed to send to {$companyEmail}");
            }
        }

        $this->info('Unpaid refund reminders processed successfully.');
    }
}