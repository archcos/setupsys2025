import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, CheckCircle2, XCircle, DollarSign, TrendingUp, Clock, FileText, RefreshCw, ChevronLeft } from 'lucide-react';

export default function ProjectRefundDetails({ project, months, summary }) {
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [monthDetails, setMonthDetails] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const handleSelectMonth = (monthDate) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthDate)) {
        // Remove month and its details
        const newDetails = { ...monthDetails };
        delete newDetails[monthDate];
        setMonthDetails(newDetails);
        return prev.filter(m => m !== monthDate);
      } else {
        // Add month with empty details
        setMonthDetails(prev => ({
          ...prev,
          [monthDate]: { check_num: '', receipt_num: '' }
        }));
        return [...prev, monthDate];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMonths.length === months.length) {
      setSelectedMonths([]);
      setMonthDetails({});
    } else {
      const allMonths = months.map(m => m.month_date);
      setSelectedMonths(allMonths);
      const newDetails = {};
      allMonths.forEach(monthDate => {
        newDetails[monthDate] = { check_num: '', receipt_num: '' };
      });
      setMonthDetails(newDetails);
    }
  };

  const updateMonthDetail = (monthDate, field, value) => {
    setMonthDetails(prev => ({
      ...prev,
      [monthDate]: {
        ...prev[monthDate],
        [field]: value
      }
    }));
  };

  const handleBulkUpdate = () => {
    if (!bulkStatus || selectedMonths.length === 0) return;

    setIsUpdating(true);

    router.post('/refunds/bulk-update', {
      project_id: project.project_id,
      month_dates: selectedMonths,
      status: bulkStatus,
      month_details: monthDetails,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedMonths([]);
        setBulkStatus('');
        setMonthDetails({});
      },
      onFinish: () => {
        setIsUpdating(false);
      }
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          hover: 'hover:border-green-300',
          icon: 'bg-green-500',
          badge: 'bg-green-100 text-green-700'
        };
      case 'restructured':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          hover: 'hover:border-blue-300',
          icon: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-700'
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          hover: 'hover:border-red-300',
          icon: 'bg-red-500',
          badge: 'bg-red-100 text-red-700'
        };
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid':
        return <CheckCircle2 className="w-5 h-5 text-white" />;
      case 'restructured':
        return <RefreshCw className="w-5 h-5 text-white" />;
      default:
        return <Clock className="w-5 h-5 text-white" />;
    }
  };

  return (
    <main className="flex-1 p-4 overflow-y-auto">
      <Head title={`Refund Details - ${project.project_title}`} />
      
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Back Button */}
        <Link
            href="/refunds"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </Link>

        {/* Project Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold mb-1">{project.project_title}</h1>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>{project.company.company_name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-blue-100 text-xs mb-1">Project ID</div>
                <div className="text-lg font-bold">{project.project_id}</div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-gray-50 to-white">
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total Project Cost</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(project.project_cost)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total Paid</div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(summary.total_paid)}</div>
                  <div className="text-xs text-gray-500">{summary.paid_count} of {summary.total_months} months</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total Unpaid</div>
                  <div className="text-lg font-bold text-red-600">{formatCurrency(summary.total_unpaid)}</div>
                  <div className="text-xs text-gray-500">{summary.unpaid_count} months remaining</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Completion</div>
                  <div className="text-lg font-bold text-purple-600">{summary.completion_percentage}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${summary.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Update Actions */}
        {selectedMonths.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="restructured">Restructured</option>
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatus || isUpdating}
                  className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                    !bulkStatus || isUpdating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isUpdating ? 'Updating...' : 'Update Selected'}
                </button>
                <button
                  onClick={() => {
                    setSelectedMonths([]);
                    setBulkStatus('');
                    setMonthDetails({});
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Individual Month Details - Only show when status is selected */}
              {bulkStatus && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-2">
                    Enter check and receipt numbers for each month (optional):
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedMonths.map((monthDate) => {
                      const month = months.find(m => m.month_date === monthDate);
                      return (
                        <div key={monthDate} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-32">
                            <span className="text-xs font-medium text-gray-700">{month?.month}</span>
                          </div>
                          <input
                            type="number"
                            value={monthDetails[monthDate]?.check_num || ''}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 10);
                              updateMonthDetail(monthDate, 'check_num', value);
                            }}
                            placeholder="Check #"
                            maxLength={10}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            value={monthDetails[monthDate]?.receipt_num || ''}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 10);
                              updateMonthDetail(monthDate, 'receipt_num', value);
                            }}
                            placeholder="Receipt #"
                            maxLength={10}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Refund Timeline/Checklist */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Monthly Refund Schedule
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  {project.refund_initial && project.refund_end && (
                    <>From {new Date(project.refund_initial).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to {new Date(project.refund_end).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</>
                  )}
                </p>
              </div>
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {selectedMonths.length === months.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              {months.map((month, index) => {
                const colors = getStatusColor(month.status);
                const isSelected = selectedMonths.includes(month.month_date);
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : `${colors.bg} ${colors.border} ${colors.hover}`
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectMonth(month.month_date)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Status Icon */}
                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${colors.icon}`}>
                      {getStatusIcon(month.status)}
                    </div>

                    {/* Month Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{month.month}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
                          {month.status.toUpperCase()}
                        </span>
                        {!month.is_past && month.status === 'unpaid' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            UPCOMING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-0.5">Refund Amount</div>
                      <div className="text-base font-bold text-gray-900">
                        {month.status === 'restructured' ? formatCurrency(0) : formatCurrency(month.refund_amount)}
                      </div>
                    </div>

                    {/* Payment Details */}
                    {(month.status === 'paid' || month.status === 'restructured') && (
                      <div className="flex items-center gap-3 pl-3 border-l-2 border-gray-200">
                        {month.check_num && (
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Check #</div>
                            <div className="text-xs font-semibold text-gray-700">{month.check_num}</div>
                          </div>
                        )}
                        {month.receipt_num && (
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Receipt #</div>
                            <div className="text-xs font-semibold text-gray-700">{month.receipt_num}</div>
                          </div>
                        )}
                        {month.amount_due !== null && (
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Amount Due</div>
                            <div className="text-xs font-semibold text-gray-700">
                              {month.status === 'restructured' ? formatCurrency(0) : formatCurrency(month.amount_due)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {months.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No Refund Schedule</h3>
                <p className="text-gray-500 text-sm">
                  This project doesn't have a refund schedule configured yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Project Info */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Monthly Refund Amount</label>
              <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(project.refund_amount)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Month Refund</label>
              <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(project.last_refund)}</p>
            </div>
            {project.company.email && (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Company Email</label>
                <p className="text-base text-gray-900 mt-1">{project.company.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}