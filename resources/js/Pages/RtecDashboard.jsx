import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { 
  ClipboardList, 
  FileCheck, 
  Users, 
  CheckCircle, 
  ThumbsUp,
  Calendar,
  Video,
  Building2,
  User,
  X,
  Filter,
  Stamp,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Save,
  XCircle,
  Loader2
} from 'lucide-react';

export default function Dashboard({ statusCounts, allowedStatuses, projects, currentFilter, userRole, auth, selectedProjectData, remarksData }) {
  const [selectedFilter, setSelectedFilter] = useState(currentFilter || null);
  const [selectedProject, setSelectedProject] = useState(selectedProjectData || null);
  const [remarks, setRemarks] = useState(remarksData || []);
  const [newRemark, setNewRemark] = useState('');
  const [editingRemark, setEditingRemark] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Update remarks when data changes from Inertia
  useEffect(() => {
    if (remarksData) {
      setRemarks(remarksData);
    }
  }, [remarksData]);

  // Update selected project when data changes
  useEffect(() => {
    if (selectedProjectData) {
      setSelectedProject(selectedProjectData);
      setShowModal(true);
    }
  }, [selectedProjectData]);

  // Card configuration
  const cardConfig = {
    internal_rtec: {
      label: 'Internal RTEC',
      color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      icon: ClipboardList,
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    internal_compliance: {
      label: 'Internal Compliance',
      color: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      icon: FileCheck,
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    external_rtec: {
      label: 'External RTEC',
      color: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      icon: Users,
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    external_compliance: {
      label: 'External Compliance',
      color: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      icon: CheckCircle,
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    approval: {
      label: 'Approval',
      color: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
      icon: Stamp,
      badge: 'bg-teal-100 text-teal-700 border-teal-200',
    },
    Approved: {
      label: 'Approved',
      color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      icon: ThumbsUp,
      badge: 'bg-green-100 text-green-700 border-green-200',
    },
  };

  const handleCardClick = (status) => {
    const newFilter = selectedFilter === status ? null : status;
    setSelectedFilter(newFilter);
    
    router.get(route('rtec.dashboard'), 
      newFilter ? { status: newFilter } : {},
      { preserveState: false, preserveScroll: true }
    );
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    router.get(route('rtec.dashboard'), {}, { preserveState: false, preserveScroll: true });
  };

  const formatLabel = (text) => {
    return text.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const openRemarksModal = (project) => {
    router.get(route('rtec.dashboard'), {
      status: currentFilter,
      project_id: project.project_id,
      progress: project.progress
    }, {
      preserveState: true,
      preserveScroll: true
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
    setRemarks([]);
    setNewRemark('');
    setEditingRemark(null);
    setEditMessage('');
    
    router.get(route('rtec.dashboard'), 
      currentFilter ? { status: currentFilter } : {},
      { preserveState: false, preserveScroll: true }
    );
  };

  const handleAddRemark = () => {
    if (!newRemark.trim()) return;

    router.post(route('rtec.remarks.store', selectedProject.project_id), {
      message: newRemark,
      subject: selectedProject.progress,
      progress: selectedProject.progress
    }, {
      preserveState: true,
      preserveScroll: true,
      data: {
        status: currentFilter,
        project_id: selectedProject.project_id,
        progress: selectedProject.progress
      },
      onSuccess: () => {
        setNewRemark('');
      }
    });
  };

  const handleToggleStatus = (remarkId) => {
    router.post(route('rtec.remarks.toggle', remarkId), {
      progress: selectedProject.progress
    }, {
      preserveState: true,
      preserveScroll: true,
      data: {
        status: currentFilter,
        project_id: selectedProject.project_id,
        progress: selectedProject.progress
      }
    });
  };

  const startEditing = (remark) => {
    setEditingRemark(remark.message_id);
    setEditMessage(remark.message);
  };

  const cancelEditing = () => {
    setEditingRemark(null);
    setEditMessage('');
  };

  const handleUpdateRemark = (remarkId) => {
    if (!editMessage.trim()) return;

    router.put(route('rtec.remarks.update', remarkId), {
      message: editMessage
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        setEditingRemark(null);
        setEditMessage('');
      }
    });
  };

  const handleDeleteRemark = (remarkId) => {
    if (!confirm('Are you sure you want to delete this remark?')) return;

    router.delete(route('rtec.remarks.delete', remarkId), {
      preserveState: true,
      preserveScroll: true
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
            <h1 className="text-4xl font-bold text-gray-900">
              RTEC Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-base ml-4">
            {userRole === 'irtec' 
              ? 'Internal RTEC Management' 
              : userRole === 'ertec' 
              ? 'External RTEC Management' 
              : 'RTEC Management'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          {allowedStatuses.map((status) => {
            const config = cardConfig[status];
            if (!config) return null;
            
            const Icon = config.icon;
            const isSelected = selectedFilter === status;
            
            return (
              <button
                key={status}
                onClick={() => handleCardClick(status)}
                className={`relative group bg-white text-gray-900 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${config.badge}`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{statusCounts[status] || 0}</div>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700">{config.label}</p>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedFilter && (
          <div className="mb-8 flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-200/50 backdrop-blur-sm">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Active Filter:</span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-bold shadow-md">
              {formatLabel(selectedFilter)}
              <button
                onClick={clearFilter}
                className="hover:bg-white/20 rounded-full p-1 transition-all duration-200"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ClipboardList className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Projects
                </h2>
                <p className="text-sm text-gray-600">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'} in view
                </p>
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-6 shadow-inner">
                <ClipboardList className="w-10 h-10 text-gray-400" strokeWidth={2} />
              </div>
              <p className="text-gray-700 text-xl font-semibold mb-2">No projects found</p>
              <p className="text-gray-500 text-base">Projects will appear here once assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50">
              {projects.map((project) => {
                const badge = cardConfig[project.progress]?.badge || 'bg-gray-100 text-gray-700 border-gray-200';
                
                return (
                  <div
                    key={project.rtec_id}
                    onClick={() => openRemarksModal(project)}
                    className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-4">
                          <h3 className="text-xl font-bold text-gray-900 flex-1 leading-tight">
                            {project.project_title}
                          </h3>
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border-2 shadow-sm ${badge}`}>
                            {formatLabel(project.progress)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Company</div>
                              <div className="font-bold text-gray-900 truncate">{project.company_name}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                              <User className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Assigned to</div>
                              <div className="font-bold text-gray-900 truncate">{project.assigned_user}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                              <Calendar className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Schedule</div>
                              <div className="font-bold text-gray-900 truncate">{project.schedule}</div>
                            </div>
                          </div>
                        </div>

                        {project.zoom_link && (
                          <div className="mt-4 flex items-center gap-3 bg-blue-50/70 rounded-xl p-4 border border-blue-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                              <Video className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            
                            <a href={project.zoom_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-blue-700 hover:text-blue-900 font-bold hover:underline transition-all duration-200 flex items-center gap-2 group"
                            >
                              Join Zoom Meeting 
                              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="lg:ml-6 flex-shrink-0 text-right bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl px-5 py-4 lg:min-w-[160px] border border-gray-200/50 shadow-sm">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Added on</p>
                        <p className="text-base font-bold text-gray-900">
                          {project.created_at}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Project Remarks</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedProject.project_title}</p>
                    <p className="text-xs text-blue-600 font-semibold mt-1">
                      Status: {formatLabel(selectedProject.progress)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {remarks.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No remarks yet</p>
                  <p className="text-gray-400 text-sm mt-1">Be the first to add a remark for this status</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {remarks.map((remark) => {
                    const isOwner = auth.user.user_id === remark.created_by;
                    const isEditing = editingRemark === remark.message_id;

                    return (
                      <div
                        key={remark.message_id}
                        className={`border rounded-xl p-4 transition-all ${
                          remark.status === 'done' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={remark.status === 'done'}
                            onChange={() => handleToggleStatus(remark.message_id)}
                            disabled={!isOwner}
                            className={`mt-1 w-5 h-5 rounded border-2 ${
                              isOwner 
                                ? 'cursor-pointer text-blue-600 focus:ring-blue-500' 
                                : 'cursor-not-allowed opacity-50'
                            }`}
                          />

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editMessage}
                                  onChange={(e) => setEditMessage(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows="3"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateRemark(remark.message_id)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-1"
                                  >
                                    <Save className="w-4 h-4" />
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 flex items-center gap-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={`text-gray-800 ${remark.status === 'done' ? 'line-through' : ''}`}>
                                  {remark.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <span className="font-semibold">{remark.user?.name || 'Unknown'}</span>
                                  <span>•</span>
                                  <span>{new Date(remark.created_at).toLocaleString()}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {isOwner && !isEditing && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditing(remark)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteRemark(remark.message_id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddRemark();
                    }
                  }}
                  placeholder="Add a new remark..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddRemark}
                  disabled={!newRemark.trim()}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}