import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';

export default function ApplyRestructIndex({ applyRestructs, projects }) {
  const { props } = usePage();
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  
  const { data, setData, post, put, reset, errors, processing } = useForm({
    project_id: '',
    proponent: '',
    psto: '',
    annexc: '',
    annexd: '',
  });

  const validateDriveLink = (url) => {
    if (!url) return false;
    const googleDriveRegex = /^https:\/\/(drive|docs)\.google\.com\/.+/;
    const oneDriveRegex = /^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/;
    return googleDriveRegex.test(url) || oneDriveRegex.test(url);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        label: 'Pending'
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        label: 'Approved'
      },
      raised: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        label: 'Raised to RD'
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const handleSubmit = () => {
    setValidationErrors({});
    
    const newErrors = {};
    
    if (!data.project_id) {
      newErrors.project_id = 'Project is required';
    }

    ['proponent', 'psto', 'annexc', 'annexd'].forEach(field => {
      if (!data[field]) {
        newErrors[field] = 'This field is required';
      } else if (!validateDriveLink(data[field])) {
        newErrors[field] = 'Must be a valid Google Drive or OneDrive link';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setIsSending(true);

    if (editingItem) {
      put(route('apply_restruct.update', editingItem.apply_id), {
        onSuccess: () => {
          reset();
          setShowForm(false);
          setEditingItem(null);
          setValidationErrors({});
          setIsSending(false);
        },
        onError: (errors) => {
          console.error('Update error:', errors);
          setIsSending(false);
        },
      });
    } else {
      post(route('apply_restruct.store'), {
        onSuccess: () => {
          reset();
          setShowForm(false);
          setValidationErrors({});
          setIsSending(false);
        },
        onError: (errors) => {
          console.error('Store error:', errors);
          setIsSending(false);
        },
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setData({
      project_id: item.project_id,
      proponent: item.proponent || '',
      psto: item.psto || '',
      annexc: item.annexc || '',
      annexd: item.annexd || '',
    });
    setShowForm(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      router.delete(route('apply_restruct.destroy', itemToDelete.apply_id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        },
      });
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleCloseForm = () => {
    if (!isSending && !processing) {
      setShowForm(false);
      setEditingItem(null);
      reset();
      setValidationErrors({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Apply for Restructuring" />

      <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-8">
        {/* Success/Error Alert */}
        {props.flash?.success && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-xs md:text-sm font-medium text-green-800">{props.flash.success}</p>
          </div>
        )}

        {props.flash?.error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs md:text-sm font-medium text-red-800">{props.flash.error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col gap-3 md:gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Apply Restructuring
              </h1>
              <p className="text-xs md:text-base text-slate-600 mt-1">Manage project restructuring applications</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                reset();
                setValidationErrors({});
              }}
              disabled={isSending}
              className="inline-flex items-center justify-center px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm md:text-base rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Add New
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applyRestructs.length ? (
                  applyRestructs.map((item, index) => (
                    <tr key={item.apply_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{item.project?.project_title || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status || 'pending')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.proponent && (
                            <a href={item.proponent} target="_blank" rel="noreferrer"
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                              <ExternalLink className="w-3 h-3 mr-0.5" />
                              Proponent
                            </a>
                          )}
                          {item.psto && (
                            <a href={item.psto} target="_blank" rel="noreferrer"
                              className="inline-flex items-center text-xs text-green-600 hover:text-green-700 font-medium hover:underline">
                              <ExternalLink className="w-3 h-3 mr-0.5" />
                              PSTO
                            </a>
                          )}
                          {item.annexc && (
                            <a href={item.annexc} target="_blank" rel="noreferrer"
                              className="inline-flex items-center text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline">
                              <ExternalLink className="w-3 h-3 mr-0.5" />
                              Annex C
                            </a>
                          )}
                          {item.annexd && (
                            <a href={item.annexd} target="_blank" rel="noreferrer"
                              className="inline-flex items-center text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline">
                              <ExternalLink className="w-3 h-3 mr-0.5" />
                              Annex D
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {item.added_by?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            disabled={isSending}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            disabled={isSending}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-500 font-medium">No records found</p>
                        <p className="text-slate-400 text-sm mt-1">Add your first application to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {applyRestructs.length ? (
            applyRestructs.map((item, index) => (
              <div key={item.apply_id} className="bg-white rounded-lg shadow border border-slate-200/60">
                {/* Card Header */}
                <div className="p-3 border-b border-slate-100 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 mb-1">#{index + 1}</div>
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{item.project?.project_title || '-'}</h3>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(item.status || 'pending')}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3 space-y-2">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded p-2">
                      <span className="text-slate-500 block text-xs">Added By</span>
                      <p className="font-medium text-slate-900 truncate">{item.added_by?.name || '-'}</p>
                    </div>
                    <div className="bg-slate-50 rounded p-2">
                      <span className="text-slate-500 block text-xs">Created</span>
                      <p className="font-medium text-slate-900">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded p-2 col-span-2">
                      <span className="text-slate-500 block text-xs mb-1">Documents</span>
                      <div className="flex flex-wrap gap-1">
                        {item.proponent && (
                          <a href={item.proponent} target="_blank" rel="noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                            <ExternalLink className="w-3 h-3 mr-0.5" />
                            Proponent
                          </a>
                        )}
                        {item.psto && (
                          <a href={item.psto} target="_blank" rel="noreferrer"
                            className="inline-flex items-center text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors">
                            <ExternalLink className="w-3 h-3 mr-0.5" />
                            PSTO
                          </a>
                        )}
                        {item.annexc && (
                          <a href={item.annexc} target="_blank" rel="noreferrer"
                            className="inline-flex items-center text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors">
                            <ExternalLink className="w-3 h-3 mr-0.5" />
                            Annex C
                          </a>
                        )}
                        {item.annexd && (
                          <a href={item.annexd} target="_blank" rel="noreferrer"
                            className="inline-flex items-center text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition-colors">
                            <ExternalLink className="w-3 h-3 mr-0.5" />
                            Annex D
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={isSending}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-all disabled:opacity-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      disabled={isSending}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-slate-300 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500 font-medium">No records found</p>
              <p className="text-slate-400 text-xs mt-1">Add your first application to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 rounded-t-xl md:rounded-t-2xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-2xl font-bold text-slate-900">
                    {editingItem ? 'Edit Application' : 'Add Application'}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Fill in the details below</p>
                </div>
                <button
                  onClick={handleCloseForm}
                  disabled={processing || isSending}
                  className="text-slate-400 hover:text-slate-600 transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-5">
              {/* Loading Indicator */}
              {(isSending || processing) && (
                <div className="p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 md:gap-3">
                  <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs md:text-sm font-medium text-blue-700">Saving and sending emails...</span>
                </div>
              )}

              {/* Project Select */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.project_id}
                  onChange={(e) => setData('project_id', e.target.value)}
                  disabled={processing || isSending}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_title}
                    </option>
                  ))}
                </select>
                {(errors.project_id || validationErrors.project_id) && (
                  <p className="mt-1 text-xs md:text-sm text-red-600 flex items-start gap-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {errors.project_id || validationErrors.project_id}
                  </p>
                )}
              </div>

              {/* Link Fields */}
              {[
                { field: 'proponent', label: 'Proponent Letter' },
                { field: 'psto', label: 'PD Letter' },
                { field: 'annexc', label: 'Annex C' },
                { field: 'annexd', label: 'Annex D' }
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={data[field]}
                      onChange={(e) => {
                        setData(field, e.target.value);
                        if (validationErrors[field]) {
                          setValidationErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors[field];
                            return newErrors;
                          });
                        }
                      }}
                      disabled={processing || isSending}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 pl-9 md:pl-10 text-xs md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-slate-400 absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {(errors[field] || validationErrors[field]) && (
                    <p className="mt-1 text-xs md:text-sm text-red-600 flex items-start gap-1">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {errors[field] || validationErrors[field]}
                    </p>
                  )}
                  <p className="mt-0.5 md:mt-1 text-xs text-slate-500">
                    Google Drive or OneDrive only
                  </p>
                </div>
              ))}

              {/* Modal Footer */}
              <div className="flex gap-2 md:gap-3 pt-3 md:pt-4 border-t border-slate-200">
                <button
                  onClick={handleCloseForm}
                  disabled={processing || isSending}
                  className="flex-1 px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={processing || isSending}
                  className="flex-1 px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs md:text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing || isSending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingItem ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    editingItem ? 'Update Application' : 'Save Application'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-sm w-full p-4 md:p-6">
            <div className="flex gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
                  Delete Application
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
                  Delete the application for{' '}
                  <span className="font-semibold">{itemToDelete.project?.project_title}</span>?
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium">
                  This cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-xs md:text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-xs md:text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}