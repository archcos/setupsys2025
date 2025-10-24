<?php

namespace App\Policies;

use App\Models\MOAModel;
use App\Models\UserModel;

class MOAPolicy
{
    public function viewAny(UserModel $user): bool
    {
        return in_array($user->role, ['rpmo', 'staff']);
    }

    public function view(UserModel $user, MOAModel $moa): bool
    {
        // RPMO can view all MOAs
        if ($user->role === 'rpmo') {
            return true;
        }

        // Staff can view MOAs from their office
        if ($user->role === 'staff') {
            return $user->office_id === $moa->project->company->office_id;
        }

        return false;
    }

    public function generate(UserModel $user, MOAModel $moa)
        {
            // RPMO and Head can access all MOAs
            if (in_array($user->role, ['rpmo', 'head'])) {
                return true;
            }
            
            // Staff can only access MOAs from their office
            if ($user->role === 'staff') {
                return $moa->project->company->office_id === $user->office_id;
            }
            
            return false;
        }

    public function uploadApprovedFile(UserModel $user, MOAModel $moa): bool
    {
        // Only staff can upload approved MOA files
        if ($user->role !== 'staff') {
            return false;
        }

        // Staff can only upload for their office
        return $user->office_id === $moa->project->company->office_id;
    }

    public function downloadApprovedFile(UserModel $user, MOAModel $moa): bool
    {
        // RPMO can download all approved files
        if ($user->role === 'rpmo') {
            return true;
        }

        // Staff can download from their office
        if ($user->role === 'staff') {
            return $user->office_id === $moa->project->company->office_id;
        }

        return false;
    }

    public function deleteApprovedFile(UserModel $user, MOAModel $moa): bool
    {
        // Only staff can delete approved files from their office
        if ($user->role === 'staff') {
            return $user->office_id === $moa->project->company->office_id;
        }

        return false;
    }
}