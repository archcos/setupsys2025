<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ProjectCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $project;
    public $company;
    public $createdBy;

    public function __construct($project, $company, $createdBy)
    {
        $this->project = $project;
        $this->company = $company;
        $this->createdBy = $createdBy;
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
        $companyName = $this->company->company_name ?? 'N/A';
        $projectId = $this->project->project_id ?? 'N/A';
        $projectCost = '₱' . number_format($this->project->project_cost ?? 0, 2);
        $createdByName = $this->createdBy->name ?? 'Unknown User';
        $createdDate = $this->project->created_at->format('F d, Y \a\t h:i A');
        $itemCount = $this->project->items()->where('report', 'approved')->count();
        $objectiveCount = $this->project->objectives()->where('report', 'approved')->count();
        $ownerName = $this->company->owner_name ?? 'Valued Partner';
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
                    <div style='background: linear-gradient(135deg, #0056b3 0%, #003d82 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.png' alt='SETUP Logo' style='max-width: 120px; height: auto; margin: 0 auto 15px; display: block;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>New Project Created</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Created on {$createdDate}</p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 10px 0; color: #555; font-size: 16px;'>
                            Hello,<br><br>
                        </p>
                        
                        <!-- Congratulations Banner -->
                        <div style='background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 8px; padding: 20px; margin: 0 0 30px 0; text-align: center;'>
                            <p style='margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;'>
                                🎉 Congratulations!
                            </p>
                            <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 15px;'>
                                A new project has been successfully created for <strong>{$companyName}</strong>
                            </p>
                        </div>

                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            We're excited to support your business growth through this new project initiative. All details have been logged in the system and are ready for processing.
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid #0056b3; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #0056b3; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Title</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectTitle}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project ID</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectId}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Company Name</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$companyName}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Project Cost</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$projectCost}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Items & Objectives</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$itemCount} Items | {$objectiveCount} Objectives</p>
                            </div>
                        </div>

                        <!-- Created By Information -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid #0056b3; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #0056b3; font-size: 16px; font-weight: 600;'>Creation Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Created By</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$createdByName}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Creation Date</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$createdDate}</p>
                            </div>
                        </div>

                        <!-- Project Summary -->
                        <div style='background-color: #e8f4fd; border: 1px solid #bee3f8; border-radius: 4px; padding: 20px; margin: 30px 0;'>
                            <h4 style='margin: 0 0 10px 0; color: #0056b3; font-size: 14px; font-weight: 600;'>Project Summary</h4>
                            <ul style='margin: 0; padding-left: 20px; color: #333; font-size: 14px;'>
                                <li style='margin-bottom: 8px;'>Project Title: <strong>{$projectTitle}</strong></li>
                                <li style='margin-bottom: 8px;'>Total Cost: <strong>{$projectCost}</strong></li>
                                <li style='margin-bottom: 8px;'>Items: <strong>{$itemCount}</strong></li>
                                <li>Objectives: <strong>{$objectiveCount}</strong></li>
                            </ul>
                        </div>

                        <!-- Call to Action -->
                        <div style='background-color: #e8f4fd; border: 1px solid #bee3f8; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 15px 0; color: #0056b3; font-size: 14px; font-weight: 500;'>
                                ✓ Project has been successfully created in SETUPSYS
                            </p>
                            <p style='margin: 0; color: #666; font-size: 13px;'>
                                Please log in to the system to review and proceed with the next steps.
                            </p>
                        </div>

                        <!-- Visit Site Button -->
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='http://192.168.0.7:8096/' style='display: inline-block; background: linear-gradient(135deg, #0056b3 0%, #003d82 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 8px rgba(0,86,179,0.3);'>
                                Visit SETUPSYS Portal →
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

        return $this->subject('[SETUPSYS] New Project Created - ' . $projectTitle)
                    ->html($htmlContent);
    }
}