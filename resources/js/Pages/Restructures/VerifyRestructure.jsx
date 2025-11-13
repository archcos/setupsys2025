import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { ExternalLink, Plus, Edit3, Trash2, X, AlertCircle, Calendar, FileText, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function VerifyRestructure({ applyRestruct, project, restructures, auth }) {
  const [showUpdateRefundEnd, setShowUpdateRefundEnd] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToUpdate, setItemToUpdate] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [customType, setCustomType] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');
  
  const userRole = auth?.user?.role;
  
  const { data: refundEndData, setData: setRefundEndData, put: putRefundEnd, processing: processingRefundEnd, errors: refundEndErrors } = useForm({
    refund_end: project.refund_end ? project.refund_end.substring(0, 7) : '',
  });

  const { data, setData, post, put, reset, errors, processing } = useForm({
    type: '',
    restruct_start: '',
    restruct_end: '',
    restruct_amount: '',
    status: 'pending',
    remarks: '',
  });

  const { data: statusData, setData: setStatusData, put: putStatus, reset: resetStatus, errors: statusErrors, processing: processingStatus } = useForm({
    status: '',
    remarks: '',
  });

  const typeOptions = [
    'First Restructuring',
    'Second Restructuring',
    'Third Restructuring',
    'Custom'
  ];

  // Get min and max dates for date inputs based on refund period
  const getMinDate = () => {
    if (!project.refund_initial) return '';
    return project.refund_initial.substring(0, 7);
  };

  const getMaxDate = () => {
    if (!project.refund_end) return '';
    return project.refund_end.substring(0, 7);
  };

  // Check if dates overlap with existing restructures
  const checkDateOverlap = (startDate, endDate, excludeId = null) => {
    if (!startDate || !endDate) return null;

    const newStart = new Date(startDate + '-01');
    const newEnd = new Date(endDate + '-01');

    for (const item of restructures) {
      if (excludeId && item.restruct_id === excludeId) continue;

      const existingStart = new Date(item.restruct_start);
      const existingEnd = new Date(item.restruct_end);

      // Check for overlap
      if (newStart <= existingEnd && newEnd >= existingStart) {
        return {
          overlap: true,
          type: item.type,
          start: item.restruct_start.substring(0, 7),
          end: item.restruct_end.substring(0, 7)
        };
      }
    }

    return null;
  };

  // Validate dates whenever they change
  useEffect(() => {
    setDateRangeError('');

    if (!data.restruct_start || !data.restruct_end) return;

    const startDate = new Date(data.restruct_start + '-01');
    const endDate = new Date(data.restruct_end + '-01');
    const refundInitial = new Date(project.refund_initial);
    const refundEnd = new Date(project.refund_end);

    // Check if end is before start
    if (endDate <= startDate) {
      setDateRangeError('End date must be after start date');
      return;
    }

    // Check if dates are within refund period
    if (startDate < refundInitial || startDate > refundEnd) {
      setDateRangeError(`Start date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(project.refund_end)})`);
      return;
    }

    if (endDate < refundInitial || endDate > refundEnd) {
      setDateRangeError(`End date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(project.refund_end)})`);
      return;
    }

    // Check for overlaps
    const overlap = checkDateOverlap(
      data.restruct_start, 
      data.restruct_end, 
      editingItem?.restruct_id
    );

    if (overlap) {
      setDateRangeError(`Date range overlaps with existing "${overlap.type}" (${formatDate(overlap.start + '-01')} to ${formatDate(overlap.end + '-01')})`);
    }
  }, [data.restruct_start, data.restruct_end, editingItem]);

  const handleUpdateRefundEnd = () => {
    putRefundEnd(route('project.update-refund-end', project.project_id), {
      onSuccess: () => {
        setShowUpdateRefundEnd(false);
      },
    });
  };

  const handleAddRestructure = () => {
    setEditingItem(null);
    reset();
    setCustomType('');
    setDateRangeError('');
    setShowAddForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const isCustomType = !typeOptions.slice(0, 3).includes(item.type);
    setData({
      type: isCustomType ? 'Custom' : item.type,
      restruct_start: item.restruct_start ? item.restruct_start.substring(0, 7) : '',
      restruct_end: item.restruct_end ? item.restruct_end.substring(0, 7) : '',
      restruct_amount: item.restruct_amount || '',
      status: item.status || 'pending',
      remarks: item.remarks || '',
    });
    setCustomType(isCustomType ? item.type : '');
    setDateRangeError('');
    setShowAddForm(true);
  };

  const handleSubmitWithStatus = (status) => {
    const finalType = data.type === 'Custom' ? customType : data.type;
    
    if (!finalType) {
      alert('Please select or enter a restructuring type');
      return;
    }

    if (!data.restruct_start || !data.restruct_end) {
      alert('Please fill in all required fields');
      return;
    }

    if (!data.restruct_amount || parseFloat(data.restruct_amount) <= 0) {
      alert('Please enter a valid restructured amount');
      return;
    }

    if (!data.remarks || data.remarks.trim() === '') {
      alert('Please provide remarks for this action');
      return;
    }

    // Check for date validation errors
    if (dateRangeError) {
      alert(dateRangeError);
      return;
    }

    const submitData = {
      type: finalType,
      project_id: project.project_id,
      restruct_start: data.restruct_start,
      restruct_end: data.restruct_end,
      restruct_amount: parseFloat(data.restruct_amount),
      status: status,
      remarks: data.remarks,
    };

    console.log('Submitting data:', submitData);

    if (editingItem) {
      router.put(route('restructure.update', editingItem.restruct_id), submitData, {
        onSuccess: () => {
          reset();
          setShowAddForm(false);
          setEditingItem(null);
          setCustomType('');
          setDateRangeError('');
        },
        onError: (errors) => {
          console.error('Update errors:', errors);
        },
      });
    } else {
      router.post(route('restructure.store'), submitData, {
        onSuccess: () => {
          reset();
          setShowAddForm(false);
          setCustomType('');
          setDateRangeError('');
        },
        onError: (errors) => {
          console.error('Store errors:', errors);
        },
      });
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      router.delete(route('restructure.destroy', itemToDelete.restruct_id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        },
        onError: () => {
          alert('Error deleting restructuring');
        }
      });
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleStatusAction = (item, action) => {
    setItemToUpdate(item);
    setStatusAction(action);
    resetStatus();
    setShowStatusModal(true);
  };

const handleStatusSubmit = () => {
  if (!statusData.remarks || statusData.remarks.trim() === '') {
    alert('Please provide remarks for this action');
    return;
  }

  const status = statusAction === 'approve' ? 'approved' : 'pending';
  
  // Use router.put to send the data
  router.put(route('restructure.update-status', itemToUpdate.restruct_id), {
    status: status,
    remarks: statusData.remarks,
  }, {
    preserveState: true,
    preserveScroll: true,
    onSuccess: () => {
      setShowStatusModal(false);
      setItemToUpdate(null);
      setStatusAction(null);
      resetStatus();
    },
    onError: (errors) => {
      console.error('Status update errors:', errors);
      alert('Failed to update status: ' + (errors.error || 'Please try again.'));
    }
  });
};

  const cancelStatusAction = () => {
    setShowStatusModal(false);
    setItemToUpdate(null);
    setStatusAction(null);
    resetStatus();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
      
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
              <Head title={`Verify - ${project.project_title}`} />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Verify Restructuring
          </h1>
          <p className="text-slate-600 mt-1">{project.project_title}</p>
        </div>

        {/* Annex D Reference Card */}
        {applyRestruct.annexd && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Reference Document</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Please review Annex D as reference for the project restructuring date.
                </p>
                <a
                  href={applyRestruct.annexd}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Annex D
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Current Refund Period */}
        <div className="mb-6 bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200/60">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Current Refund Period</h2>
            <button
              onClick={() => setShowUpdateRefundEnd(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm"
            >
              <Calendar className="w-4 h-4" />
              Update Refund End Date
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Refund Start</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Refund End</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Refund Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Last Refund</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                      {formatDate(project.refund_initial)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                      {formatDate(project.refund_end)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {project.refund_initial && project.refund_end ? (
                        Math.ceil((new Date(project.refund_end) - new Date(project.refund_initial)) / (1000 * 60 * 60 * 24 * 365))
                      ) : '-'} years
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-semibold">
                      {formatCurrency(project.refund_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {formatCurrency(project.last_refund)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Restructuring Table */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200/60">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Restructuring Details</h2>
            {userRole === 'rpmo' && (
              <button
                onClick={handleAddRestructure}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Restructuring
              </button>
            )}
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Start Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">End Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Restructured Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Remarks</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restructures.length ? (
                    restructures.map((item) => (
                      <tr key={item.restruct_id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">{item.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{formatDate(item.restruct_start)}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{formatDate(item.restruct_end)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(item.restruct_amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.status === 'raised' 
                              ? 'bg-green-100 text-green-800' 
                              : item.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.remarks || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {userRole === 'rpmo' ? (
                              <>
                                <button
                                  onClick={() => handleEdit(item)}
                                  disabled={item.status === 'approved'}
                                  className={`p-2 rounded-lg transition-all ${
                                    item.status === 'approved'
                                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                  }`}
                                  title={item.status === 'approved' ? 'Cannot edit approved entry' : 'Edit'}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item)}
                                  disabled={item.status === 'approved'}
                                  className={`p-2 rounded-lg transition-all ${
                                    item.status === 'approved'
                                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                  }`}
                                  title={item.status === 'approved' ? 'Cannot delete approved entry' : 'Delete'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : userRole === 'rd' ? (
                              <>
                                <button
                                  onClick={() => handleStatusAction(item, 'approve')}
                                  disabled={item.status === 'approved' || item.status === 'pending'}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    item.status === 'approved' || item.status === 'pending'
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                  title={
                                    item.status === 'approved' 
                                      ? 'Already approved' 
                                      : item.status === 'pending'
                                      ? 'Cannot approve pending entry'
                                      : 'Approve'
                                  }
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusAction(item, 'deny')}
                                  disabled={item.status === 'approved' || item.status === 'pending'}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    item.status === 'approved' || item.status === 'pending'
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                  }`}
                                  title={
                                    item.status === 'approved'
                                      ? 'Already approved'
                                      : item.status === 'pending'
                                      ? 'Cannot deny pending entry'
                                      : 'Deny'
                                  }
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Deny
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                        No restructuring entries yet. Click "Add Restructuring" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons - Save Only - Only for RPMO */}
        {userRole === 'rpmo' && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleAddRestructure}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Save & Finalize
            </button>
          </div>
        )}

        {/* Update Refund End Date Modal */}
        {showUpdateRefundEnd && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Update Refund End Date</h3>
                  <button
                    onClick={() => setShowUpdateRefundEnd(false)}
                    disabled={processingRefundEnd}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This will update the project's refund end date. The refund initial date will remain unchanged.
                  </p>
                </div>

                {/* Current Dates Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Refund Initial
                    </label>
                    <div className="px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700">
                      {formatDate(project.refund_initial)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Refund End
                    </label>
                    <div className="px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700">
                      {formatDate(project.refund_end)}
                    </div>
                  </div>
                </div>

                {/* New Refund End Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Refund End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={refundEndData.refund_end}
                    onChange={(e) => setRefundEndData('refund_end', e.target.value)}
                    disabled={processingRefundEnd}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                  {refundEndErrors.refund_end && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {refundEndErrors.refund_end}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setShowUpdateRefundEnd(false)}
                    disabled={processingRefundEnd}
                    className="px-5 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRefundEnd}
                    disabled={processingRefundEnd}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingRefundEnd ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update Date'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Restructuring Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {editingItem ? 'Edit Restructuring' : 'Add Restructuring'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingItem(null);
                      reset();
                      setCustomType('');
                      setDateRangeError('');
                    }}
                    disabled={processing}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Date Range Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Valid Date Range:</strong> Restructuring dates must be within the refund period from <strong>{formatDate(project.refund_initial)}</strong> to <strong>{formatDate(project.refund_end)}</strong> and must not overlap with existing restructures.
                  </p>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Restructuring Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.type}
                    onChange={(e) => setData('type', e.target.value)}
                    disabled={processing}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                  >
                    <option value="">Select type...</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.type}
                    </p>
                  )}
                </div>

                {/* Custom Type Input */}
                {data.type === 'Custom' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Custom Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      disabled={processing}
                      placeholder="Enter custom restructuring type..."
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                )}

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Restructure Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={data.restruct_start}
                    onChange={(e) => setData('restruct_start', e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    disabled={processing}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                  {errors.restruct_start && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.restruct_start}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Restructure End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={data.restruct_end}
                    onChange={(e) => setData('restruct_end', e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    disabled={processing}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                  {errors.restruct_end && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.restruct_end}
                    </p>
                  )}
                </div>

                {/* Date Range Error Display */}
                {dateRangeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{dateRangeError}</span>
                    </p>
                  </div>
                )}

                {/* Restructured Amount */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Restructured Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      value={data.restruct_amount}
                      onChange={(e) => setData('restruct_amount', e.target.value)}
                      disabled={processing}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                  {errors.restruct_amount && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.restruct_amount}
                    </p>
                  )}
                </div>

                {/* Remarks Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={data.remarks}
                    onChange={(e) => setData('remarks', e.target.value)}
                    placeholder="Enter remarks for this restructuring..."
                    rows="4"
                    disabled={processing}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                  />
                  {errors.remarks && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.remarks}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Provide detailed remarks for raising or denying this restructuring request
                  </p>
                </div>

                {/* Action Buttons - Raise and Deny */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingItem(null);
                      reset();
                      setCustomType('');
                      setDateRangeError('');
                    }}
                    disabled={processing}
                    className="px-5 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitWithStatus('pending')}
                    disabled={processing || !!dateRangeError}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Deny
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSubmitWithStatus('raised')}
                    disabled={processing || !!dateRangeError}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Raise
                      </>
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
                    Delete Restructuring Entry
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Are you sure you want to delete the <span className="font-semibold text-gray-900">{itemToDelete.type}</span> restructuring entry?
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    This will permanently remove the restructuring record with amount of <span className="font-semibold text-green-700">{formatCurrency(itemToDelete.restruct_amount)}</span> from the system.
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
                  Delete Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Action Modal (For RD) */}
        {showStatusModal && itemToUpdate && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className={`px-6 py-4 rounded-t-2xl ${
                statusAction === 'approve' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                  : 'bg-gradient-to-r from-red-600 to-rose-600'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {statusAction === 'approve' ? 'Approve' : 'Deny'} Restructuring
                  </h3>
                  <button
                    onClick={cancelStatusAction}
                    disabled={processingStatus}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Info Card */}
                <div className={`border rounded-lg p-4 ${
                  statusAction === 'approve' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm ${
                    statusAction === 'approve' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <strong>Action:</strong> You are about to {statusAction === 'approve' ? 'approve' : 'deny'} the <strong>{itemToUpdate.type}</strong> restructuring.
                  </p>
                  <p className={`text-sm mt-2 ${
                    statusAction === 'approve' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <strong>Amount:</strong> {formatCurrency(itemToUpdate.restruct_amount)}
                  </p>
                  <p className={`text-sm mt-1 ${
                    statusAction === 'approve' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <strong>Period:</strong> {formatDate(itemToUpdate.restruct_start)} to {formatDate(itemToUpdate.restruct_end)}
                  </p>
                </div>

                {/* Remarks Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={statusData.remarks}
                    onChange={(e) => setStatusData('remarks', e.target.value)}
                    placeholder={`Enter remarks for ${statusAction === 'approve' ? 'approving' : 'denying'} this restructuring...`}
                    rows="4"
                    disabled={processingStatus}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                  />
                  {statusErrors.remarks && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {statusErrors.remarks}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Provide detailed remarks for this decision
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={cancelStatusAction}
                    disabled={processingStatus}
                    className="px-5 py-2.5 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusSubmit}
                    disabled={processingStatus}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-lg transition-all disabled:opacity-50 ${
                      statusAction === 'approve'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                    }`}
                  >
                    {processingStatus ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        {statusAction === 'approve' ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Deny
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

  );
}