<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\ProjectModel;

class ComplianceCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $project;
    public $submittedBy;

    public function __construct($projectId, $submittedBy)
    {
        $this->project = ProjectModel::find($projectId);
        $this->submittedBy = $submittedBy;
    }

    public function build()
    {
        if (!$this->project) {
            return $this;
        }

        $projectTitle = $this->project->project_title ?? 'N/A';
        $companyName = $this->project->company->company_name ?? 'N/A';
        $submittedByName = $this->submittedBy->name ?? 'Unknown User';
        $submittedDate = now()->format('F d, Y \a\t h:i A');

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
                    <div style='background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>✓ Project Compliance Complete</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Submitted on {$submittedDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Hello,<br><br>
                            A project compliance has been completed with all required documents (4/4 links) and is now ready for your review and approval.
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #3b82f6; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Company Name</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$companyName}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project ID</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$this->project->project_id}</p>
                            </div>
                        </div>

                        <!-- Submission Information -->
                        <div style='background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #3b82f6; font-size: 16px; font-weight: 600;'>Submission Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Submitted By</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$submittedByName}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Submission Date</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$submittedDate}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Status</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>
                                    <span style='display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 12px; font-size: 14px;'>
                                        ✓ Complete (4/4 Links)
                                    </span>
                                </p>
                            </div>
                        </div>

                        <!-- Call to Action -->
                        <div style='background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 15px 0; color: #1e40af; font-size: 14px; font-weight: 500;'>
                                📋 This project compliance is now complete and ready for your review.
                            </p>
                            <p style='margin: 0; color: #1e3a8a; font-size: 13px;'>
                                Please review the submission and take appropriate action (Approve or Deny) in the system.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(59,130,246,0.3);'>
                                Review in Portal →
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © 2025 SETUPSYS. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] Project Compliance Complete - ' . $projectTitle)
                    ->html($htmlContent);
    }
}