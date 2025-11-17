<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RDDisapprovalMail extends Mailable
{
    use Queueable, SerializesModels;

    public $project;
    public $disapprovedBy;
    public $remark;

    public function __construct($project, $disapprovedBy, $remark)
    {
        $this->project = $project;
        $this->disapprovedBy = $disapprovedBy;
        $this->remark = $remark;
    }

    public function build()
    {
        $projectTitle = $this->project->project_title ?? 'N/A';
        $companyName = $this->project->company->company_name ?? 'N/A';
        $disapprovedByName = $this->disapprovedBy->name ?? 'Unknown User';
        $disapprovalDate = now()->format('F d, Y \a\t h:i A');
        $projectId = $this->project->project_id ?? 'N/A';
        $yearObligated = $this->project->year_obligated ?? 'N/A';

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
                    <div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>⚠ Project Disapproved</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Disapproved on {$disapprovalDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Hello,<br><br>
                            Your project has been reviewed by the Regional Director and requires further revision. Please review the remarks below and make the necessary changes.
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #dc2626; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
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

                        <!-- Disapproval Information -->
                        <div style='background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #dc2626; font-size: 16px; font-weight: 600;'>Disapproval Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Disapproved By</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$disapprovedByName}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Disapproval Status</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>
                                    <span style='display: inline-block; background-color: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 12px; font-size: 14px;'>
                                        ⚠ Disapproved by Regional Director
                                    </span>
                                </p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Disapproval Date & Time</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$disapprovalDate}</p>
                            </div>
                        </div>

                        <!-- Remarks Section -->
                        <div style='background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 30px 0;'>
                            <h3 style='margin: 0 0 15px 0; color: #dc2626; font-size: 15px; font-weight: 600;'>📋 Remarks from Regional Director</h3>
                            <div style='background-color: #ffffff; border-left: 3px solid #dc2626; padding: 15px; border-radius: 4px;'>
                                <p style='margin: 0; color: #333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;'>{$this->remark}</p>
                            </div>
                        </div>

                        <!-- Action Required -->
                        <div style='background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <h3 style='margin: 0 0 10px 0; color: #dc2626; font-size: 15px; font-weight: 600;'>Action Required</h3>
                            <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                                Please address the remarks above and resubmit your project for review through the portal.
                            </p>
                            <p style='margin: 0; color: #dc2626; font-size: 12px; font-weight: 500;'>
                                📌 Status has been reset to Pending for revision.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © 2025 SETUPSYS. All rights reserved. | Do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] Project Disapproved - ' . $projectTitle)
                    ->html($htmlContent);
    }
}