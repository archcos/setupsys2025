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
  MapPin
} from 'lucide-react';

export default function Home() {
  const {
    projectsPerOffice,
    selectedYear,
    availableYears,
    userOfficeId,
    userOfficeName,
    projectDetails = [], // project_title, office_name, progress
  } = usePage().props;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleYearChange = (e) => {
    window.location.href = `?year=${e.target.value}`;
  };

  const stages = ['Complete Details', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];

  const getProgressConfig = (progress) => {
    const stageIndex = stages.indexOf(progress);
    const configs = [
      { width: 'w-1/6', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
      { width: 'w-2/6', color: 'bg-gradient-to-r from-orange-500 to-orange-600', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Project overview and performance</p>
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

            {/* Compact Projects Per Office Card */}
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {userOfficeId !== 1
                        ? `PSTO ${userOfficeName} Projects`
                        : `Projects Per Office`}
                    </h2>
                    <p className="text-xs text-gray-600">Distribution for {selectedYear}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <label className="text-xs font-medium text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="pl-2 pr-6 py-1 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
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
                        <p className="text-xs text-gray-600">{count} project{count !== 1 ? 's' : ''}</p>
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

            {/* Compact Project Progress Status Card */}
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Project Progress Status</h2>
                  <p className="text-xs text-gray-600">Current stage tracking</p>
                </div>
              </div>

              <div className="space-y-4">
                {projectDetails.length > 0 ? (
                  projectDetails.map((project) => {
                    const progressConfig = getProgressConfig(project.progress);
                    const currentStageIndex = stages.indexOf(project.progress);

                    return (
                      <div key={project.project_title} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        {/* Compact Project Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">{project.project_title}</h3>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {project.company_name}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full ${progressConfig.bgColor}`}>
                            <span className={`text-xs font-medium ${progressConfig.textColor}`}>
                              {project.progress || 'Incomplete Profile'}
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
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
                      <Target className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No Project Data</h3>
                    <p className="text-sm text-gray-600">No records found for {selectedYear}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
  );
}