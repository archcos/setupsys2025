import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
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
    
    if (stageIndex < currentIndex) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (stageIndex === currentIndex) return <Clock className="w-4 h-4 text-blue-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  };

  const totalProjects = Object.values(projectsPerOffice).reduce((sum, count) => sum + count, 0);
  const completedProjects = projectDetails.filter(p => p.progress === 'Completed').length;
  const inProgressProjects = projectDetails.filter(p => p.progress && p.progress !== 'Completed').length;
  const incompleteProjects = projectDetails.filter(p => !p.progress).length;

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Dashboard" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Overview of project status and office performance</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{inProgressProjects}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Incomplete</p>
                    <p className="text-2xl font-bold text-gray-900">{incompleteProjects}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Per Office Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {userOfficeId !== 1
                        ? `PSTO ${userOfficeName} SETUP Projects`
                        : `Projects Per Office`}
                    </h2>
                    <p className="text-sm text-gray-600">Distribution across offices for {selectedYear}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-semibold text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(projectsPerOffice).map(([office, count]) => (
                  <div key={office} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <MapPin className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{office}</h3>
                        <p className="text-sm text-gray-600">{count} project{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {count}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                
                {Object.keys(projectsPerOffice).length === 0 && (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No office data available for {selectedYear}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Progress Status Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Progress Status</h2>
                  <p className="text-sm text-gray-600">Track the current stage of each project</p>
                </div>
              </div>

              <div className="space-y-6">
                {projectDetails.length > 0 ? (
                  projectDetails.map((project) => {
                    const progressConfig = getProgressConfig(project.progress);
                    const currentStageIndex = stages.indexOf(project.progress);

                    return (
                      <div key={project.project_title} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                        {/* Project Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{project.project_title}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {project.company_name}
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-full ${progressConfig.bgColor}`}>
                            <span className={`text-sm font-semibold ${progressConfig.textColor}`}>
                              {project.progress || 'Incomplete Profile'}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                            <div className={`h-3 rounded-full transition-all duration-500 ${progressConfig.width} ${progressConfig.color}`}></div>
                          </div>
                        </div>

                        {/* Stage Indicators */}
                        {project.progress ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {stages.map((stage, index) => {
                              const isCompleted = index < currentStageIndex;
                              const isCurrent = index === currentStageIndex;
                              const isPending = index > currentStageIndex;

                              return (
                                <div
                                  key={stage}
                                  className={`flex flex-col items-center p-3 rounded-lg text-center transition-all duration-200 ${
                                    isCompleted ? 'bg-green-50 border border-green-200' :
                                    isCurrent ? 'bg-blue-50 border border-blue-200' :
                                    'bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <div className="mb-2">
                                    {getStageIcon(stage, project.progress)}
                                  </div>
                                  <span className={`text-xs font-medium ${
                                    isCompleted ? 'text-green-700' :
                                    isCurrent ? 'text-blue-700' :
                                    'text-gray-500'
                                  }`}>
                                    {stage}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="font-medium text-red-700">Incomplete Project Details</p>
                              <p className="text-sm text-red-600">This project needs to complete its profile information</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Target className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Project Data</h3>
                    <p className="text-gray-600">No project progress records found for the selected year.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}