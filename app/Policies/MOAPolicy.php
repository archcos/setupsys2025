<?php

namespace App\Policies;

use App\Models\MoaModel;
use App\Models\UserModel;

class MOAPolicy
{
    public function viewAny(UserModel $user): bool
    {
        return in_array($user->role, ['rpmo', 'staff']);
    }

    public function view(UserModel $user, MoaModel $moa): bool
    {
        if ($user->role === 'rpmo') {
            return true;
        }

        if ($user->role === 'staff') {
            return $user->office_id === $moa->project->company->office_id;
        }

        return false;
    }

    public function generate(UserModel $user, MoaModel $moa): bool
    {
        if (in_array($user->role, ['rpmo'])) {
            return true;
        }

        if ($user->role === 'staff') {
            return $moa->project->company->office_id === $user->office_id;
        }

        return false;
    }

    public function viewApprovedFile(UserModel $user, MoaModel $moa): bool
    {
        if ($user->role === 'rpmo') {
            return true;
        }

        if ($user->role === 'staff') {
            return $user->office_id === $moa->project->company->office_id;
        }

        // Allow users to view if the proponent was added by them
        if ($user->role === 'user') {
            return $moa->project->proponent->added_by === $user->user_id;
        }

        return false;
    }

    public function uploadApprovedFile(UserModel $user, MoaModel $moa): bool
    {
        if (!in_array($user->role, ['staff', 'rpmo'])) {
            return false;
        }

        if ($user->role === 'rpmo') {
            return true;
        }

        return $user->office_id === $moa->project->company->office_id;
    }

    public function downloadApprovedFile(UserModel $user, MoaModel $moa): bool
    {
        if ($user->role === 'rpmo') {
            return true;
        }

        if ($user->role === 'staff') {
            return $user->office_id === $moa->project->company->office_id;
        }

        // Allow users to download if the proponent was added by them
        if ($user->role === 'user') {
            return $moa->project->proponent->added_by === $user->user_id;
        }

        return false;
    }

    public function deleteApprovedFile(UserModel $user, MoaModel $moa): bool
    {
        if ($user->role === 'staff') {
            return $user->office_id === $moa->project->company->office_id;
        }

        return false;
    }
}