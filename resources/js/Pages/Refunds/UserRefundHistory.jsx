import { Building2, Calendar, CheckCircle2, XCircle, DollarSign, TrendingUp, Clock, FileText, RefreshCw, ChevronLeft } from 'lucide-react';
import {Link } from "@inertiajs/react";
export default function ProjectRefundDetailsView({ project, months, summary }) {

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'bg-green-500',
          badge: 'bg-green-100 text-green-700'
        };
      case 'restructured':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-700'
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
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
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Back Button */}
        <Link
          href="/my-refunds"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Summary
        </Link>

        {/* Project Header Card */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold mb-1 line-clamp-2">{project.project_title}</h1>
                <div className="flex items-center gap-2 text-blue-100 text-xs md:text-sm">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{project.company.company_name}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-blue-100 text-xs mb-1">Project ID</div>
                <div className="text-base md:text-lg font-bold">{project.project_id}</div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 bg-gradient-to-r from-gray-50 to-white">
            <div className="bg-white rounded-lg p-2 md:p-4 border border-gray-200 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="p-2 bg-blue-100 rounded-lg w-fit">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total Project Cost</div>
                  <div className="text-sm md:text-lg font-bold text-gray-900 mt-1 truncate">{formatCurrency(project.project_cost)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 md:p-4 border border-gray-200 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="p-2 bg-green-100 rounded-lg w-fit">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total Paid</div>
                  <div className="text-sm md:text-lg font-bold text-green-600 mt-1 truncate">{formatCurrency(summary.total_paid)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{summary.paid_count}/{summary.total_months}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 md:p-4 border border-gray-200 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="p-2 bg-red-100 rounded-lg w-fit">
                  <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total Unpaid</div>
                  <div className="text-sm md:text-lg font-bold text-red-600 mt-1 truncate">{formatCurrency(summary.total_unpaid)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{summary.unpaid_count} remaining</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 md:p-4 border border-gray-200 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="p-2 bg-purple-100 rounded-lg w-fit">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold">Completion</div>
                  <div className="text-sm md:text-lg font-bold text-purple-600 mt-1">{summary.completion_percentage}%</div>
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

        {/* Refund Timeline */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span>Monthly Refund Schedule</span>
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-2">
                  {project.refund_initial && project.refund_end && (
                    <>From {new Date(project.refund_initial).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} to {new Date(project.refund_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 md:p-6">
            <div className="space-y-2">
              {months.map((month, index) => {
                const colors = getStatusColor(month.status);
                
                return (
                  <div
                    key={index}
                    className={`flex flex-col md:flex-row md:items-center gap-3 p-2 md:p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}
                  >
                    {/* Status Icon and Month Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex-shrink-0 p-1.5 rounded-lg ${colors.icon}`}>
                        {getStatusIcon(month.status)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base">{month.month}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge} whitespace-nowrap`}>
                            {month.status.toUpperCase()}
                          </span>
                          {!month.is_past && month.status === 'unpaid' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 whitespace-nowrap">
                              UPCOMING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="md:text-right">
                      <div className="text-xs text-gray-500 mb-0.5">Refund Amount</div>
                      <div className="text-base md:text-lg font-bold text-gray-900">
                        {month.status === 'restructured' ? formatCurrency(0) : formatCurrency(month.refund_amount)}
                      </div>
                    </div>

                    {/* Payment Details */}
                    {(month.status === 'paid' || month.status === 'restructured') && (
                      <div className="flex flex-wrap gap-2 md:gap-3 md:pl-3 md:border-l-2 md:border-gray-200">
                        {month.check_num && (
                          <div className="text-center bg-white rounded px-2 py-1">
                            <div className="text-xs text-gray-500">Check #</div>
                            <div className="text-xs font-semibold text-gray-700">{month.check_num}</div>
                          </div>
                        )}
                        {month.receipt_num && (
                          <div className="text-center bg-white rounded px-2 py-1">
                            <div className="text-xs text-gray-500">Receipt #</div>
                            <div className="text-xs font-semibold text-gray-700">{month.receipt_num}</div>
                          </div>
                        )}
                        {month.amount_due !== null && (
                          <div className="text-center bg-white rounded px-2 py-1">
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
              <div className="text-center py-8 md:py-12">
                <FileText className="w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No Refund Schedule</h3>
                <p className="text-gray-500 text-xs md:text-sm">
                  This project doesn't have a refund schedule configured yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Project Info */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Details</h2>
          </div>
          <div className="p-3 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Monthly Refund Amount</label>
              <p className="text-base md:text-lg font-bold text-gray-900 mt-1 truncate">{formatCurrency(project.refund_amount)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Month Refund</label>
              <p className="text-base md:text-lg font-bold text-gray-900 mt-1 truncate">{formatCurrency(project.last_refund)}</p>
            </div>
            {project.company.email && (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Company Email</label>
                <p className="text-base text-gray-900 mt-1 break-all">{project.company.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}