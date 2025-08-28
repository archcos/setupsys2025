import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Head, usePage } from '@inertiajs/react';
import { 
  CheckCircle, 
  Circle, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target,
  FileText,
  Clock,
  Award,
  Sparkles,
  Activity,
  ChevronRight,
  AlertCircle,
  Eye,
  Filter,
  Search,
  X
} from 'lucide-react';

export default function Dashboard() {
  const { projectDetails = [], userCompanyName } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const stages = ['Complete Details', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];

  const openModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const renderStatus = (value) =>
    value ? (
      <CheckCircle className="text-green-500 w-5 h-5" />
    ) : (
      <Circle className="text-gray-400 w-5 h-5" />
    );

  const fmtDate = (date) => {
    return date
      ? <span className="font-medium text-green-700">{`Completed on ${new Date(date).toLocaleDateString()}`}</span>
      : <span className="italic text-gray-500">In Progress</span>;
  };

  // Filter projects based on selected filter and search
  const filteredProjects = projectDetails.filter(project => {
    const matchesSearch = project.project_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'completed') return matchesSearch && project.progress === 'Completed';
    if (selectedFilter === 'in-progress') return matchesSearch && project.progress !== 'Completed';
    if (selectedFilter === 'urgent') {
      // Projects that need attention (implementation stage with missing requirements)
      const impl = project.implementation || {};
      return matchesSearch && project.progress === 'Implementation' && 
             (!impl.tarp_upload || !impl.pdc_upload || !impl.liquidation_upload);
    }
    return matchesSearch;
  });

  const getProjectProgress = (project) => {
    const currentStageIndex = stages.indexOf(project.progress);
    return Math.round((currentStageIndex / (stages.length - 1)) * 100);
  };

  const getProjectStatus = (project) => {
    const impl = project.implementation || {};
    const tags = impl.tags || [];
    const projectCost = parseFloat(project?.project_cost || 0);
    const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
    const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

    if (project.progress === 'Completed') {
      return { status: 'completed', color: 'green', message: 'Project completed' };
    }
    
    if (project.progress === 'Implementation') {
      const missingItems = [];
      if (!impl.tarp_upload) missingItems.push('Tarpaulin');
      if (!impl.pdc_upload) missingItems.push('PDC');
      if (percentage < 50) missingItems.push('First Untagging (50%)');
      if (percentage < 100) missingItems.push('Final Untagging (100%)');
      
      if (missingItems.length > 0) {
        return { 
          status: 'needs-attention', 
          color: 'orange', 
          message: `Missing: ${missingItems.slice(0, 2).join(', ')}${missingItems.length > 2 ? '...' : ''}` 
        };
      }
    }
    
    return { status: 'in-progress', color: 'blue', message: 'In progress' };
  };

  // Calculate stats
  const completedProjects = projectDetails.filter(p => p.progress === 'Completed').length;
  const totalProjects = projectDetails.length;
  const inProgressProjects = totalProjects - completedProjects;
  const needsAttentionProjects = projectDetails.filter(p => {
    const impl = p.implementation || {};
    return p.progress === 'Implementation' && (!impl.tarp_upload || !impl.pdc_upload);
  }).length;

  const filters = [
    { key: 'all', label: 'All Projects', count: totalProjects },
    { key: 'in-progress', label: 'In Progress', count: inProgressProjects },
    { key: 'completed', label: 'Completed', count: completedProjects },
    { key: 'urgent', label: 'Needs Attention', count: needsAttentionProjects }
  ];

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-100 to-blue-400 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Head title="Dashboard" />
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {userCompanyName}
                </h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your projects</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-800" />
                <span className="text-sm ">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{inProgressProjects}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                    <p className="text-2xl font-bold text-gray-900">{needsAttentionProjects}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setSelectedFilter(filter.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFilter === filter.key
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const progress = getProjectProgress(project);
                  const status = getProjectStatus(project);
                  const impl = project.implementation || {};
                  const tags = impl.tags || [];
                  const projectCost = parseFloat(project?.project_cost || 0);
                  const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
                  const taggingProgress = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

                  const statusColors = {
                    completed: 'bg-green-50 border-green-200',
                    'in-progress': 'bg-blue-50 border-blue-200',
                    'needs-attention': 'bg-orange-50 border-orange-200'
                  };

                  const statusTextColors = {
                    completed: 'text-green-700',
                    'in-progress': 'text-blue-700',
                    'needs-attention': 'text-orange-700'
                  };

                  return (
                    <div key={project.project_id || index} 
                         className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${statusColors[status.status] || 'border-gray-200'}`}>
                      
                      {/* Project Header */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusTextColors[status.status]} ${statusColors[status.status]}`}>
                              {status.message}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Progress</div>
                            <div className="text-lg font-bold text-blue-600">{progress}%</div>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                          {project.project_title}
                        </h3>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          Budget: <span className="font-semibold text-blue-600">₱{projectCost.toLocaleString()}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Status Indicators */}
                      <div className="p-6">
                        <div className="space-y-3">
                          {/* Implementation Status */}
                          {project.progress === 'Implementation' && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="text-xs font-medium text-gray-700 mb-2">Implementation Status</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  {impl.tarp_upload ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-xs">Tarpaulin</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {impl.pdc_upload ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-xs">PDC</span>
                                </div>
                              </div>
                              
                              {tags.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600">Equipment Untagging</span>
                                    <span className="text-xs font-medium">{taggingProgress.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                      className="bg-green-500 h-1 rounded-full"
                                      style={{ width: `${Math.min(taggingProgress, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Current Stage */}
                          <div className="text-xs text-gray-600">
                            Current Stage: <span className="font-medium text-gray-900">{project.progress}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4">
                          <button
                            onClick={() => openModal(project)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                <div className="text-center">
                  <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No matching projects found' : 'No projects in this category'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? `No projects match "${searchTerm}" in the ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()} category`
                      : `You don't have any ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()} at the moment`
                    }
                  </p>
                  {(searchTerm || selectedFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Show All Projects
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Project Details Modal */}
 {/* Project Details Modal */}
{isModalOpen && selectedProject && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
      
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{selectedProject.project_title}</h2>
            <p className="text-blue-100 mt-1">Project Details & Progress</p>
          </div>
        </div>
        <button
          onClick={closeModal}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 will-change-transform">
        {(() => {
          const currentStageIndex = stages.indexOf(selectedProject.progress);
          const hasReached = (stage) => currentStageIndex >= stages.indexOf(stage);
          const implementation = selectedProject.implementation || {};
          const tags = implementation.tags || [];
          const projectCost = parseFloat(selectedProject?.project_cost || 0);
          const totalTagged = tags.reduce(
            (sum, tag) => sum + parseFloat(tag.tag_amount || 0),
            0
          );
          const percentage =
            projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

          return (
            <div className="space-y-6">
              {/* Project Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">
                    Project Cost
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    ₱{projectCost.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-sm text-green-600 font-medium">
                    Current Stage
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {selectedProject.progress}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">
                    Progress
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {Math.round(
                      (currentStageIndex / (stages.length - 1)) * 100
                    )}
                    %
                  </div>
                </div>
              </div>

              {/* Stage Details */}
              <div className="space-y-6">
                {[
                  {
                    title: "Complete Details",
                    icon: FileText,
                    color: "blue",
                    items: [
                      {
                        label: "Company Profile",
                        date: selectedProject.company?.created_at
                          ? new Date(
                              selectedProject.company.created_at
                            ).toLocaleDateString()
                          : null,
                        status: Boolean(selectedProject.company?.created_at),
                      },
                      {
                        label: "Project Details",
                        date: selectedProject.last_activity_date,
                        status: hasReached("Complete Details"),
                      },
                    ],
                  },
                  {
                    title: "Draft MOA",
                    icon: FileText,
                    color: "green",
                    items: [
                      {
                        label: "Generated MOA",
                        date: selectedProject.moa?.updated_at,
                        status: hasReached("Draft MOA"),
                      },
                      {
                        label: "Verified MOA",
                        date: selectedProject.moa?.acknowledge_date,
                        status: hasReached("Implementation"),
                      },
                    ],
                  },
                  {
                    title: "Implementation",
                    icon: Target,
                    color: "orange",
                    items: [
                      {
                        label: "Tarpaulin",
                        date: implementation.tarp_upload,
                        status: Boolean(implementation.tarp_upload),
                      },
                      {
                        label: "Post-Dated Check",
                        date: implementation.pdc_upload,
                        status: Boolean(implementation.pdc_upload),
                      },
                      {
                        label: "First Untagging (50%)",
                        date: null,
                        status: percentage >= 50,
                      },
                      {
                        label: "Final Untagging (100%)",
                        date: null,
                        status: percentage >= 100,
                      },
                    ],
                  },
                  {
                    title: "Liquidation",
                    icon: BarChart3,
                    color: "purple",
                    items: [
                      {
                        label: "Liquidation Report",
                        date: implementation.liquidation_upload,
                        status: Boolean(implementation.liquidation_upload),
                      },
                    ],
                  },
                  {
                    title: "Refund",
                    icon: TrendingUp,
                    color: "pink",
                    items: [
                      {
                        label: "Refund Date",
                        date: null,
                        status: hasReached("Refund"),
                      },
                    ],
                  },
                  {
                    title: "Completed",
                    icon: Award,
                    color: "emerald",
                    items: [
                      {
                        label:
                          selectedProject.progress === "Completed"
                            ? "Completed"
                            : "Not Yet Completed",
                        date: null,
                        status:
                          selectedProject.progress === "Completed",
                      },
                    ],
                  },
                ].map((stage, i) => {
                  const IconComponent = stage.icon;
                  const colorClasses = {
                    blue: "bg-blue-100 text-blue-600 border-blue-200",
                    green: "bg-green-100 text-green-600 border-green-200",
                    orange: "bg-orange-100 text-orange-600 border-orange-200",
                    purple: "bg-purple-100 text-purple-600 border-purple-200",
                    pink: "bg-pink-100 text-pink-600 border-pink-200",
                    emerald:
                      "bg-emerald-100 text-emerald-600 border-emerald-200",
                  };

                  return (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div
                        className={`p-4 border-l-4 ${colorClasses[stage.color]}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`p-2 rounded-lg ${colorClasses[stage.color]}`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {stage.title}
                          </h3>
                        </div>
                        <div className="ml-9 space-y-2">
                          {stage.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              {renderStatus(item.status)}
                              <span className="text-sm">
                                {item.label}
                                {item.date !== null && (
                                  <>
                                    {" - "}
                                    {fmtDate(item.date)}
                                  </>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Equipment Untagging Summary */}
                {tags.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-50/30 rounded-xl border border-blue-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Equipment Untagging Progress
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {tags.map((tag, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-white rounded-lg px-4 py-3 border border-blue-100"
                        >
                          <span className="font-medium text-gray-700">
                            {tag.tag_name}
                          </span>
                          <span className="font-bold text-blue-600">
                            ₱{parseFloat(tag.tag_amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Total:{" "}
                          <strong className="text-blue-600">
                            ₱{totalTagged.toLocaleString()}
                          </strong>
                        </span>
                        <span className="text-sm text-gray-600">
                          {percentage.toFixed(1)}% of ₱
                          {selectedProject.project_cost.toLocaleString()}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal Footer */}
      <div className="bg-gray-50 p-6 border-t border-gray-200">
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}