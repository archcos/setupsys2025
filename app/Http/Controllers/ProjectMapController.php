<?php

namespace App\Http\Controllers;

use App\Models\OfficeModel;
use App\Models\ProjectModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectMapController extends Controller
{
    public function index(){
        $offices = OfficeModel::select('office_id', 'office_name')->get();

        $years = ProjectModel::selectRaw('DISTINCT year_obligated')
            ->whereNotNull('year_obligated')
            ->orderBy('year_obligated', 'desc')
            ->pluck('year_obligated');

        $progressList = ProjectModel::selectRaw('DISTINCT progress')
            ->whereNotNull('progress')
            ->orderBy('progress')
            ->pluck('progress');

        return Inertia::render('Projects/Map', [
            'offices'      => $offices,
            'years'        => $years,
            'progressList' => $progressList,
        ]);
    }

    public function mapData(Request $request)
    {
        $projects = ProjectModel::with(['proponent.office'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->when($request->filled('office_id'), fn($q) =>
                $q->whereHas('proponent', fn($q2) =>
                    $q2->where('office_id', $request->office_id)
                )
            )
            ->when($request->filled('year_obligated'), fn($q) =>
                $q->where('year_obligated', $request->year_obligated)
            )
            ->when($request->filled('progress'), function ($q) use ($request) {
                [$min, $max] = match ($request->progress) {
                    'early'    => [0, 29],
                    'progress' => [30, 59],
                    'ontrack'  => [60, 99],
                    'done'     => [100, 100],
                    default    => [0, 100],
                };
                $q->whereBetween('progress', [$min, $max]);
            })
            ->get()
            ->map(fn($p) => [
                'project_id'     => $p->project_id,
                'project_title'  => $p->project_title,
                'latitude'       => (float) $p->latitude,
                'longitude'      => (float) $p->longitude,
                'progress'       => $p->progress,
                'year_obligated' => $p->year_obligated,
                'project_cost'   => $p->project_cost,
                'fund_release'   => $p->fund_release,
                'office_id'      => $p->proponent?->office_id,
                'office_name'    => $p->proponent?->office?->office_name,
                'proponent_name' => $p->proponent?->company_name,
            ]);

        return response()->json($projects);
    }
}