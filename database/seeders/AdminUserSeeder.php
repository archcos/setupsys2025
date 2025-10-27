<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tbl_users')->updateOrInsert(
            ['username' => env('DEFAULT_ADMIN_USERNAME', 'iamsuperadmin')],
            [
                'password' => Hash::make(env('DEFAULT_ADMIN_PASSWORD', 'admin123')),
                'email' => env('DEFAULT_ADMIN_EMAIL', 'admin@example.com'),
                'office_id' => 1,
                'first_name' => 'Admin',
                'middle_name' => null,
                'last_name' => 'User',
                'role' => 'head',
                'status' => 'active',
                'created_at' => now(),
            ]
        );

    }
}
