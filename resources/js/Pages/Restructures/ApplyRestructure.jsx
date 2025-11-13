import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit3, Trash2, X, AlertCircle, ExternalLink } from 'lucide-react';

export default function ApplyRestructIndex({ applyRestructs, projects }) {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { data, setData, post, put, reset, errors, processing } = useForm({
    project_id: '',
    proponent: '',
    psto: '',
    annexc: '',
    annexd: '',
  });

  const validateDriveLink = (url) => {
    if (!url) return true;
    const googleDriveRegex = /^https:\/\/(drive|docs)\.google\.com\/.+/;
    const oneDriveRegex = /^https:\/\/(onedrive\.live\.com|1drv\.ms)\/.+/;
    return googleDriveRegex.test(url) || oneDriveRegex.test(url);
  };

  const handleSubmit = () => {
    setValidationErrors({});
    
    const newErrors = {};
    ['proponent', 'psto', 'annexc', 'annexd'].forEach(field => {
      if (data[field] && !validateDriveLink(data[field])) {
        newErrors[field] = 'Must be a valid Google Drive or OneDrive link';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    if (editingItem) {
      put(route('apply_restruct.update', editingItem.apply_id), {
        onSuccess: () => {
          reset();
          setShowForm(false);
          setEditingItem(null);
          setValidationErrors({});
        },
      });
    } else {
      post(route('apply_restruct.store'), {
        onSuccess: () => {
          reset();
          setShowForm(false);
          setValidationErrors({});
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
    setShowForm(false);
    setEditingItem(null);
    reset();
    setValidationErrors({});
  };

  return (
      
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
              <Head title="Apply for Restructuring" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Apply Restructuring
              </h1>
              <p className="text-slate-600 mt-1">Manage project restructuring applications</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Application
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Proponent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">PSTO</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Annex C</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Annex D</th>
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
                        {item.proponent ? (
                          <a 
                            href={item.proponent} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.psto ? (
                          <a 
                            href={item.psto} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.annexc ? (
                          <a 
                            href={item.annexc} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.annexd ? (
                          <a 
                            href={item.annexd} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {item.added_by?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {item.updated_at ? new Date(item.updated_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                    <td colSpan="10" className="px-6 py-12 text-center">
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

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {editingItem ? 'Edit Application' : 'Add Application'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Fill in the details below</p>
                  </div>
                  <button
                    onClick={handleCloseForm}
                    disabled={processing}
                    className="text-slate-400 hover:text-slate-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Project Select */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.project_id}
                    onChange={(e) => setData('project_id', e.target.value)}
                    disabled={processing}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_title}
                      </option>
                    ))}
                  </select>
                  {errors.project_id && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.project_id}
                    </p>
                  )}
                </div>

                {/* Link Fields */}
                {[
                  { field: 'proponent', label: 'Proponent Link' },
                  { field: 'psto', label: 'PSTO Link' },
                  { field: 'annexc', label: 'Annex C Link' },
                  { field: 'annexd', label: 'Annex D Link' }
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {label}
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
                        disabled={processing}
                        placeholder="https://drive.google.com/... or https://onedrive.live.com/..."
                        className="w-full px-4 py-2.5 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <ExternalLink className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {(errors[field] || validationErrors[field]) && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors[field] || validationErrors[field]}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Only Google Drive or OneDrive links accepted
                    </p>
                  </div>
                ))}

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleCloseForm}
                    disabled={processing}
                    className="px-5 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={processing}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Application
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Are you sure you want to delete the application for{' '}
                    <span className="font-semibold text-gray-900">
                      {itemToDelete.project?.project_title}
                    </span>?
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Delete Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

  );
}