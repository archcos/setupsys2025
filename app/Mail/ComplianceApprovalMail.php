<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ComplianceApprovalMail extends Mailable
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
        $projectTitle = $this->project->project_title ?? 'N/A';
        $companyName = $this->project->company->company_name ?? 'N/A';
        $approvedByName = $this->approvedBy->name ?? 'Unknown User';
        $approvalDate = now()->format('F d, Y \a\t h:i A');
        $projectId = $this->project->project_id ?? 'N/A';
        $yearObligated = $this->project->year_obligated ?? 'N/A';
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
                    <div style='background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>✓ Project Compliance Recommended</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Recommended on {$approvalDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Hello,<br><br>
                            A project compliance has been reviewed and recommended by the RPMU. This project is now being escalated to you for regional director review and final approval.
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #059669; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Proponent Name</p>
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
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Recommended By</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$approvedByName} (RPMU)</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Approval Status</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>
                                    <span style='display: inline-block; background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 12px; font-size: 14px;'>
                                        ✓ Recommended by RPMU
                                    </span>
                                </p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Approval Date & Time</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$approvalDate}</p>
                            </div>
                        </div>

                        <!-- Action Required -->
                        <div style='background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <h3 style='margin: 0 0 10px 0; color: #059669; font-size: 15px; font-weight: 600;'>Action Required</h3>
                            <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                                This project is now ready for your review and approval as Regional Director. Please proceed with your evaluation in the system.
                            </p>
                            <p style='margin: 0; color: #059669; font-size: 12px; font-weight: 500;'>
                                ⏱️ Please review at your earliest convenience.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(5,150,105,0.3); transition: all 0.3s ease;'>
                                View Project in Portal →
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <img src='cid:logo.png' alt='Company Logo' style='max-width: 100px; height: auto; margin: 0 auto 15px; display: block;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © {$currentYear} SETUPSYS. All rights reserved. | Do not reply to this email
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] Project Compliance Recommended - ' . $projectTitle)
                    ->html($htmlContent);
    }
}