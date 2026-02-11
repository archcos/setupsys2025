import React, { useState, useMemo } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  Check,
  AlertCircle,
  List,
  X,
  AlertTriangle
} from 'lucide-react';

export default function RDDashboardIndex({ projects, stats }) {
  const { flash } = usePage().props;
  const [expandedProject, setExpandedProject] = useState(null);
  const [activeFilter, setActiveFilter] = useState('total');
  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [showApprovalConfirmModal, setShowApprovalConfirmModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState('');
  const [disapprovalRemark, setDisapprovalRemark] = useState('');
  const [isSubmittingDisapproval, setIsSubmittingDisapproval] = useState(false);
  const [isApprovingProjectId, setIsApprovingProjectId] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Disapproved':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'Disapproved':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'total') {
      return projects;
    } else if (activeFilter === 'pending') {
      return projects.filter(p => !p.progress || (p.progress !== 'Approved' && p.progress !== 'Disapproved'));
    } else if (activeFilter === 'approved') {
      return projects.filter(p => p.progress === 'Approved');
    } else if (activeFilter === 'disapproved') {
      return projects.filter(p => p.progress === 'Disapproved');
    }
    return projects;
  }, [projects, activeFilter]);

  const openApprovalConfirmModal = (projectId, projectTitle) => {
    setSelectedProjectId(projectId);
    setSelectedProjectTitle(projectTitle);
    setShowApprovalConfirmModal(true);
  };

  const closeApprovalConfirmModal = () => {
    setShowApprovalConfirmModal(false);
    setSelectedProjectId(null);
    setSelectedProjectTitle('');
  };

  const confirmApprove = () => {
    setIsApprovingProjectId(selectedProjectId);
    router.post(route('rd-dashboard.update-status', selectedProjectId), {
      status: 'Approved'
    }, {
      preserveScroll: true,
      onFinish: () => {
        setIsApprovingProjectId(null);
        closeApprovalConfirmModal();
      }
    });
  };

  const openDisapprovalModal = (projectId) => {
    setSelectedProjectId(projectId);
    setDisapprovalRemark('');
    setShowDisapprovalModal(true);
  };

  const closeDisapprovalModal = () => {
    setShowDisapprovalModal(false);
    setSelectedProjectId(null);
    setDisapprovalRemark('');
    setIsSubmittingDisapproval(false);
  };

  const handleDisapprovalSubmit = () => {
    if (!disapprovalRemark.trim()) {
      alert('Please provide a remark for disapproval');
      return;
    }

    if (disapprovalRemark.trim().length < 5) {
      alert('Remark must be at least 5 characters');
      return;
    }

    setIsSubmittingDisapproval(true);
    router.post(route('rd-dashboard.update-status', selectedProjectId), {
      status: 'Disapproved',
      remark: disapprovalRemark
    }, {
      preserveScroll: true,
      onFinish: () => {
        setIsSubmittingDisapproval(false);
        closeDisapprovalModal();
      }
    });
  };

  // Document config for displaying pp_link and fs_link
  const documentConfig = [
    { key: 'pp_link', label: 'Project Proposal' },
    { key: 'fs_link', label: 'Financial Statement' }
  ];

  return (
    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
      <Head title="Regional Director's Dashboard" />

      <div className="max-w-7xl mx-auto">
        {/* Flash Messages */}
        {flash?.success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm md:text-base">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{flash.success}</span>
          </div>
        )}
        {flash?.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm md:text-base">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{flash.error}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Regional Director's Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">Review and approve completed project compliance</p>
        </div>

        {/* Stats Cards with Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
          {/* Pending */}
          <button
            onClick={() => setActiveFilter('pending')}
            className={`bg-white rounded-lg shadow-sm border-2 p-3 md:p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'pending' 
                ? 'border-amber-500 ring-2 ring-amber-200' 
                : 'border-gray-100 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600">Pending</p>
              <Clock className={`w-4 h-4 md:w-5 md:h-5 ${activeFilter === 'pending' ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-amber-600">{stats.pending}</p>
            {activeFilter === 'pending' && (
              <p className="text-xs text-amber-600 mt-2 font-medium">● Active</p>
            )}
          </button>

          {/* Approved */}
          <button
            onClick={() => setActiveFilter('approved')}
            className={`bg-white rounded-lg shadow-sm border-2 p-3 md:p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'approved' 
                ? 'border-green-500 ring-2 ring-green-200' 
                : 'border-gray-100 hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600">Approved</p>
              <CheckCircle className={`w-4 h-4 md:w-5 md:h-5 ${activeFilter === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.approved}</p>
            {activeFilter === 'approved' && (
              <p className="text-xs text-green-600 mt-2 font-medium">● Active</p>
            )}
          </button>

          {/* Disapproved */}
          <button
            onClick={() => setActiveFilter('disapproved')}
            className={`bg-white rounded-lg shadow-sm border-2 p-3 md:p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'disapproved' 
                ? 'border-red-500 ring-2 ring-red-200' 
                : 'border-gray-100 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600">Disapproved</p>
              <XCircle className={`w-4 h-4 md:w-5 md:h-5 ${activeFilter === 'disapproved' ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.disapproved}</p>
            {activeFilter === 'disapproved' && (
              <p className="text-xs text-red-600 mt-2 font-medium">● Active</p>
            )}
          </button>

          {/* Total */}
          <button
            onClick={() => setActiveFilter('total')}
            className={`bg-white rounded-lg shadow-sm border-2 p-3 md:p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'total' 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-100 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm font-medium text-gray-600">Total</p>
              <List className={`w-4 h-4 md:w-5 md:h-5 ${activeFilter === 'total' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</p>
            {activeFilter === 'total' && (
              <p className="text-xs text-blue-600 mt-2 font-medium">● Active</p>
            )}
          </button>
        </div>

        {/* Filter Info */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-xs md:text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
            {activeFilter !== 'total' && (
              <span className="ml-1">
                ({activeFilter === 'pending' ? 'Pending' : activeFilter === 'approved' ? 'Approved' : 'Disapproved'})
              </span>
            )}
          </p>
          {activeFilter !== 'total' && (
            <button
              onClick={() => setActiveFilter('total')}
              className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium text-left"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {filteredProjects.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredProjects.map((project) => (
                <div key={project.project_id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Main Row */}
                  <div
                    className="p-3 md:p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedProject(expandedProject === project.project_id ? null : project.project_id)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs md:text-sm text-gray-900 mb-1 line-clamp-2">{project.project_title}</h3>
                      <p className="text-xs text-gray-500 truncate">{project.company?.company_name}</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(project.progress)}`}>
                        {getStatusIcon(project.progress)}
                        <span className="hidden sm:inline">{project.progress || 'Pending'}</span>
                        <span className="sm:hidden">{(project.progress || 'Pending').substring(0, 3)}</span>
                      </span>
                      <svg
                        className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedProject === project.project_id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedProject === project.project_id && (
                    <div className="px-3 md:px-4 py-4 md:py-6 bg-gradient-to-r from-gray-50/50 to-white border-t border-gray-100">
                      {/* Links Section */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                          Compliance Documents (2/2)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                          {documentConfig.map(({ key, label }) => {
                            const link = project.compliance[key];
                            const displayLink = link ? (link.length > 40 ? link.substring(0, 40) + '...' : link) : '';
                            return (
                              <a
                                key={key}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={link}
                                className="group flex items-center gap-2 p-2 md:p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                              >
                                <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <span className="text-xs font-semibold text-blue-600">📄</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-600">{label}</p>
                                  <p className="text-xs text-blue-600 line-clamp-1 group-hover:underline">{displayLink}</p>
                                </div>
                                <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => openApprovalConfirmModal(project.project_id, project.project_title)}
                          disabled={project.progress === 'Approved' || isApprovingProjectId === project.project_id}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all ${
                            project.progress === 'Approved' || isApprovingProjectId === project.project_id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg'
                          }`}
                        >
                          {isApprovingProjectId === project.project_id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="hidden sm:inline">Saving...</span>
                              <span className="sm:hidden">Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => openDisapprovalModal(project.project_id)}
                          disabled={project.progress === 'Disapproved'}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all ${
                            project.progress === 'Disapproved'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Disapprove</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 px-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">
                    {activeFilter === 'total' ? 'No completed projects' : `No ${activeFilter} projects`}
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm">
                    {activeFilter === 'total' 
                      ? 'Projects with all 2 compliance documents will appear here'
                      : `No projects match the ${activeFilter} filter`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Approval</h3>
              <button
                onClick={closeApprovalConfirmModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Are you sure you want to approve this project?</span>
                </p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Project Name</p>
                <p className="text-sm font-semibold text-gray-900 break-words">{selectedProjectTitle}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeApprovalConfirmModal}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={isApprovingProjectId !== null}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
                    isApprovingProjectId !== null
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isApprovingProjectId !== null ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Approving...
                    </span>
                  ) : (
                    'Yes, Approve'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disapproval Modal */}
      {showDisapprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Disapprove Project</h3>
              <button
                onClick={closeDisapprovalModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Please provide a detailed remark explaining why this project is being disapproved.</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={disapprovalRemark}
                  onChange={(e) => setDisapprovalRemark(e.target.value)}
                  placeholder="Enter your remarks for disapproval (minimum 5 characters)..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition-all duration-200 resize-none text-sm"
                  rows="4"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {disapprovalRemark.length}/500 characters
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeDisapprovalModal}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm md:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisapprovalSubmit}
                  disabled={isSubmittingDisapproval || !disapprovalRemark.trim() || disapprovalRemark.trim().length < 5}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base order-1 sm:order-2 ${
                    isSubmittingDisapproval || !disapprovalRemark.trim() || disapprovalRemark.trim().length < 5
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isSubmittingDisapproval ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Confirm Disapproval'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}