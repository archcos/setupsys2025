<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplyRestructureUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    public $applyRestruct;

    public function __construct($applyRestruct)
    {
        $this->applyRestruct = $applyRestruct;
    }

    public function build()
    {
        $projectTitle = $this->applyRestruct->project?->project_title ?? 'N/A';
        $companyName = $this->applyRestruct->project?->company->company_name ?? 'N/A';
        $updatedBy = $this->applyRestruct->addedBy?->name ?? 'Unknown User';
        $updatedDate = $this->applyRestruct->updated_at->format('F d, Y \a\t h:i A');
        $submittedDate = $this->applyRestruct->created_at->format('F d, Y \a\t h:i A');
        $currentYear = \Carbon\Carbon::now()->year;

        // Embed images as attachments
        $this->attach(resource_path('assets/SETUP_logo.webp'), [
            'as' => 'setup_logo.webp',
            'mime' => 'image/webp',
        ]);

        $this->attach(resource_path('assets/logo.webp'), [
            'as' => 'logo.webp',
            'mime' => 'image/webp',
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
                    <div style='background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;'>
                        <img src='cid:setup_logo.webp' alt='SETUP Logo' style='max-width: 120px; height: auto; margin-bottom: 15px;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;'>⚠️ Project Restructure Application Updated</h1>
                        <p style='margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>Last updated on {$updatedDate}</p>
                    </div>

                    <!-- Update Notice -->
                    <div style='background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px 30px; margin: 0;'>
                        <p style='margin: 0; color: #856404; font-size: 15px; font-weight: 600;'>
                            📝 This application has been updated. Please review the changes.
                        </p>
                    </div>

                    <!-- Main Content -->
                    <div style='padding: 40px 30px;'>
                        <p style='margin: 0 0 30px 0; color: #555; font-size: 16px;'>
                            Hello,<br><br>
                            A project restructure application has been updated and requires your review.
                        </p>

                        <!-- Project Information Card -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid #0056b3; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #0056b3; font-size: 16px; font-weight: 600;'>Project Information</h3>
                            
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
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$this->applyRestruct->project_id}</p>
                            </div>
                        </div>

                        <!-- Update Information -->
                        <div style='background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #d97706; font-size: 16px; font-weight: 600;'>Update Details</h3>
                            
                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Updated By</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$updatedBy}</p>
                            </div>

                            <div style='margin-bottom: 15px;'>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Last Updated</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$updatedDate}</p>
                            </div>

                            <div>
                                <p style='margin: 0 0 5px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Originally Submitted</p>
                                <p style='margin: 0; color: #333; font-size: 15px; font-weight: 600;'>{$submittedDate}</p>
                            </div>
                        </div>

                        <!-- Documents Section -->
                        <div style='background-color: #f8f9fa; border-left: 4px solid #0056b3; padding: 20px; margin: 30px 0; border-radius: 4px;'>
                            <h3 style='margin: 0 0 15px 0; color: #0056b3; font-size: 16px; font-weight: 600;'>📎 Updated Documents</h3>
                            
                            <table style='width: 100%; border-collapse: collapse;'>
                                <tr style='border-bottom: 1px solid #e0e0e0;'>
                                    <td style='padding: 10px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; width: 40%;'>Document</td>
                                    <td style='padding: 10px 0; color: #666; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'>Link</td>
                                </tr>
                                <tr style='border-bottom: 1px solid #e0e0e0;'>
                                    <td style='padding: 12px 0; color: #333; font-size: 14px;'>Proponent Letter</td>
                                    <td style='padding: 12px 0;'>
                                        " . ($this->applyRestruct->proponent ? "<a href='{$this->applyRestruct->proponent}' style='color: #0056b3; text-decoration: none; font-weight: 500;' target='_blank'>View Document →</a>" : "<span style='color: #999;'>Not provided</span>") . "
                                    </td>
                                </tr>
                                <tr style='border-bottom: 1px solid #e0e0e0;'>
                                    <td style='padding: 12px 0; color: #333; font-size: 14px;'>PSTO Letter</td>
                                    <td style='padding: 12px 0;'>
                                        " . ($this->applyRestruct->psto ? "<a href='{$this->applyRestruct->psto}' style='color: #0056b3; text-decoration: none; font-weight: 500;' target='_blank'>View Document →</a>" : "<span style='color: #999;'>Not provided</span>") . "
                                    </td>
                                </tr>
                                <tr style='border-bottom: 1px solid #e0e0e0;'>
                                    <td style='padding: 12px 0; color: #333; font-size: 14px;'>Annex C</td>
                                    <td style='padding: 12px 0;'>
                                        " . ($this->applyRestruct->annexc ? "<a href='{$this->applyRestruct->annexc}' style='color: #0056b3; text-decoration: none; font-weight: 500;' target='_blank'>View Document →</a>" : "<span style='color: #999;'>Not provided</span>") . "
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 12px 0; color: #333; font-size: 14px;'>Annex D</td>
                                    <td style='padding: 12px 0;'>
                                        " . ($this->applyRestruct->annexd ? "<a href='{$this->applyRestruct->annexd}' style='color: #0056b3; text-decoration: none; font-weight: 500;' target='_blank'>View Document →</a>" : "<span style='color: #999;'>Not provided</span>") . "
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- Call to Action -->
                        <div style='background-color: #e8f4fd; border: 1px solid #bee3f8; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;'>
                            <p style='margin: 0 0 15px 0; color: #0056b3; font-size: 14px; font-weight: 500;'>
                                ⏱️ Please review the updated application at your earliest convenience.
                            </p>
                            <p style='margin: 0; color: #666; font-size: 13px;'>
                                Once you finish reviewing, please visit the system to process the application.
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
                        <img src='cid:logo.webp' alt='Company Logo' style='max-width: 100px; height: auto; margin-bottom: 15px;'>
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

        return $this->subject('[SETUPSYS] Updated Project Restructure Application - ' . $projectTitle)
                    ->html($htmlContent);
    }
}