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
        $disapprovedByName = $this->disapprovedBy->name ?? 'Unknown User';
        $disapprovalDate = now()->format('F d, Y \a\t h:i A');
        $projectId = $this->project->project_id ?? 'N/A';
        $yearObligated = $this->project->year_obligated ?? 'N/A';
        $remark = htmlspecialchars($this->remark);
        $currentYear = \Carbon\Carbon::now()->year;

        // Build remark row HTML if present
        $remarkRowHtml = $remark
            ? "<tr>
                <td colspan='2' style='padding:12px 18px;border-top:1px solid #f3f4f6;'>
                    <p style='margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;'>Remarks</p>
                    <p style='margin:0;font-size:13px;color:#111827;line-height:1.6;white-space:pre-wrap;'>{$remark}</p>
                </td>
               </tr>"
            : '';

        $htmlContent = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif;'>
            <div style='max-width:580px;margin:32px auto;'>

                <!-- Header -->
                <div style='padding:28px 36px 24px;'>
                    <h1 style='margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;'>Project Disapproved by Regional Director</h1>
                    <p style='margin:0;font-size:13px;color:#9ca3af;'>Sent {$disapprovalDate}</p>
                </div>

                <!-- Card -->
                <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;'>

                    <!-- Greeting -->
                    <div style='padding:24px 36px;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:14px;color:#6b7280;line-height:1.7;'>
                            Hello,<br><br>
                            Your project has been reviewed by the Regional Director and requires further revision. Please review the remarks below and make the necessary changes.
                        </p>
                    </div>

                    <!-- Status Badge -->
                    <div style='padding:16px 36px;background:#fef2f2;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:13px;color:#dc2626;font-weight:600;'>⚠ Disapproved by Regional Director</p>
                    </div>

                    <!-- Disapproval Details Label -->
                    <table style='width:100%;border-collapse:collapse;border-bottom:1px solid #f3f4f6;'>
                        <tr>
                            <td style='padding:16px 18px;border-right:1px solid #f3f4f6;width:50%;'>
                                <p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;'>Disapproved by</p>
                                <p style='margin:0;font-size:14px;font-weight:600;color:#111827;'>{$disapprovedByName}</p>
                            </td>
                            <td style='padding:16px 18px;width:50%;'>
                                <p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;'>Status</p>
                                <p style='margin:0;font-size:14px;font-weight:600;color:#dc2626;'>Disapproved</p>
                            </td>
                        </tr>
                        {$remarkRowHtml}
                    </table>

                    <!-- Project Details Label -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Project details</p>
                    </div>

                    <!-- Project Details Rows -->
                    <table style='width:100%;border-collapse:collapse;'>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>Project</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;font-weight:500;text-align:right;'>{$projectTitle}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Project ID</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;font-family:monospace;'>{$projectId}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Company</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$companyName}</td>
                        </tr>
                        <tr>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Year obligated</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$yearObligated}</td>
                        </tr>
                    </table>

                </div>

                <!-- Action Required Notice -->
                <div style='background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;margin:0 0 24px;border-radius:6px;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#991b1b;font-weight:600;'>📋 Action Required</p>
                    <p style='margin:0;font-size:12px;color:#991b1b;line-height:1.6;'>
                        Please address the remarks above and resubmit your project for review through the SIMS portal. Status has been reset to Pending for revision.
                    </p>
                </div>

                <!-- CTA Button -->
                <div style='text-align:center;margin:0 0 24px;'>
                    <a href='http://192.168.0.7:8096/'
                       style='display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:11px 28px;border-radius:6px;font-size:13px;font-weight:500;'>
                        View in SIMS Portal
                    </a>
                </div>

                <!-- Closing -->
                <div style='padding:0 36px 24px;'>
                    <p style='margin:0;font-size:13px;color:#6b7280;line-height:1.7;'>
                        For questions regarding the feedback, please contact the Regional Director through the system.<br>
                        <span style='color:#9ca3af;'>— SETUP-RPMU</span>
                    </p>
                </div>

                <!-- Footer with Logos -->
                <div style='padding:24px 36px;border-top:1px solid #e5e7eb;text-align:center;'>
                    <table style='width:100%;border-collapse:collapse;margin:0 auto 16px;'>
                        <tr>
                            <td style='width:50%;text-align:center;padding:0 12px;'>
                                <img src='cid:setup_logo.png' alt='SETUP Logo'
                                    style='height:36px;width:auto;display:inline-block;'>
                            </td>
                            <td style='width:1px;padding:0;background:#e5e7eb;'>&nbsp;</td>
                            <td style='width:50%;text-align:center;padding:0 12px;'>
                                <img src='cid:logo.png' alt='DOST Logo'
                                    style='height:36px;width:auto;display:inline-block;'>
                            </td>
                        </tr>
                    </table>
                    <p style='margin:0 0 4px;font-size:11px;color:#9ca3af;text-align:center;'>
                        SETUP Information Management System (SIMS) · DOST Northern Mindanao
                    </p>
                    <p style='margin:0;font-size:11px;color:#9ca3af;text-align:center;'>
                        © {$currentYear} All rights reserved · Do not reply to this email
                    </p>
                </div>

            </div>
        </body>
        </html>
        ";

        return $this->subject('[DOSTNM-SIMS] Project Disapproved - ' . $projectTitle)
                    ->html($htmlContent);
    }
}