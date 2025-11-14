<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RestructureRaisedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $restructure;
    public $project;
    public $company;
    public $recipientName;
    public $remarks;

    public function __construct($restructure, $recipientName = null, $remarks = null)
    {
        $this->restructure = $restructure;
        $this->project = $restructure->project;
        $this->company = $this->project->company;
        $this->recipientName = $recipientName ?? 'Regional Director';
        $this->remarks = $remarks ?? 'No remarks provided';
    }

    public function build()
    {
        $projectTitle = $this->project->project_title ?? 'N/A';
        $companyName = $this->company->company_name ?? 'N/A';
        $raisedBy = $this->restructure->addedBy->name ?? 'Unknown User';
        $raisedDate = $this->restructure->created_at->format('F d, Y \a\t h:i A');
        $restructureType = $this->restructure->type ?? 'N/A';
        $startDate = \Carbon\Carbon::parse($this->restructure->restruct_start)->format('F Y');
        $endDate = \Carbon\Carbon::parse($this->restructure->restruct_end)->format('F Y');
        $remarks = nl2br(htmlspecialchars($this->remarks));

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
                    <div style='background: linear-gradient(135deg, #FF6B35 0%, #D84315 100%); padding: 40px 20px; text-align: center;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>Restructuring Request Raised</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Submitted on {$raisedDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Dear {$this->recipientName},<br><br>
                            A project restructuring request has been raised and is awaiting your review and approval.
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid #FF6B35; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #FF6B35; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
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

                        <!-- Restructuring Details -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid #FF6B35; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #FF6B35; font-size: 16px; font-weight: 600;'>Restructuring Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Restructuring Type</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$restructureType}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Duration</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$startDate} to {$endDate}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Raised By</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$raisedBy}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Remarks</p>
                                <p style='margin: 0; color: #333; font-size: 14px; padding: 10px; background-color: #ffffff; border-radius: 3px; border: 1px solid #e0e0e0;'>{$remarks}</p>
                            </div>
                        </div>

                        <!-- Call to Action -->
                        <div style='background-color: #FFF3E0; border: 1px solid #FFE0B2; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 15px 0; color: #E65100; font-size: 14px; font-weight: 600;'>
                                ⏱️ Your review and approval are requested.
                            </p>
                            <p style='margin: 0; color: #666; font-size: 13px;'>
                                Please log in to the system to review and approve this restructuring request.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #D84315 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(255,107,53,0.3);'>
                                Review in SETUPSYS Portal →
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;'>
                        <p style='margin: 0 0 10px 0; color: #666; font-size: 13px;'>
                            This is an automated notification from SETUPSYS
                        </p>
                        <p style='margin: 0; color: #999; font-size: 12px;'>
                            © 2024 SETUPSYS. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $this->subject('[SETUPSYS] Restructuring Request Raised - ' . $projectTitle)
                    ->html($htmlContent);
    }
}