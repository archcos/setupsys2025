<?php

namespace App\Policies;

use App\Models\ReportModel;
use App\Models\UserModel;
use Illuminate\Auth\Access\Response;

class ReportPolicy
{
    public function viewAny(UserModel $userModel): bool
    {
        return in_array($userModel->role, ['head', 'rpmo', 'staff', 'user']);
    }

    public function view(UserModel $user, ReportModel $report)
    {
        // Head and RPMO can view all reports
        if (in_array($user->role, ['head', 'rpmo'])) {
            return true;
        }

        $project = $report->project;
        $company = $project->company;

        // Staff can view reports from their office
        if ($user->role === 'staff') {
            return $user->office_id === $company->office_id;
        }

        // Users can view their own company's reports
        if ($user->role === 'user') {
            return $company->added_by === $user->user_id;
        }

        return false;
    }

    public function create(UserModel $userModel): bool
    {
        return in_array($userModel->role, ['head', 'rpmo', 'staff', 'user']);
    }

    public function delete(UserModel $user, ReportModel $report): bool
    {
        // Only head and rpmo can delete
        if (in_array($user->role, ['head', 'rpmo'])) {
            return true;
        }

        // Staff can delete from their office
        if ($user->role === 'staff') {
            return $user->office_id === $report->project->company->office_id;
        }

        return false;
    }

    public function update(UserModel $userModel, ReportModel $reportModel): bool
    {
        return false;
    }

    public function restore(UserModel $userModel, ReportModel $reportModel): bool
    {
        return false;
    }

    public function forceDelete(UserModel $userModel, ReportModel $reportModel): bool
    {
        return false;
    }
}