import { useState } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
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
  ChevronRight,
  AlertCircle,
  Eye,
  Search,
  X,
  FileCheck,
  PhilippinePeso
} from 'lucide-react';

export default function Dashboard() {
  const { projectDetails = [], userCompanyName } = usePage().props;
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stages = ['Complete Details', 'Review & Approval', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];
  
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

  const filteredProjects = projectDetails.filter(project => {
    const matchesSearch = project.project_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'completed') return matchesSearch && project.progress === 'Completed';
    if (selectedFilter === 'in-progress') return matchesSearch && project.progress !== 'Completed';
    if (selectedFilter === 'urgent') {
      const impl = project.implementation || {};
      return matchesSearch && project.progress === 'Implementation' && 
             (!impl.tarp_upload || !impl.pdc_upload || !impl.liquidation_upload);
    }
    return matchesSearch;
  });

  const getProjectProgress = (project) => {
    let currentStageIndex;
    if (isReviewApprovalStage(project.progress)) {
      currentStageIndex = 1; // Review & Approval is index 1
    } else {
      currentStageIndex = stages.indexOf(project.progress);
    }
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
    
    if (isReviewApprovalStage(project.progress)) {
      return { 
        status: 'in-review', 
        color: 'indigo', 
        message: `R&A: ${getReviewApprovalLabel(project.progress)}` 
      };
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
    <main className="flex-1 flex flex-col overflow-hidden ">
      <Head title="Dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your projects</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-800" />
          <span className="text-sm">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Projects */}
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

        {/* In Progress */}
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

        {/* Completed */}
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

        {/* Needs Attention */}
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

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
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
                    'in-review': 'bg-indigo-50 border-indigo-200',
                    'needs-attention': 'bg-orange-50 border-orange-200'
                  };

                  const statusTextColors = {
                    completed: 'text-green-700',
                    'in-progress': 'text-blue-700',
                    'in-review': 'text-indigo-700',
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
                          {/* Review & Approval Status */}
                          {isReviewApprovalStage(project.progress) && (
                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                              <div className="flex items-center gap-2 mb-2">
                                <FileCheck className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-medium text-indigo-700">Review & Approval Stage</span>
                              </div>
                              <p className="text-sm text-indigo-600 font-medium">
                                {getReviewApprovalLabel(project.progress)}
                              </p>
                            </div>
                          )}

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
                            Current Stage: <span className="font-medium text-gray-900">
                              {isReviewApprovalStage(project.progress) ? 'Review & Approval' : project.progress}
                            </span>
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



{/* Project Details Modal */}
{isModalOpen && selectedProject && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{selectedProject.project_title}</h2>
            <p className="text-blue-50 text-sm opacity-90">Project Timeline & Status</p>
          </div>
        </div>
        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {(() => {
          const isInReview = isReviewApprovalStage(selectedProject.progress);
          const currentStageIndex = isInReview ? 1 : stages.indexOf(selectedProject.progress);
          const hasReached = (stage) => {
            const stageIdx = stages.indexOf(stage);
            if (isInReview && stageIdx === 1) return true;
            return currentStageIndex >= stageIdx;
          };
          const implementation = selectedProject.implementation || {};
          const tags = implementation.tags || [];
          const projectCost = parseFloat(selectedProject?.project_cost || 0);
          const totalTagged = tags.reduce((sum, t) => sum + parseFloat(t.tag_amount || 0), 0);
          const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;
          const progressPercent = Math.round((currentStageIndex / (stages.length - 1)) * 100);

          return (
            <div className="space-y-5">
              {/* Overview Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <PhilippinePeso className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-wide">Project Cost</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">₱{projectCost.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <Target className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-wide">Current Stage</p>
                  </div>
                  <p className="text-lg font-bold text-green-700 leading-tight">{isInReview ? 'Review & Approval' : selectedProject.progress}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-wide">Progress</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-purple-700">{progressPercent}%</p>
                    <div className="flex-1 h-2 bg-purple-200 rounded-full overflow-hidden mb-1">
                      <div className="bg-purple-600 h-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                {/* Complete Details */}
                <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Complete Details</h3>
                  </div>
                  <div className="ml-11 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(Boolean(selectedProject.company?.created_at))}
                        <span className="text-gray-700">Company Profile</span>
                      </div>
                      {selectedProject.company?.created_at && <span className="text-xs text-gray-500">{fmtDate(selectedProject.company.created_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(hasReached("Complete Details"))}
                        <span className="text-gray-700">Project Details</span>
                      </div>
                      {selectedProject.last_activity_date && <span className="text-xs text-gray-500">{fmtDate(selectedProject.last_activity_date)}</span>}
                    </div>
                  </div>
                </div>

                {/* Review & Approval */}
                <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <FileCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Review & Approval</h3>
                  </div>
                  <div className="ml-11">
                    {isInReview ? (
                      <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-700">{getReviewApprovalLabel(selectedProject.progress)}</span>
                      </div>
                    ) : hasReached("Review & Approval") ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Circle className="w-5 h-5" />
                        <span>Pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Draft MOA */}
                <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-green-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Draft MOA</h3>
                  </div>
                  <div className="ml-11 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(hasReached("Draft MOA"))}
                        <span className="text-gray-700">Generated MOA</span>
                      </div>
                      {selectedProject.moa?.updated_at && <span className="text-xs text-gray-500">{fmtDate(selectedProject.moa.updated_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(hasReached("Implementation"))}
                        <span className="text-gray-700">Verified MOA</span>
                      </div>
                      {selectedProject.moa?.acknowledge_date && <span className="text-xs text-gray-500">{fmtDate(selectedProject.moa.acknowledge_date)}</span>}
                    </div>
                  </div>
                </div>

                {/* Implementation */}
                <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-orange-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Target className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Implementation</h3>
                  </div>
                  <div className="ml-11 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(Boolean(implementation.tarp_upload))}
                        <span className="text-gray-700">Signboard</span>
                      </div>
                      {implementation.tarp_upload && <span className="text-xs text-gray-500">{fmtDate(implementation.tarp_upload)}</span>}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(Boolean(implementation.pdc_upload))}
                        <span className="text-gray-700">Post-Dated Check</span>
                      </div>
                      {implementation.pdc_upload && <span className="text-xs text-gray-500">{fmtDate(implementation.pdc_upload)}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {renderStatus(percentage >= 50)}
                      <span className="text-gray-700">First Untagging (50%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {renderStatus(percentage >= 100)}
                      <span className="text-gray-700">Final Untagging (100%)</span>
                    </div>
                  </div>
                </div>

                {/* Liquidation */}
                <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-purple-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Liquidation</h3>
                  </div>
                  <div className="ml-11">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(Boolean(implementation.liquidation_upload))}
                        <span className="text-gray-700">Liquidation Report</span>
                      </div>
                      {implementation.liquidation_upload && <span className="text-xs text-gray-500">{fmtDate(implementation.liquidation_upload)}</span>}
                    </div>
                  </div>
                </div>

                {/* Refund */}
                <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-pink-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-pink-100">
                      <TrendingUp className="w-4 h-4 text-pink-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Refund</h3>
                  </div>
                  <div className="ml-11 space-y-2">
                    {selectedProject.refund?.initial && selectedProject.refund?.end ? (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <Calendar className="w-3 h-3" />
                        <span><span className="font-semibold">{selectedProject.refund.initial_formatted}</span> to <span className="font-semibold">{selectedProject.refund.end_formatted}</span></span>
                      </div>
                    ) : (
                      <p className="text-xs italic text-gray-400">No refund schedule set</p>
                    )}

                    {selectedProject.refund?.completed ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        <span>All refunds paid</span>
                      </div>
                    ) : selectedProject.refund?.currentMonthOngoing ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          <span>Current month ongoing</span>
                        </div>
                        <Link href={`/my-refunds?project=${selectedProject.project_id}`} className="text-blue-600 text-xs font-medium hover:underline">
                          View All →
                        </Link>
                      </div>
                    ) : (
                      <Link href={`/my-refunds?project=${selectedProject.project_id}`} className="text-blue-600 text-xs font-medium hover:underline">
                        View Refunds →
                      </Link>
                    )}

                    {selectedProject.refund?.refunds?.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto bg-gray-50 rounded-lg p-2 space-y-1">
                        {selectedProject.refund.refunds.map((r, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">{r.month_paid}</span>
                            <span className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed */}
                <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <Award className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">Completed</h3>
                  </div>
                  <div className="ml-11">
                    <div className="flex items-center gap-2 text-sm">
                      {renderStatus(selectedProject.progress === "Completed")}
                      <span className="text-gray-700">{selectedProject.progress === "Completed" ? "Project Completed" : "Not Yet Completed"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Untagging */}
              {tags.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-800">Equipment Untagging</h4>
                  </div>
                  <div className="space-y-1.5">
                    {tags.map((tag, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-white/60 px-3 py-2 rounded-lg">
                        <span className="text-gray-700">{tag.tag_name}</span>
                        <span className="font-bold text-blue-600">₱{parseFloat(tag.tag_amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-700">Total Tagged: <span className="font-bold text-blue-600">₱{totalTagged.toLocaleString()}</span></span>
                      <span className="text-xs text-gray-600">{percentage.toFixed(1)}% of ₱{projectCost.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all" style={{ width: `${Math.min(percentage, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t flex justify-end">
        <button onClick={closeModal} className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm">
          Close
        </button>
      </div>
    </div>
  </div>
)}
          </main>
  );
}