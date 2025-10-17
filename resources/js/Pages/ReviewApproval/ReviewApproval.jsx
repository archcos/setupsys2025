import { Link, router, Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Search,
  X,
  Building2,
  Calendar,
  Package,
  PhilippinePeso,
  UserCheck2,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  Plus,
  Trash2,
  User,
  ClipboardMinus
} from 'lucide-react';

function FlashMessage({ type = 'success', message, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
  const icon = type === 'error' ? <XCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />;

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 border-l-4 rounded-lg shadow-lg px-4 py-3 ${bgColor}`}>
      {icon}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-3 text-gray-600 hover:text-gray-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function formatMonthYear(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toLocaleString('default', { month: 'short', year: 'numeric' });
}

export default function ReviewApproval({ projects, filters, currentStage, availableUsers }) {
  const [search, setSearch] = useState(filters.search || '');
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [selectedProject, setSelectedProject] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, project: null, action: null });

  const { auth, flash } = usePage().props;

  const stageConfig = {
    internal_rtec: {
      title: 'Internal RTEC Review',
      description: 'Projects with complete details ready for internal review',
      color: 'indigo'
    },
    internal_compliance: {
      title: 'Internal Compliance',
      description: 'Projects approved by Internal RTEC',
      color: 'purple'
    },
    external_rtec: {
      title: 'External RTEC Review',
      description: 'Projects ready for external review',
      color: 'red'
    },
    external_compliance: {
      title: 'External Compliance',
      description: 'Projects approved by External RTEC',
      color: 'orange'
    },
    approval: {
      title: 'Final Approval',
      description: 'Projects ready for final approval',
      color: 'green'
    }
  };

  const currentConfig = stageConfig[currentStage] || stageConfig.internal_rtec;

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/review-approval', { 
        search, 
        stage: currentStage 
      }, { 
        preserveState: true, 
        replace: true 
      });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/review-approval', {
      search,
      perPage: newPerPage,
      stage: currentStage,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleStageChange = (newStage) => {
    router.get('/review-approval', {
      search,
      perPage,
      stage: newStage,
    }, {
      preserveScroll: true,
    });
  };

  const openActionModal = (project, action) => {
    setActionModal({ isOpen: true, project, action });
  };

  const closeActionModal = () => {
    setActionModal({ isOpen: false, project: null, action: null });
  };

  const handleSubmitAction = (remarks) => {
    console.log('Submitting remarks:', remarks);
    
    router.post(`/projects/${actionModal.project.project_id}/update-progress`, {
      action: actionModal.action,
      remarks: remarks,
      stage: currentStage,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        closeActionModal();
      },
      onError: (errors) => {
        console.error('Submission errors:', errors);
      },
    });
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      {(flash?.success || flash?.error) && (
        <FlashMessage
          type={flash?.error ? 'error' : 'success'}
          message={flash?.error || flash?.success}
          onClose={() => router.visit(window.location.pathname, { preserveState: true, preserveScroll: true })}
        />
      )}

      <Head title={currentConfig.title} />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className={`bg-${currentConfig.color}-50 p-6 border-b border-${currentConfig.color}-100`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${currentConfig.color}-100 rounded-lg`}>
                  <UserCheck2 className={`w-5 h-5 text-${currentConfig.color}-600`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentConfig.title}</h2>
                  <p className="text-sm text-gray-600">{currentConfig.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                <select
                  value={currentStage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                >
                  <option value="internal_rtec">Internal RTEC Review</option>
                  <option value="internal_compliance">Internal Compliance</option>
                  <option value="external_rtec">External RTEC Review</option>
                  <option value="external_compliance">External Compliance</option>
                  <option value="approval">Final Approval</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by company name or project title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-500 shadow-sm">
                <select
                  value={perPage}
                  onChange={handlePerPageChange}
                  className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Project Details
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timeline
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <PhilippinePeso className="w-4 h-4" />
                      Cost
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Items
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.data.map((project) => {
                  const phaseOneInitial = formatMonthYear(project.release_initial);
                  const phaseOneEnd = formatMonthYear(project.release_end);
                  const phaseTwoInitial = formatMonthYear(project.refund_initial);
                  const phaseTwoEnd = formatMonthYear(project.refund_end);

                  return (
                    <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{project.project_title}</div>
                            <div className="text-xs text-gray-500">
                              {project.company?.company_name || 'No company assigned'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          <div className="mb-1">
                            <span className="font-medium">Phase 1:</span> {phaseOneInitial} - {phaseOneEnd}
                          </div>
                          <div>
                            <span className="font-medium">Phase 2:</span> {phaseTwoInitial} - {phaseTwoEnd}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          ₱{project.project_cost}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {project.items ? project.items.length : 0} items
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openActionModal(project, 'approve')}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openActionModal(project, 'disapprove')}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Disapprove"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {projects.data.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserCheck2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                    <p className="text-gray-500 text-sm">There are no projects at this stage</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {projects.links && projects.links.length > 1 && (
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {projects.from || 1} to {projects.to || projects.data.length} of {projects.total || projects.data.length} results
                </div>
                <div className="flex gap-1">
                  {projects.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                        link.active
                          ? 'bg-blue-500 text-white border-transparent shadow-md'
                          : link.url
                          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {actionModal.isOpen && (
        <ActionModal
          project={actionModal.project}
          action={actionModal.action}
          onClose={closeActionModal}
          onSubmit={handleSubmitAction}
          availableUsers={availableUsers}
        />
      )}
    </main>
  );
}

function ProjectModal({ project, isOpen, onClose }) {
  const [messageStatuses, setMessageStatuses] = useState({});

  useEffect(() => {
    if (project?.messages) {
      const initialStatuses = {};
      project.messages.forEach(msg => {
        initialStatuses[msg.message_id] = msg.status;
      });
      setMessageStatuses(initialStatuses);
    }
  }, [project]);

  const toggleMessageStatus = (messageId) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: prev[messageId] === 'done' ? 'todo' : 'done'
    }));

    router.post(`/messages/${messageId}/toggle-status`, {}, { 
      preserveScroll: true,
      preserveState: true,
      only: ['projects', 'flash'],
      onError: () => {
        setMessageStatuses(prev => ({
          ...prev,
          [messageId]: prev[messageId] === 'done' ? 'todo' : 'done'
        }));
      }
    });
  };

  if (!isOpen) return null;

  const phaseOneInitial = formatMonthYear(project.release_initial);
  const phaseOneEnd = formatMonthYear(project.release_end);
  const phaseTwoInitial = formatMonthYear(project.refund_initial);
  const phaseTwoEnd = formatMonthYear(project.refund_end);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-500 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Project Details</h3>
                <p className="text-blue-100 text-sm">Complete project information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">For Compliance</h4>
                </div>

                {project.messages && project.messages.length > 0 ? (
                  <div className="space-y-3">
                    {project.messages.map((msg) => {
                      const currentStatus = messageStatuses[msg.message_id] || msg.status;
                      return (
                        <div
                          key={msg.message_id}
                          className="bg-white rounded-lg p-4 border border-yellow-100"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={currentStatus === 'done'}
                              onChange={() => toggleMessageStatus(msg.message_id)}
                              className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{msg.message}</p>
                              <p className="text-xs text-gray-500">
                                {msg.user?.name || 'Unknown User'} • {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No approval remarks yet</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Project Information</h4>
                </div>

                
                
                <div className="space-y-4">

                  <div className="flex items-start gap-3">
                    <ClipboardMinus className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Project Title</p>
                      <p className="text-gray-900">{project.project_title || 'No project assigned'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Company</p>
                      <p className="text-gray-900">{project.company?.company_name || 'No company assigned'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <PhilippinePeso className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Project Cost</p>
                      <p className="text-gray-900 font-semibold">₱{project.project_cost}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phase One Timeline</p>
                      <p className="text-gray-900">{phaseOneInitial} - {phaseOneEnd}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phase Two Timeline</p>
                      <p className="text-gray-900">{phaseTwoInitial} - {phaseTwoEnd}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Project Items</h4>
                </div>
                
                {project.items && project.items.length > 0 ? (
                  <div className="space-y-3">
                    {project.items.map((item) => (
                      <div key={item.item_id} className="bg-white rounded-lg p-4 border border-green-100">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{item.item_name}</h5>
                          <Package className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="font-medium text-gray-900">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cost</p>
                            <p className="font-medium text-green-600">₱{item.item_cost}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No items assigned</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionModal({ project, action, onClose, onSubmit, availableUsers }) {
  const isApprove = action === 'approve';
  
  const [remarks, setRemarks] = useState([
    { message: '', created_by: '' }
  ]);

  const addRemark = () => {
    setRemarks([...remarks, { message: '', created_by: '' }]);
  };

  const removeRemark = (index) => {
    if (remarks.length > 1) {
      setRemarks(remarks.filter((_, i) => i !== index));
    }
  };

  const updateRemark = (index, field, value) => {
    const newRemarks = [...remarks];
    newRemarks[index][field] = value;
    setRemarks(newRemarks);
  };

  const handleSubmit = () => {
    const hasEmptyMessage = remarks.some(r => !r.message.trim());
    const hasEmptyUser = remarks.some(r => !r.created_by);

    if (hasEmptyMessage || hasEmptyUser) {
      alert('Please fill in all remarks and select users');
      return;
    }

    onSubmit(remarks);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className={`${isApprove ? 'bg-green-500' : 'bg-red-500'} p-6 rounded-t-2xl text-white sticky top-0 z-10`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {isApprove ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <XCircle className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {isApprove ? 'Approve Project' : 'Disapprove Project'}
              </h3>
              <p className="text-sm opacity-90">{project.project_title}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Remarks</h4>
              <button
                onClick={addRemark}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Remark
              </button>
            </div>

            <div className="space-y-4">
              {remarks.map((remark, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        Remark #{index + 1}
                      </span>
                    </div>
                    {remarks.length > 1 && (
                      <button
                        onClick={() => removeRemark(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Remove remark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned To <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          value={remark.created_by}
                          onChange={(e) => updateRemark(index, 'created_by', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          <option value="">Select user...</option>
                          {availableUsers.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                              {user.first_name} {user.middle_name} {user.last_name} ({user.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={remark.message}
                        onChange={(e) => updateRemark(index, 'message', e.target.value)}
                        placeholder="Enter compliance remark..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Each remark will be assigned to the selected user for compliance tracking
            </p>
          </div>

          {project.remarks && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-700">Previous Remarks</p>
              </div>
              <p className="text-sm text-gray-600">{project.remarks}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 sticky bottom-0">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 text-white rounded-lg transition-all duration-200 font-medium ${
                isApprove
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isApprove ? 'Approve Project' : 'Disapprove Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}