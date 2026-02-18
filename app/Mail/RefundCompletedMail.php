<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\ProjectModel;

class RefundCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $project;
    public $completedDate;

    public function __construct($projectId, $completedDate = null)
    {
        $this->project = ProjectModel::find($projectId);
        $this->completedDate = $completedDate ?? now()->format('F d, Y \a\t h:i A');
    }

    public function build()
    {
        if (!$this->project) {
            return $this;
        }

        $projectTitle = $this->project->project_title ?? 'N/A';
        $companyName = $this->project->company->company_name ?? 'N/A';
        $ownerName = $this->project->company->owner_name ?? 'Valued Client';
        $projectCost = number_format($this->project->project_cost, 2);
        $refundAmount = number_format($this->project->refund_amount, 2);
        $currentYear = \Carbon\Carbon::now()->year;

        // Attach PNG images
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as' => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as' => 'logo.png',
            'mime' => 'image/png',
        ]);

        $htmlContent = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            </head>
            <body style='margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>
                    <!-- Header -->
                    <div style='background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>🎉 All Refunds Complete!</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Completed on {$this->completedDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Hello {$ownerName},<br><br>
                            Congratulations! All refunds for your project have been successfully completed. Your project refund schedule is now fully paid.
                        </p>

                        <!-- Success Message -->
                        <div style='background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #22c55e; padding: 25px; margin: 30px 0; border-radius: 4px; text-align: center;'>
                            <p style='margin: 0; color: #16a34a; font-size: 18px; font-weight: 700;'>
                                ✓ Project Refund Status: COMPLETED
                            </p>
                        </div>

                        <!-- Project Information Card -->
                        <div style='background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #3b82f6; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Organization/Company</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$companyName}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project ID</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$this->project->project_id}</p>
                            </div>
                        </div>

                        <!-- Financial Summary -->
                        <div style='background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 20px 0; color: #16a34a; font-size: 16px; font-weight: 600;'>Financial Summary</h3>
                            
                            <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #dcfce7;'>
                                <p style='margin: 0; color: #666; font-size: 14px;'>Project Cost:</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>₱{$projectCost}</p>
                            </div>

                            <div style='display: flex; justify-content: space-between; align-items: center; padding: 12px 0;'>
                                <p style='margin: 0; color: #16a34a; font-size: 14px; font-weight: 600;'>Total Refunded:</p>
                                <p style='margin: 0; color: #16a34a; font-size: 16px; font-weight: 700;'>₱{$projectCost}</p>
                            </div>
                        </div>

                        <!-- Completion Details -->
                        <div style='background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;'>Completion Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Completion Date</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$this->completedDate}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Status</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>
                                    <span style='display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 12px; font-size: 14px; font-weight: 600;'>
                                        ✓ COMPLETED
                                    </span>
                                </p>
                            </div>
                        </div>

                        <!-- Thank You Message -->
                        <div style='background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 4px; padding: 25px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 10px 0; color: #1e40af; font-size: 15px; font-weight: 600;'>
                                Thank You for Your Partnership!
                            </p>
                            <p style='margin: 0; color: #1e3a8a; font-size: 14px;'>
                                We appreciate your partnership and look forward to supporting your future projects.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(34,197,94,0.3);'>
                                View in Portal →
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.png' alt='Company Logo' style='max-width: 100px; height: auto; margin: 0 auto 15px; display: block;'> 
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUP Information Management System (SIMS)
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUP Information Management System (SIMS). All rights reserved. | Do not reply to this email
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[DOSTNM-SIMS] Refund Completion Congratulations - ' . $projectTitle)
                    ->html($htmlContent);
    }
}