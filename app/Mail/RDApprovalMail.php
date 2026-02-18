<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RDApprovalMail extends Mailable
{
    use Queueable, SerializesModels;

    public $project;
    public $approvedBy;

    public function __construct($project, $approvedBy)
    {
        $this->project = $project;
        $this->approvedBy = $approvedBy;
    }

    public function build()
    {
        // Attach PNG images
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as' => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as' => 'logo.png',
            'mime' => 'image/png',
        ]);

        $projectTitle = $this->project->project_title ?? 'N/A';
        $companyName = $this->project->company->company_name ?? 'N/A';
        $approvedByName = $this->approvedBy->name ?? 'Unknown User';
        $approvalDate = now()->format('F d, Y \a\t h:i A');
        $projectId = $this->project->project_id ?? 'N/A';
        $yearObligated = $this->project->year_obligated ?? 'N/A';
        $currentYear = \Carbon\Carbon::now()->year;

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
                    <div style='background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>✓ Project Approved</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Approved on {$approvalDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Hello,<br><br>
                            We are pleased to inform you that your project has been approved by the Regional Director.
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #059669; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Company Name</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$companyName}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project ID</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectId}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Year Obligated</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$yearObligated}</p>
                            </div>
                        </div>

                        <!-- Approval Information -->
                        <div style='background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #059669; font-size: 16px; font-weight: 600;'>Approval Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Approved By</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$approvedByName}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Approval Status</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>
                                    <span style='display: inline-block; background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 12px; font-size: 14px;'>
                                        ✓ Approved by Regional Director
                                    </span>
                                </p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Approval Date & Time</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$approvalDate}</p>
                            </div>
                        </div>

                        <!-- Success Message -->
                        <div style='background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <h3 style='margin: 0 0 10px 0; color: #059669; font-size: 15px; font-weight: 600;'>Congratulations!</h3>
                            <p style='margin: 0; color: #666; font-size: 13px;'>
                                Your project has been successfully approved and is ready for implementation.
                            </p>
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

        return $this->subject('[DOSTNM-SIMS] Project Approved - ' . $projectTitle)
                    ->html($htmlContent);
    }
}