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
    projectDetails = [],
    userRole,
  } = usePage().props;

  const isStaff = userRole === 'staff';
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

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

  const uniqueOffices = [...new Set(projectDetails.map(p => p.office_name).filter(Boolean))].sort();

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
    setFilterOpen(false);
  };

  return (
    <main className="flex-1 p-3 md:p-4 overflow-y-auto">
      <Head title="Dashboard" />

      <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
              {isStaff ? `${userOfficeName}` : 'Dashboard'}
            </h1>
            <p className="text-xs md:text-sm text-gray-600 truncate">
              {isStaff ? 'Project overview' : 'Overview & performance'}
            </p>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-4">
          <StatCard 
            icon={<Briefcase className="w-3 h-3 md:w-4 md:h-4" />}
            label="Total"
            value={totalProjects}
            color="blue"
          />
          <StatCard 
            icon={<CheckCircle className="w-3 h-3 md:w-4 md:h-4" />}
            label="Completed"
            value={completedProjects}
            color="green"
          />
          <StatCard 
            icon={<Activity className="w-3 h-3 md:w-4 md:h-4" />}
            label="In Progress"
            value={inProgressProjects}
            color="purple"
          />
          <StatCard 
            icon={<AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />}
            label="Incomplete"
            value={incompleteProjects}
            color="red"
          />
        </div>

        {/* Projects Per Office - Hide for staff */}
        {!isStaff && (
          <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="p-1 md:p-1.5 bg-blue-100 rounded-md">
                <Building2 className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">Projects Per Office</h2>
                <p className="text-xs text-gray-600">Distribution for {selectedYear}</p>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(projectsPerOffice).map(([office, count]) => (
                <div key={office} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
                    <h3 className="font-medium text-gray-900 text-xs md:text-sm truncate">{office}</h3>
                  </div>
                  <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex-shrink-0">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Progress Status Card */}
        <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border border-gray-100">
          {/* Header with Year Selector */}
          <div className="flex flex-col gap-2 md:gap-0 md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1 md:p-1.5 bg-purple-100 rounded-md">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {isStaff ? 'Project Progress' : 'Progress Status'}
                </h2>
                <p className="text-xs text-gray-600">Stage tracking for {selectedYear}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="pl-2 pr-6 py-1 text-xs md:text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="md:hidden w-full mb-3 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">Filters</span>
            </div>
            {(selectedOffice !== 'all' || selectedStage !== 'all') && (
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                {(selectedOffice !== 'all' ? 1 : 0) + (selectedStage !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Filter Section - Responsive */}
          <div className={`mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 shadow-sm ${filterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filter Projects</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(!isStaff || uniqueOffices.length > 1) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    Office
                  </label>
                  <select
                    value={selectedOffice}
                    onChange={(e) => setSelectedOffice(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All ({projectDetails.length})</option>
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Target className="w-3 h-3 text-gray-500" />
                  Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="all">All ({projectDetails.length})</option>
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

            {/* Active Filters - Mobile Optimized */}
            {(selectedOffice !== 'all' || selectedStage !== 'all') && (
              <div className="mt-3 flex items-center justify-between p-2 bg-white rounded-md border border-blue-200 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-600">Active:</span>
                  {selectedOffice !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      <Building2 className="w-3 h-3" />
                      <span className="hidden sm:inline">{selectedOffice}</span>
                      <span className="sm:hidden">Office</span>
                    </span>
                  )}
                  {selectedStage !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      <Target className="w-3 h-3" />
                      <span className="hidden sm:inline">{selectedStage}</span>
                      <span className="sm:hidden">Stage</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          {(selectedOffice !== 'all' || selectedStage !== 'all') && (
            <div className="mb-3 px-3 md:px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs md:text-sm text-blue-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span><span className="font-bold">{filteredProjects.length}</span> of <span className="font-bold">{projectDetails.length}</span></span>
              </p>
            </div>
          )}

          {/* Projects List */}
          <div className="space-y-3 md:space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const progressConfig = getProgressConfig(project.progress);
                const isInReviewApproval = isReviewApprovalStage(project.progress);
                const currentStageIndex = isInReviewApproval ? 1 : stages.indexOf(project.progress);

                return (
                  <div key={project.project_title} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                    {/* Project Header */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">{project.project_title}</h3>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1 flex-wrap">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{project.company_name}</span>
                        {project.office_name && !isStaff && (
                          <>
                            <span className="text-gray-400">•</span>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{project.office_name}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`mb-3 inline-block px-2 md:px-3 py-1 rounded-full ${progressConfig.bgColor}`}>
                      <span className={`text-xs font-medium ${progressConfig.textColor}`}>
                        {isInReviewApproval ? `R&A: ${getReviewApprovalLabel(project.progress)}` : (project.progress || 'Incomplete')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-500 ${progressConfig.width} ${progressConfig.color}`}></div>
                      </div>
                    </div>

                    {/* Stage Indicators - Scrollable on Mobile */}
                    {project.progress ? (
                      <div className="overflow-x-auto">
                        <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-max md:min-w-0">
                          {stages.map((stage, index) => {
                            const isCompleted = index < currentStageIndex;
                            const isCurrent = index === currentStageIndex;

                            return (
                              <div
                                key={stage}
                                className={`flex flex-col items-center p-1.5 md:p-2 rounded-md text-center ${
                                  isCompleted ? 'bg-green-50 border border-green-200' :
                                  isCurrent ? 'bg-blue-50 border border-blue-200' :
                                  'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <div className="mb-0.5">
                                  {getStageIcon(stage, project.progress)}
                                </div>
                                <span className={`text-xs font-medium ${
                                  isCompleted ? 'text-green-700' :
                                  isCurrent ? 'text-blue-700' :
                                  'text-gray-500'
                                }`}>
                                  {stage.split(' ').slice(0, 1).join(' ')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-red-700 text-xs md:text-sm">Incomplete Details</p>
                          <p className="text-xs text-red-600">Profile needs completion</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 md:py-8">
                <div className="p-2 md:p-3 bg-gray-100 rounded-full w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 flex items-center justify-center">
                  <Filter className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">No Projects Found</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3">
                  {selectedOffice !== 'all' || selectedStage !== 'all' 
                    ? 'No projects match the filters' 
                    : `No records for ${selectedYear}`}
                </p>
                {(selectedOffice !== 'all' || selectedStage !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                    Clear
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

// Stat Card Component
function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4 border border-gray-100">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 md:p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}