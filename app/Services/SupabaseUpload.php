<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SupabaseUpload
{
    private $projectUrl;
    private $apiKey;
    private $bucket;
    
    public function __construct()
    {
        $this->projectUrl = env('SUPABASE_PROJECT_URL');
        $this->apiKey = env('SUPABASE_STORAGE_KEY');
        $this->bucket = env('SUPABASE_BUCKET_NAME');
    }
    
    /**
     * Upload file to Supabase
     */
    public function upload($filePath, $fileContent)
    {
        try {
            $url = "{$this->projectUrl}/storage/v1/object/{$this->bucket}/{$filePath}";
            
            // Send as binary data, not JSON
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/octet-stream',
            ])->withBody($fileContent, 'application/octet-stream')->post($url);
            
            if ($response->successful()) {
                Log::info('✓ Uploaded to Supabase', [
                    'path' => $filePath,
                    'size' => strlen($fileContent),
                ]);
                return true;
            }
            
            Log::error('✗ Supabase upload failed', [
                'path' => $filePath,
                'status' => $response->status(),
                'error' => $response->body(),
            ]);
            return false;
            
        } catch (\Exception $e) {
            Log::error('Supabase upload error', [
                'path' => $filePath,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}