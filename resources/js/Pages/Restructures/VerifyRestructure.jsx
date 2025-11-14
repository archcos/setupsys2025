import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { ExternalLink, Plus, Edit3, Trash2, X, AlertCircle, Calendar, FileText, CheckCircle, XCircle, ChevronLeft, DollarSign, Info, ChevronDown } from 'lucide-react';

export default function VerifyRestructure({ applyRestruct, project, restructures, auth }) {
  const [showUpdateRefundEnd, setShowUpdateRefundEnd] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [expandedRestructure, setExpandedRestructure] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToUpdate, setItemToUpdate] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [customType, setCustomType] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');
  const [updateAmounts, setUpdateAmounts] = useState([]);
  
  const userRole = auth?.user?.role;
  
  const { data: refundEndData, setData: setRefundEndData, put: putRefundEnd, processing: processingRefundEnd, errors: refundEndErrors } = useForm({
    refund_end: project.refund_end ? project.refund_end.substring(0, 7) : '',
  });

  const { data, setData, post, put, reset, errors, processing } = useForm({
    type: '',
    restruct_start: '',
    restruct_end: '',
    status: 'pending',
    remarks: '',
    updates: [],
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

  const getMinDate = () => {
    if (!project.refund_initial) return '';
    return project.refund_initial.substring(0, 7);
  };

  const getMaxDate = () => {
    if (!project.refund_end) return '';
    return project.refund_end.substring(0, 7);
  };

  const getMinUpdateDate = () => {
    if (!data.restruct_end) return '';
    const endDate = new Date(data.restruct_end + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate.toISOString().substring(0, 7);
  };

  const checkDateOverlap = (startDate, endDate, excludeId = null) => {
    if (!startDate || !endDate) return null;

    const newStart = new Date(startDate + '-01');
    const newEnd = new Date(endDate + '-01');

    for (const item of restructures) {
      if (excludeId && item.restruct_id === excludeId) continue;

      const existingStart = new Date(item.restruct_start);
      const existingEnd = new Date(item.restruct_end);

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

  useEffect(() => {
    setDateRangeError('');

    if (!data.restruct_start || !data.restruct_end) return;

    const startDate = new Date(data.restruct_start + '-01');
    const endDate = new Date(data.restruct_end + '-01');
    const refundInitial = new Date(project.refund_initial);
    const refundEnd = new Date(project.refund_end);

    if (endDate <= startDate) {
      setDateRangeError('End date must be after start date');
      return;
    }

    if (startDate < refundInitial || startDate > refundEnd) {
      setDateRangeError(`Start date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(project.refund_end)})`);
      return;
    }

    if (endDate < refundInitial || endDate > refundEnd) {
      setDateRangeError(`End date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(project.refund_end)})`);
      return;
    }

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
    setUpdateAmounts([]);
    setShowAddForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const isCustomType = !typeOptions.slice(0, 3).includes(item.type);
    setData({
      type: isCustomType ? 'Custom' : item.type,
      restruct_start: item.restruct_start ? item.restruct_start.substring(0, 7) : '',
      restruct_end: item.restruct_end ? item.restruct_end.substring(0, 7) : '',
      status: item.status || 'pending',
      remarks: item.remarks || '',
      updates: item.updates || [],
    });
    setCustomType(isCustomType ? item.type : '');
    
    if (item.updates && item.updates.length > 0) {
      setUpdateAmounts(item.updates.map(u => ({
        update_start: u.update_start.substring(0, 7),
        update_end: u.update_end.substring(0, 7),
        update_amount: u.update_amount,
      })));
    } else {
      setUpdateAmounts([]);
    }
    
    setDateRangeError('');
    setShowAddForm(true);
  };

  const handleAddUpdateAmount = () => {
    setUpdateAmounts([...updateAmounts, {
      update_start: '',
      update_end: '',
      update_amount: '',
    }]);
  };

  const handleRemoveUpdateAmount = (index) => {
    setUpdateAmounts(updateAmounts.filter((_, i) => i !== index));
  };

  const handleUpdateAmountChange = (index, field, value) => {
    const newUpdates = [...updateAmounts];
    newUpdates[index][field] = value;
    setUpdateAmounts(newUpdates);
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

    if (!data.remarks || data.remarks.trim() === '') {
      alert('Please provide remarks for this action');
      return;
    }

    if (dateRangeError) {
      alert(dateRangeError);
      return;
    }

    const validUpdates = updateAmounts.filter(u => 
      u.update_start && u.update_end && u.update_amount
    );

    if (updateAmounts.length > 0 && validUpdates.length === 0) {
      alert('Please complete all update amount fields or remove them');
      return;
    }

    const restructEndTime = new Date(data.restruct_end + '-01').getTime();

    for (const update of validUpdates) {
      const updateStart = new Date(update.update_start + '-01');
      const updateEnd = new Date(update.update_end + '-01');

      if (updateEnd <= updateStart) {
        alert('Update end date must be after start date');
        return;
      }

      // Check update start is AFTER restructure end
      if (updateStart.getTime() <= restructEndTime) {
        alert(`Update period must start AFTER the restructuring end date (${formatDate(data.restruct_end + '-01')}). Updates should begin in ${getNextMonth(data.restruct_end)} or later.`);
        return;
      }

      // Check update doesn't exceed refund end
      const refundEnd = new Date(project.refund_end);
      if (updateEnd > refundEnd) {
        alert(`Update period cannot exceed the refund end date (${formatDate(project.refund_end)})`);
        return;
      }
    }

    const submitData = {
      type: finalType,
      project_id: project.project_id,
      restruct_start: data.restruct_start,
      restruct_end: data.restruct_end,
      status: status,
      remarks: data.remarks,
      updates: validUpdates,
    };

    if (editingItem) {
      router.put(route('restructure.update', editingItem.restruct_id), submitData, {
        onSuccess: () => {
          reset();
          setShowAddForm(false);
          setEditingItem(null);
          setCustomType('');
          setDateRangeError('');
          setUpdateAmounts([]);
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
          setUpdateAmounts([]);
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

  const getNextMonth = (monthString) => {
    const date = new Date(monthString + '-01');
    date.setMonth(date.getMonth() + 1);
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

      <div className="mb-6">
        <Link
          href="/verify-restructure"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to List
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Verify Restructuring
        </h1>
        <p className="text-slate-600 mt-1">{project.project_title}</p>
      </div>

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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Original Refund Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Original Last Refund</th>
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
          <div className="space-y-3">
            {restructures.length ? (
              restructures.map((item) => (
                <div key={item.restruct_id} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Main Row */}
                  <div className="bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase">Type</p>
                          <p className="font-medium text-slate-900 mt-1">{item.type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase">Start</p>
                          <p className="text-slate-900 mt-1">{formatDate(item.restruct_start)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase">End</p>
                          <p className="text-slate-900 mt-1">{formatDate(item.restruct_end)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            item.status === 'raised' 
                              ? 'bg-green-100 text-green-800' 
                              : item.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status || 'pending'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase">Updates</p>
                          <p className="font-semibold text-indigo-600 mt-1">
                            {item.updates && item.updates.length > 0 ? item.updates.length : 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase">Remarks</p>
                          <p className="text-slate-600 truncate mt-1 max-w-xs">{item.remarks || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {/* Expand/Collapse Button */}
                        {item.updates && item.updates.length > 0 && (
                          <button
                            onClick={() => setExpandedRestructure(expandedRestructure === item.restruct_id ? null : item.restruct_id)}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            title="View update amounts"
                          >
                            <ChevronDown 
                              className={`w-5 h-5 text-slate-600 transition-transform ${
                                expandedRestructure === item.restruct_id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}

                        {/* Action Buttons */}
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
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Deny
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Updates Section */}
                  {expandedRestructure === item.restruct_id && item.updates && item.updates.length > 0 && (
                    <div className="border-t border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Refund Amount Updates</h4>
                      <div className="space-y-2">
                        {item.updates.map((update, idx) => (
                          <div key={idx} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-medium text-indigo-900">
                                  <span className="font-semibold">Update {idx + 1}:</span> {formatDate(update.update_start)} - {formatDate(update.update_end)}
                                </p>
                                <p className="text-sm font-semibold text-indigo-700 mt-2">
                                  {formatCurrency(update.update_amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                No restructuring entries yet. Click "Add Restructuring" to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Restructuring Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl sticky top-0 z-10">
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
                    setUpdateAmounts([]);
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

              {/* Refund Amount Updates Section */}
              <div className="border-t pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">
                      Refund Amount Updates (Optional)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Add periods where refund amounts change AFTER the restructuring period ends
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUpdateAmount}
                    disabled={processing || !data.restruct_end}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Update
                  </button>
                </div>

                {!data.restruct_end && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800">
                        Please set the restructuring end date first before adding update amounts.
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning Info */}
                {data.restruct_end && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Updates must start AFTER restructuring ends ({formatDate(data.restruct_end + '-01')})</li>
                          <li>Earliest update can start: <strong>{getNextMonth(data.restruct_end)}</strong></li>
                          <li>Latest update can end: <strong>{formatDate(project.refund_end)}</strong></li>
                          <li>Example: If restructuring ends Mar 2025, updates must start from Apr 2025 onwards</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Update Amount Entries */}
                {updateAmounts.length > 0 && (
                  <div className="space-y-3">
                    {updateAmounts.map((update, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h5 className="text-sm font-semibold text-slate-700">
                            Update Period {index + 1}
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleRemoveUpdateAmount(index)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-700 p-1 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="month"
                              value={update.update_start}
                              onChange={(e) => handleUpdateAmountChange(index, 'update_start', e.target.value)}
                              min={getMinUpdateDate()}
                              max={getMaxDate()}
                              disabled={processing}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">Min: {getNextMonth(data.restruct_end)}</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="month"
                              value={update.update_end}
                              onChange={(e) => handleUpdateAmountChange(index, 'update_end', e.target.value)}
                              min={getMinUpdateDate()}
                              max={getMaxDate()}
                              disabled={processing}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">Max: {formatDate(project.refund_end)}</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Refund Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                ₱
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={update.update_amount}
                                onChange={(e) => handleUpdateAmountChange(index, 'update_amount', e.target.value)}
                                disabled={processing}
                                placeholder="0.00"
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {updateAmounts.length === 0 && data.restruct_end && (
                  <div className="text-center py-6 text-sm text-slate-500">
                    No update periods added yet. Click "Add Update" to add refund amount changes.
                  </div>
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
                <p className="mt-1 text-xs text-slate-500">
                  Provide detailed remarks for raising or denying this restructuring request
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    reset();
                    setCustomType('');
                    setDateRangeError('');
                    setUpdateAmounts([]);
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
                  This will permanently remove the restructuring record and all associated update amounts from the system.
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
                <p className={`text-sm mt-1 ${
                  statusAction === 'approve' ? 'text-green-800' : 'text-red-800'
                }`}>
                  <strong>Period:</strong> {formatDate(itemToUpdate.restruct_start)} to {formatDate(itemToUpdate.restruct_end)}
                </p>
                {itemToUpdate.updates && itemToUpdate.updates.length > 0 && (
                  <div className="mt-2">
                    <p className={`text-sm font-semibold ${
                      statusAction === 'approve' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Update Amounts ({itemToUpdate.updates.length}):
                    </p>
                    <ul className="mt-1 space-y-1">
                      {itemToUpdate.updates.map((update, idx) => (
                        <li key={idx} className={`text-xs ${
                          statusAction === 'approve' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          • {formatDate(update.update_start)} to {formatDate(update.update_end)}: {formatCurrency(update.update_amount)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

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