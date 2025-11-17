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
  const [selectedProjectId, setSelectedProjectId] = useState(null);
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

  const handleApprove = (projectId) => {
    setIsApprovingProjectId(projectId);
    router.post(route('rd-dashboard.update-status', projectId), {
      status: 'Approved'
    }, {
      preserveScroll: true,
      onFinish: () => {
        setIsApprovingProjectId(null);
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

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="RD Dashboard" />

      <div className="max-w-7xl mx-auto">
        {/* Flash Messages */}
        {flash?.success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            {flash.error}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RD Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and approve completed project checklists</p>
        </div>

        {/* Stats Cards with Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Pending */}
          <button
            onClick={() => setActiveFilter('pending')}
            className={`bg-white rounded-lg shadow-sm border-2 p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'pending' 
                ? 'border-amber-500 ring-2 ring-amber-200' 
                : 'border-gray-100 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <Clock className={`w-5 h-5 ${activeFilter === 'pending' ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            {activeFilter === 'pending' && (
              <p className="text-xs text-amber-600 mt-2 font-medium">● Active Filter</p>
            )}
          </button>

          {/* Approved */}
          <button
            onClick={() => setActiveFilter('approved')}
            className={`bg-white rounded-lg shadow-sm border-2 p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'approved' 
                ? 'border-green-500 ring-2 ring-green-200' 
                : 'border-gray-100 hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <CheckCircle className={`w-5 h-5 ${activeFilter === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            {activeFilter === 'approved' && (
              <p className="text-xs text-green-600 mt-2 font-medium">● Active Filter</p>
            )}
          </button>

          {/* Disapproved */}
          <button
            onClick={() => setActiveFilter('disapproved')}
            className={`bg-white rounded-lg shadow-sm border-2 p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'disapproved' 
                ? 'border-red-500 ring-2 ring-red-200' 
                : 'border-gray-100 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Disapproved</p>
              <XCircle className={`w-5 h-5 ${activeFilter === 'disapproved' ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.disapproved}</p>
            {activeFilter === 'disapproved' && (
              <p className="text-xs text-red-600 mt-2 font-medium">● Active Filter</p>
            )}
          </button>

          {/* Total */}
          <button
            onClick={() => setActiveFilter('total')}
            className={`bg-white rounded-lg shadow-sm border-2 p-4 text-left transition-all hover:shadow-md ${
              activeFilter === 'total' 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-100 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <List className={`w-5 h-5 ${activeFilter === 'total' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            {activeFilter === 'total' && (
              <p className="text-xs text-blue-600 mt-2 font-medium">● Active Filter</p>
            )}
          </button>
        </div>

        {/* Filter Info */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
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
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedProject(expandedProject === project.project_id ? null : project.project_id)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{project.project_title}</h3>
                      <p className="text-sm text-gray-500">{project.company?.company_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.progress)}`}>
                        {getStatusIcon(project.progress)}
                        {project.progress || 'Pending'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedProject === project.project_id ? 'rotate-180' : ''}`}
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
                    <div className="px-4 py-6 bg-gradient-to-r from-gray-50/50 to-white border-t border-gray-100">
                      {/* Links Section */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Checklist Links (4/4)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[1, 2, 3, 4].map((i) => {
                            const linkKey = `link_${i}`;
                            const link = project.checklist[linkKey];
                            return (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                              >
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <span className="text-xs font-semibold text-blue-600">{i}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-600">Link {i}</p>
                                  <p className="text-sm text-blue-600 truncate group-hover:underline">{link}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleApprove(project.project_id)}
                          disabled={project.progress === 'Approved' || isApprovingProjectId === project.project_id}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            project.progress === 'Approved' || isApprovingProjectId === project.project_id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg'
                          }`}
                        >
                          {isApprovingProjectId === project.project_id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => openDisapprovalModal(project.project_id)}
                          disabled={project.progress === 'Disapproved'}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            project.progress === 'Disapproved'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          Disapprove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {activeFilter === 'total' ? 'No completed projects' : `No ${activeFilter} projects`}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {activeFilter === 'total' 
                      ? 'Projects with all 4 checklist links will appear here'
                      : `No projects match the ${activeFilter} filter`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

              <div className="flex gap-3">
                <button
                  onClick={closeDisapprovalModal}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisapprovalSubmit}
                  disabled={isSubmittingDisapproval || !disapprovalRemark.trim() || disapprovalRemark.trim().length < 5}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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