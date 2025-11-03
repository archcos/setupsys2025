import { useState } from 'react';
import { usePage, Head } from '@inertiajs/react';
import {
  BarChart3,
  Building2,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Activity,
  ChevronRight,
  Award,
  MapPin,
  FileCheck,
  X
} from 'lucide-react';

export default function Home() {
  const {
    projectsPerOffice,
    selectedYear,
    availableYears,
    userOfficeId,
    userOfficeName,
    projectDetails = [], // project_title, company_name, office_name, progress
    userRole,
  } = usePage().props;

  const isStaff = userRole === 'staff';
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  const handleYearChange = (e) => {
    window.location.href = `?year=${e.target.value}`;
  };

  const stages = ['Complete Details', 'Review/Approval', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];
  
  const reviewApprovalStages = [
    'internal_rtec',
    'internal_compliance',
    'external_rtec',
    'external_compliance',
    'approval',
    'Approved'
  ];

  const getReviewApprovalLabel = (progress) => {
    const labels = {
      'internal_rtec': 'Internal RTEC',
      'internal_compliance': 'Internal Compliance',
      'external_rtec': 'External RTEC',
      'external_compliance': 'External Compliance',
      'approval': 'Approval',
      'Approved': 'Approved'
    };
    return labels[progress] || progress;
  };

  const isReviewApprovalStage = (progress) => {
    return reviewApprovalStages.includes(progress);
  };

  const getProgressConfig = (progress) => {
    // Handle Review & Approval sub-stages
    if (isReviewApprovalStage(progress)) {
      return { 
        width: 'w-2/6', 
        color: 'bg-gradient-to-r from-indigo-500 to-indigo-600', 
        textColor: 'text-indigo-700', 
        bgColor: 'bg-indigo-50' 
      };
    }

    const stageIndex = stages.indexOf(progress);
    const configs = [
      { width: 'w-1/6', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
      { width: 'w-2/6', color: 'bg-gradient-to-r from-indigo-500 to-indigo-600', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50' },
      { width: 'w-3/6', color: 'bg-gradient-to-r from-orange-500 to-orange-600', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
      { width: 'w-7/12', color: 'bg-gradient-to-r from-purple-500 to-purple-600', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
      { width: 'w-2/3', color: 'bg-gradient-to-r from-blue-500 to-blue-600', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
      { width: 'w-5/6', color: 'bg-gradient-to-r from-teal-500 to-teal-600', textColor: 'text-teal-700', bgColor: 'bg-teal-50' },
      { width: 'w-full', color: 'bg-gradient-to-r from-green-500 to-green-600', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    ];
    
    if (!progress) {
      return { width: 'w-full', color: 'bg-gradient-to-r from-red-500 to-red-600', textColor: 'text-red-700', bgColor: 'bg-red-50' };
    }
    
    return configs[stageIndex] || configs[0];
  };

  const getStageIcon = (stage, currentProgress) => {
    // Handle Review & Approval sub-stages
    if (isReviewApprovalStage(currentProgress)) {
      const stageIndex = stages.indexOf(stage);
      if (stageIndex === 0) return <CheckCircle className="w-3 h-3 text-green-500" />;
      if (stageIndex === 1) return <Clock className="w-3 h-3 text-blue-500" />;
      return <div className="w-3 h-3 rounded-full border border-gray-300" />;
    }

    const currentIndex = stages.indexOf(currentProgress);
    const stageIndex = stages.indexOf(stage);
    
    if (stageIndex < currentIndex) return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (stageIndex === currentIndex) return <Clock className="w-3 h-3 text-blue-500" />;
    return <div className="w-3 h-3 rounded-full border border-gray-300" />;
  };

  const totalProjects = Object.values(projectsPerOffice).reduce((sum, count) => sum + count, 0);
  const completedProjects = projectDetails.filter(p => p.progress === 'Completed').length;
  const inProgressProjects = projectDetails.filter(p => p.progress && p.progress !== 'Completed').length;
  const incompleteProjects = projectDetails.filter(p => !p.progress).length;

  // Get unique offices from projectDetails
  const uniqueOffices = [...new Set(projectDetails.map(p => p.office_name).filter(Boolean))].sort();

  // Filter projects based on selected office and stage
  const filteredProjects = projectDetails.filter(project => {
    const officeMatch = selectedOffice === 'all' || project.office_name === selectedOffice;
    
    let stageMatch = true;
    if (selectedStage !== 'all') {
      if (selectedStage === 'Review/Approval') {
        stageMatch = isReviewApprovalStage(project.progress);
      } else if (selectedStage === 'Incomplete') {
        stageMatch = !project.progress;
      } else {
        stageMatch = project.progress === selectedStage;
      }
    }
    
    return officeMatch && stageMatch;
  });

  const clearFilters = () => {
    setSelectedOffice('all');
    setSelectedStage('all');
  };

  return (
    <main className="flex-1 p-4 overflow-y-auto">
      <Head title="Dashboard" />

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Compact Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isStaff ? `${userOfficeName} Dashboard` : 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-600">
              {isStaff 
                ? `${userOfficeName} project overview and performance`
                : 'Project overview and performance'}
            </p>
          </div>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Projects</p>
                <p className="text-xl font-bold text-gray-900">{totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="text-xl font-bold text-gray-900">{completedProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">In Progress</p>
                <p className="text-xl font-bold text-gray-900">{inProgressProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Incomplete</p>
                <p className="text-xl font-bold text-gray-900">{incompleteProjects}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Projects Per Office Card - Hide for staff users */}
        {!isStaff && (
        <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Projects Per Office</h2>
                <p className="text-xs text-gray-600">Distribution for {selectedYear}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(projectsPerOffice).map(([office, count]) => (
              <div key={office} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-md shadow-sm">
                    <MapPin className="w-3 h-3 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{office}</h3>
                  </div>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                  {count}
                </div>
              </div>
            ))}
            
            {Object.keys(projectsPerOffice).length === 0 && (
              <div className="text-center py-6">
                <div className="p-2 bg-gray-100 rounded-full w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No data for {selectedYear}</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Compact Project Progress Status Card */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-md">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isStaff ? `${userOfficeName} Project Progress` : 'Project Progress Status'}
                </h2>
                <p className="text-xs text-gray-600">Current stage tracking for {selectedYear}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-gray-500" />
              <label className="text-xs font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="pl-2 pr-6 py-1 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filter Projects</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Office Filter - Only show if not staff or if staff has multiple offices in data */}
              {(!isStaff || uniqueOffices.length > 1) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-500" />
                  Filter by Office
                </label>
                <select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm hover:border-gray-400 transition-colors"
                >
                  <option value="all">All Offices ({projectDetails.length})</option>
                  {uniqueOffices.map((office) => {
                    const count = projectDetails.filter(p => p.office_name === office).length;
                    return (
                      <option key={office} value={office}>
                        {office} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
              )}

              {/* Stage Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Target className="w-3 h-3 text-gray-500" />
                  Filter by Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm hover:border-gray-400 transition-colors"
                >
                  <option value="all">All Stages ({projectDetails.length})</option>
                  <option value="Incomplete">
                    Incomplete ({projectDetails.filter(p => !p.progress).length})
                  </option>
                  {stages.map((stage) => {
                    let count;
                    if (stage === 'Review/Approval') {
                      count = projectDetails.filter(p => isReviewApprovalStage(p.progress)).length;
                    } else {
                      count = projectDetails.filter(p => p.progress === stage).length;
                    }
                    return (
                      <option key={stage} value={stage}>
                        {stage} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Active Filters and Clear Button */}
            {(selectedOffice !== 'all' || selectedStage !== 'all') && (
              <div className="mt-3 flex items-center justify-between p-2 bg-white rounded-md border border-blue-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-600">Active filters:</span>
                  {selectedOffice !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      <Building2 className="w-3 h-3" />
                      {selectedOffice}
                    </span>
                  )}
                  {selectedStage !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      <Target className="w-3 h-3" />
                      {selectedStage}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          {(selectedOffice !== 'all' || selectedStage !== 'all') && (
            <div className="mb-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Showing <span className="font-bold">{filteredProjects.length}</span> of <span className="font-bold">{projectDetails.length}</span> projects
              </p>
            </div>
          )}

          <div className="space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const progressConfig = getProgressConfig(project.progress);
                const isInReviewApproval = isReviewApprovalStage(project.progress);
                const currentStageIndex = isInReviewApproval ? 1 : stages.indexOf(project.progress);

                return (
                  <div key={project.project_title} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    {/* Compact Project Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base">{project.project_title}</h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {project.company_name}
                          {project.office_name && !isStaff && (
                            <>
                              <span className="mx-1 text-gray-400">•</span>
                              <MapPin className="w-3 h-3" />
                              {project.office_name}
                            </>
                          )}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${progressConfig.bgColor}`}>
                        <span className={`text-xs font-medium ${progressConfig.textColor}`}>
                          {isInReviewApproval ? `R&A: ${getReviewApprovalLabel(project.progress)}` : (project.progress || 'Incomplete Profile')}
                        </span>
                      </div>
                    </div>

                    {/* Compact Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-500 ${progressConfig.width} ${progressConfig.color}`}></div>
                      </div>
                    </div>

                    {/* Compact Stage Indicators */}
                    {project.progress ? (
                      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                        {stages.map((stage, index) => {
                          const isCompleted = index < currentStageIndex;
                          const isCurrent = index === currentStageIndex;

                          return (
                            <div
                              key={stage}
                              className={`flex flex-col items-center p-2 rounded-md text-center transition-all duration-200 ${
                                isCompleted ? 'bg-green-50 border border-green-200' :
                                isCurrent ? 'bg-blue-50 border border-blue-200' :
                                'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="mb-1">
                                {getStageIcon(stage, project.progress)}
                              </div>
                              <span className={`text-xs font-medium ${
                                isCompleted ? 'text-green-700' :
                                isCurrent ? 'text-blue-700' :
                                'text-gray-500'
                              }`}>
                                {stage.split(' ').slice(0, 2).join(' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="font-medium text-red-700 text-sm">Incomplete Details</p>
                          <p className="text-xs text-red-600">Profile needs completion</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Projects Found</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {selectedOffice !== 'all' || selectedStage !== 'all' 
                    ? 'No projects match the selected filters' 
                    : `No records found for ${selectedYear}`}
                </p>
                {(selectedOffice !== 'all' || selectedStage !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}