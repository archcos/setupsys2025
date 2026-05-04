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
        $projectTitle  = $this->applyRestruct->project?->project_title ?? 'N/A';
        $companyName   = $this->applyRestruct->project?->company->company_name ?? 'N/A';
        $projectId     = $this->applyRestruct->project_id;
        $updatedBy     = $this->applyRestruct->addedBy?->name ?? 'Unknown User';
        $updatedDate   = $this->applyRestruct->updated_at->format('F d, Y \a\t h:i A');
        $submittedDate = $this->applyRestruct->created_at->format('F d, Y \a\t h:i A');
        $currentYear   = \Carbon\Carbon::now()->year;

        // Attach logos
        $this->attach(resource_path('assets/SETUP_logo.png'), [
            'as'   => 'setup_logo.png',
            'mime' => 'image/png',
        ]);

        $this->attach(resource_path('assets/logo.png'), [
            'as'   => 'logo.png',
            'mime' => 'image/png',
        ]);

        // Build document rows
        $documents = [
            'Proponent Letter' => $this->applyRestruct->proponent ?? null,
            'PSTO Letter'      => $this->applyRestruct->psto      ?? null,
            'Annex C'          => $this->applyRestruct->annexc    ?? null,
            'Annex D'          => $this->applyRestruct->annexd    ?? null,
        ];

        $docRowsHtml = '';
        foreach ($documents as $label => $url) {
            $linkHtml = $url
                ? "<a href='{$url}' target='_blank'
                      style='font-size:13px;color:#111827;font-weight:500;text-decoration:underline;'>
                      View →
                   </a>"
                : "<span style='font-size:13px;color:#9ca3af;'>Not provided</span>";

            $docRowsHtml .= "
                <tr style='border-bottom:1px solid #f9fafb;'>
                    <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:40%;'>{$label}</td>
                    <td style='padding:12px 18px;text-align:right;'>{$linkHtml}</td>
                </tr>";
        }

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
                    <h1 style='margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;'>Project Restructure Application Updated</h1>
                    <p style='margin:0;font-size:13px;color:#9ca3af;'>Last updated {$updatedDate}</p>
                </div>

                <!-- Card -->
                <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 24px;'>

                    <!-- Greeting -->
                    <div style='padding:24px 36px;border-bottom:1px solid #f3f4f6;'>
                        <p style='margin:0;font-size:14px;color:#6b7280;line-height:1.7;'>
                            Hello, a project restructure application has been updated by
                            <strong style='color:#111827;font-weight:600;'>{$updatedBy}</strong>
                            and requires your review.
                        </p>
                    </div>

                    <!-- Update Details -->
                    <table style='width:100%;border-collapse:collapse;border-bottom:1px solid #f3f4f6;'>
                        <tr>
                            <td style='padding:16px 18px;border-right:1px solid #f3f4f6;width:33%;'>
                                <p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;'>Updated by</p>
                                <p style='margin:0;font-size:14px;font-weight:600;color:#111827;'>{$updatedBy}</p>
                            </td>
                            <td style='padding:16px 18px;border-right:1px solid #f3f4f6;width:33%;'>
                                <p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;'>Last updated</p>
                                <p style='margin:0;font-size:14px;font-weight:600;color:#111827;'>{$updatedDate}</p>
                            </td>
                            <td style='padding:16px 18px;width:33%;'>
                                <p style='margin:0 0 5px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;'>Originally submitted</p>
                                <p style='margin:0;font-size:14px;font-weight:600;color:#111827;'>{$submittedDate}</p>
                            </td>
                        </tr>
                    </table>

                    <!-- Project Details Label -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Project details</p>
                    </div>

                    <!-- Project Details Rows -->
                    <table style='width:100%;border-collapse:collapse;border-bottom:1px solid #f3f4f6;'>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;width:35%;'>Project</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;font-weight:500;text-align:right;'>{$projectTitle}</td>
                        </tr>
                        <tr style='border-bottom:1px solid #f9fafb;'>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Company</td>
                            <td style='padding:12px 18px;font-size:13px;color:#111827;text-align:right;'>{$companyName}</td>
                        </tr>
                        <tr>
                            <td style='padding:12px 18px;font-size:13px;color:#9ca3af;'>Project ID</td>
                            <td style='padding:12px 18px;font-size:13px;font-family:monospace;color:#111827;text-align:right;'>{$projectId}</td>
                        </tr>
                    </table>

                    <!-- Attached Documents Label -->
                    <div style='background:#fafafa;border-bottom:1px solid #f3f4f6;padding:12px 18px;'>
                        <p style='margin:0;font-size:12px;color:#9ca3af;font-weight:500;'>Updated documents</p>
                    </div>

                    <!-- Document Rows -->
                    <table style='width:100%;border-collapse:collapse;'>
                        {$docRowsHtml}
                    </table>

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
                        Please review the updated application at your earliest convenience.<br>
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

        return $this->subject('[DOSTNM-SIMS] Updated Project Restructure Application — ' . $projectTitle)
                    ->html($htmlContent);
    }
}