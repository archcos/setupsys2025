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
  const [newRefundEnd, setNewRefundEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState(null);
  
  const userRole = auth?.user?.role;
  
  const { data: refundEndData, setData: setRefundEndData, put: putRefundEnd, processing: processingRefundEnd, errors: refundEndErrors } = useForm({
    refund_end: project.refund_end ? project.refund_end.substring(0, 7) : '',
  });

  const { data, setData, post, put, reset, errors, processing } = useForm({
    project_id: project.project_id,
    apply_id: applyRestruct.apply_id,
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
    // If newRefundEnd is set, use it as the max date
    if (newRefundEnd) {
      return newRefundEnd;
    }
    // Otherwise use the project's refund_end
    if (!project.refund_end) return '';
    return project.refund_end.substring(0, 7);
  };

  const getEffectiveRefundEnd = () => {
    return newRefundEnd || (project.refund_end ? project.refund_end.substring(0, 7) : '');
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
  
  // Use newRefundEnd if set, otherwise use project.refund_end
  const effectiveRefundEnd = newRefundEnd 
    ? new Date(newRefundEnd + '-01') 
    : new Date(project.refund_end);

  if (endDate <= startDate) {
    setDateRangeError('End date must be after start date');
    return;
  }

  if (startDate < refundInitial) {
    setDateRangeError(`Start date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(effectiveRefundEnd)})`);
    return;
  }

  if (startDate > effectiveRefundEnd) {
    setDateRangeError(`Start date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(effectiveRefundEnd)})`);
    return;
  }

  if (endDate < refundInitial) {
    setDateRangeError(`End date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(effectiveRefundEnd)})`);
    return;
  }

  if (endDate > effectiveRefundEnd) {
    setDateRangeError(`End date must be within refund period (${formatDate(project.refund_initial)} to ${formatDate(effectiveRefundEnd)})`);
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
}, [data.restruct_start, data.restruct_end, editingItem, newRefundEnd]); // Add newRefundEnd to dependencies


  const handleUpdateRefundEnd = () => {
    putRefundEnd(route('project.update-refund-end', project.project_id), {
      onSuccess: () => {
        setShowUpdateRefundEnd(false);
      },
    });
  };

  const handleAddRestructure = () => {
    setEditingItem(null);
    setData({
      project_id: project.project_id,
      apply_id: applyRestruct.apply_id,
      type: '',
      restruct_start: '',
      restruct_end: '',
      status: 'pending',
      remarks: '',
      updates: [],
    });
    setCustomType('');
    setDateRangeError('');
    setUpdateAmounts([]);
    setIsSubmitting(false);
    setSubmitAction(null);
    setShowAddForm(true);
    setNewRefundEnd(project.refund_end ? project.refund_end.substring(0, 7) : '');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const isCustomType = !typeOptions.slice(0, 3).includes(item.type);
    setData({
      project_id: project.project_id,
      apply_id: applyRestruct.apply_id,
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
    setNewRefundEnd(project.refund_end ? project.refund_end.substring(0, 7) : '');
    setDateRangeError('');
    setIsSubmitting(false);
    setSubmitAction(null);
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

      if (updateStart.getTime() <= restructEndTime) {
        alert(`Update period must start AFTER the restructuring end date (${formatDate(data.restruct_end + '-01')}). Updates should begin in ${getNextMonth(data.restruct_end)} or later.`);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitAction(status === 'raised' ? 'raise' : 'deny');

    const submitData = {
      type: finalType,
      project_id: project.project_id,
      apply_id: applyRestruct.apply_id,
      restruct_start: data.restruct_start,
      restruct_end: data.restruct_end,
      status: status,
      remarks: data.remarks,
      new_refund_end: newRefundEnd, 
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
          setIsSubmitting(false);
          setSubmitAction(null);
        },
        onError: (errors) => {
          console.error('Update errors:', errors);
          setIsSubmitting(false);
          setSubmitAction(null);
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
          setIsSubmitting(false);
          setSubmitAction(null);
        },
        onError: (errors) => {
          console.error('Store errors:', errors);
          setIsSubmitting(false);
          setSubmitAction(null);
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
      preserveState: false,
      preserveScroll: false,
      onBefore: () => {
        console.log('Starting status update and email sending...');
      },
      onSuccess: (page) => {
        console.log('Status update and emails completed successfully');
      },
      onError: (errors) => {
        console.error('Status update errors:', errors);
        alert('Failed to update status: ' + (errors.error || 'Please try again.'));
      },
      onFinish: () => {
        console.log('Request finished');
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

  const isLoading = processing || isSubmitting;

  return (
    <div className="min-h-screen">
      <Head title={`Verify - ${project.project_title}`} />

      <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <Link
            href="/verify-restructure"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to List
          </Link>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Verify Restructuring
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1 line-clamp-2">{project.project_title}</p>
        </div>

        {/* Annex D Section */}
        {applyRestruct.annexd && (
          <div className="mb-4 md:mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl md:rounded-2xl p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-blue-600 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-lg font-semibold text-slate-900 mb-1 md:mb-2">Reference Document</h3>
                <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-3">
                  Please review Annex D as reference for the project restructuring date.
                </p>
                <a
                  href={applyRestruct.annexd}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white font-medium text-xs md:text-sm rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Annex D
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Current Refund Period */}
        <div className="mb-4 md:mb-6 bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Current Refund Period</h2>
          </div>
          <div className="p-3 md:p-6 overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-slate-700">Start</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-slate-700">End</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-slate-700">Duration</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-slate-700 whitespace-nowrap">Amount</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-slate-700 whitespace-nowrap">Last Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-slate-900 font-medium">
                    {formatDate(project.refund_initial)}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-slate-900 font-medium">
                    {formatDate(project.refund_end)}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-slate-900">
                    {project.refund_initial && project.refund_end ? (
                      Math.ceil((new Date(project.refund_end) - new Date(project.refund_initial)) / (1000 * 60 * 60 * 24 * 365))
                    ) : '-'} y
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-slate-900 font-semibold whitespace-nowrap">
                    {formatCurrency(project.refund_amount)}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-slate-900 whitespace-nowrap">
                    {formatCurrency(project.last_refund)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Restructuring Details */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Restructuring Details</h2>
            {userRole === 'rpmo' && (
              <button
                onClick={handleAddRestructure}
                className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs md:text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 w-fit"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          <div className="p-3 md:p-6">
            <div className="space-y-3">
              {restructures.length ? (
                restructures.map((item) => (
                  <div key={item.restruct_id} className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Main Row */}
                    <div className="bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="p-3 md:p-4 space-y-3 md:space-y-0">
                        {/* Mobile View - Stacked */}
                        <div className="md:hidden space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">Type</p>
                              <p className="font-medium text-slate-900 text-sm">{item.type}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              item.status === 'raised' 
                                ? 'bg-green-100 text-green-800' 
                                : item.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.status || 'pending'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-slate-500 font-semibold uppercase">Start</p>
                              <p className="text-slate-900 mt-1">{formatDate(item.restruct_start)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-semibold uppercase">End</p>
                              <p className="text-slate-900 mt-1">{formatDate(item.restruct_end)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-semibold uppercase">Updates</p>
                              <p className="font-semibold text-indigo-600 mt-1">
                                {item.updates?.length || 0}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Remarks</p>
                            <p className="text-slate-600 text-xs mt-1 line-clamp-2">{item.remarks || '-'}</p>
                          </div>
                        </div>

                        {/* Desktop View - Grid */}
                        <div className="hidden md:grid md:grid-cols-6 md:gap-4 md:text-sm">
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
                              {item.updates?.length || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Remarks</p>
                            <p className="text-slate-600 truncate mt-1 max-w-xs">{item.remarks || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 px-3 md:px-4 py-2 md:py-3 border-t border-slate-200 bg-slate-50 flex-wrap">
                        {item.updates?.length > 0 && (
                          <button
                            onClick={() => setExpandedRestructure(expandedRestructure === item.restruct_id ? null : item.restruct_id)}
                            className="p-1.5 hover:bg-slate-200 rounded transition-colors text-xs"
                          >
                            <ChevronDown 
                              className={`w-4 h-4 text-slate-600 transition-transform ${
                                expandedRestructure === item.restruct_id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}

                        {userRole === 'rpmo' ? (
                          <>
                            <button
                              onClick={() => handleEdit(item)}
                              disabled={item.status === 'approved'}
                              className={`p-1.5 rounded text-xs transition-all ${
                                item.status === 'approved'
                                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                              }`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              disabled={item.status === 'approved'}
                              className={`p-1.5 rounded text-xs transition-all ${
                                item.status === 'approved'
                                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : userRole === 'rd' ? (
                          <>
                            <button
                              onClick={() => handleStatusAction(item, 'approve')}
                              disabled={item.status === 'approved' || item.status === 'pending'}
                              className={`inline-flex items-center gap-1 px-2 md:px-3 py-1 rounded text-xs font-medium transition-all ${
                                item.status === 'approved' || item.status === 'pending'
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span className="hidden md:inline">Approve</span>
                            </button>
                            <button
                              onClick={() => handleStatusAction(item, 'deny')}
                              disabled={item.status === 'approved' || item.status === 'pending'}
                              className={`inline-flex items-center gap-1 px-2 md:px-3 py-1 rounded text-xs font-medium transition-all ${
                                item.status === 'approved' || item.status === 'pending'
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              <XCircle className="w-3 h-3" />
                              <span className="hidden md:inline">Deny</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Expanded Updates Section */}
                    {expandedRestructure === item.restruct_id && item.updates?.length > 0 && (
                      <div className="border-t border-slate-200 bg-white p-3 md:p-4">
                        <h4 className="text-xs md:text-sm font-semibold text-slate-700 mb-2 md:mb-3">Refund Amount Updates</h4>
                        <div className="space-y-2">
                          {item.updates.map((update, idx) => (
                            <div key={idx} className="bg-indigo-50 border border-indigo-200 rounded p-2 md:p-3 text-xs md:text-sm">
                              <p className="font-medium text-indigo-900">
                                Update {idx + 1}: {formatDate(update.update_start)} - {formatDate(update.update_end)}
                              </p>
                              <p className="font-semibold text-indigo-700 mt-1">
                                {formatCurrency(update.update_amount)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 md:py-8 text-xs md:text-sm text-slate-500">
                  No restructuring entries yet. Click "Add" to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-6 py-3 md:py-4 rounded-t-xl md:rounded-t-2xl sticky top-0 z-10 flex items-center justify-between">
              <h3 className="text-base md:text-xl font-bold text-white">
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
                disabled={isLoading}
                className="text-white hover:bg-white/20 p-1.5 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-5">
            {/* Date Range Info */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3 md:p-4 text-xs md:text-sm">
              <p className="text-blue-800">
                <strong>Valid Range:</strong> {formatDate(project.refund_initial)} to {formatDate(getEffectiveRefundEnd())}
              </p>
              {newRefundEnd && newRefundEnd !== (project.refund_end ? project.refund_end.substring(0, 7) : '') && (
                <p className="text-blue-800 mt-1">
                  <strong>Note:</strong> End date will be updated to {formatDate(newRefundEnd + '-01')} when approved
                </p>
              )}
            </div>

              {/* New Refund End Date */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                  New Refund End Date (Optional)
                </label>
                <input
                  type="month"
                  value={newRefundEnd}
                  onChange={(e) => setNewRefundEnd(e.target.value)}
                  min={getMinDate()}
                  disabled={isLoading}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">Current refund end: {formatDate(project.refund_end)}</p>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                >
                  <option value="">Select type...</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Custom Type */}
              {data.type === 'Custom' && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                    Custom Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter custom type..."
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={data.restruct_start}
                  onChange={(e) => setData('restruct_start', e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  disabled={isLoading}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={data.restruct_end}
                  onChange={(e) => setData('restruct_end', e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  disabled={isLoading}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              {/* Date Error */}
              {dateRangeError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 md:p-4 text-xs md:text-sm">
                  <p className="text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {dateRangeError}
                  </p>
                </div>
              )}

              {/* Updates Section */}
              <div className="border-t pt-4 md:pt-5">
                <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-slate-700">Refund Updates (Optional)</h4>
                    <p className="text-xs text-slate-500 mt-1">Add periods after restructuring ends</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUpdateAmount}
                    disabled={isLoading || !data.restruct_end}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>

                {updateAmounts.length > 0 && (
                  <div className="space-y-2 md:space-y-3 mt-3">
                    {updateAmounts.map((update, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-200 rounded p-3 md:p-4">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <h5 className="text-xs md:text-sm font-semibold text-slate-700">Update {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => handleRemoveUpdateAmount(index)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
                            <input
                              type="month"
                              value={update.update_start}
                              onChange={(e) => handleUpdateAmountChange(index, 'update_start', e.target.value)}
                              min={getMinUpdateDate()}
                              max={getMaxDate()}
                              disabled={isLoading}
                              className="w-full px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
                            <input
                              type="month"
                              value={update.update_end}
                              onChange={(e) => handleUpdateAmountChange(index, 'update_end', e.target.value)}
                              min={getMinUpdateDate()}
                              max={getMaxDate()}
                              disabled={isLoading}
                              className="w-full px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₱</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={update.update_amount}
                                onChange={(e) => handleUpdateAmountChange(index, 'update_amount', e.target.value)}
                                disabled={isLoading}
                                placeholder="0.00"
                                className="w-full pl-6 pr-2 md:pr-3 py-1 md:py-2 text-xs md:text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                  Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={data.remarks}
                  onChange={(e) => setData('remarks', e.target.value)}
                  placeholder="Enter remarks..."
                  rows="3"
                  disabled={isLoading}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 md:gap-3 pt-3 md:pt-4 border-t">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    reset();
                    setCustomType('');
                    setDateRangeError('');
                    setUpdateAmounts([]);
                  }}
                  disabled={isLoading}
                  className="flex-1 px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitWithStatus('pending')}
                  disabled={isLoading || !!dateRangeError}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-red-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isLoading && submitAction === 'deny' ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Denying...
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
                  disabled={isLoading || !!dateRangeError}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {isLoading && submitAction === 'raise' ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Raising...
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



      {/* Delete Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-sm w-full p-4 md:p-6">
            <div className="flex gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">Delete Entry</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  Delete the <span className="font-semibold">{itemToDelete.type}</span> restructuring entry?
                </p>
                <p className="text-xs text-red-600 font-medium">This cannot be undone.</p>
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-xs md:text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-xs md:text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && itemToUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md">
            <div className={`px-4 md:px-6 py-3 md:py-4 rounded-t-xl md:rounded-t-2xl ${
              statusAction === 'approve' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                : 'bg-gradient-to-r from-red-600 to-rose-600'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-xl font-bold text-white">
                  {statusAction === 'approve' ? 'Approve' : 'Deny'}
                </h3>
                <button
                  onClick={cancelStatusAction}
                  disabled={processingStatus}
                  className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-5">
              <div className={`border rounded-lg p-3 md:p-4 text-xs md:text-sm ${
                statusAction === 'approve' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={statusAction === 'approve' ? 'text-green-800' : 'text-red-800'}>
                  <strong>Type:</strong> {itemToUpdate.type}
                </p>
                <p className={`mt-1 ${statusAction === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                  <strong>Period:</strong> {formatDate(itemToUpdate.restruct_start)} - {formatDate(itemToUpdate.restruct_end)}
                </p>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
                  Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={statusData.remarks}
                  onChange={(e) => setStatusData('remarks', e.target.value)}
                  placeholder="Enter remarks..."
                  rows="3"
                  disabled={processingStatus}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2 md:gap-3 pt-3 border-t">
                <button
                  onClick={cancelStatusAction}
                  disabled={processingStatus}
                  className="flex-1 px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusSubmit}
                  disabled={processingStatus}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-2.5 text-white text-xs md:text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${
                    statusAction === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                  }`}
                >
                  {statusAction === 'approve' ? 'Approve' : 'Deny'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}