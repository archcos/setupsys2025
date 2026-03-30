import { Link, router, usePage, Head } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Eye, AlertTriangle, ChevronDown, ChevronUp, Building2, X, ThumbsUp, FileCheck2, ArrowUpDown } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  all: {
    label:      'All',
    tab:        'bg-gray-700 text-white',
    badgeStyle: 'bg-gray-100 text-gray-700 border border-gray-200',
  },
  submitted: {
    label:      'Pending Review',
    tab:        'bg-amber-500 text-white',
    badgeStyle: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  recommended: {
    label:      'Recommended',
    tab:        'bg-blue-500 text-white',
    badgeStyle: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  reviewed: {
    label:      'Reviewed',
    tab:        'bg-green-500 text-white',
    badgeStyle: 'bg-green-100 text-green-800 border border-green-200',
  },
  denied: {
    label:      'Denied',
    tab:        'bg-red-500 text-white',
    badgeStyle: 'bg-red-100 text-red-800 border border-red-200',
  },
};

const STATUS_KEYS = ['all', 'submitted', 'recommended', 'reviewed', 'denied'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTabs({ statusFilter, statusCounts, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {STATUS_KEYS.map((key) => {
        const cfg      = STATUS_CONFIG[key];
        const isActive = statusFilter === key;
        const count    = statusCounts?.[key] ?? 0;

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? `${cfg.tab} shadow-sm`
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cfg.label}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ${
              isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  let displayStatus = status;
  if (status?.startsWith('denied:')) {
    displayStatus = 'denied';
  } else if (status === 'recommended') {
    displayStatus = 'recommended';
  } else if (status === 'reviewed') {
    displayStatus = 'reviewed';
  } else if (status === 'submitted') {
    displayStatus = 'submitted';
  }
  
  const cfg = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.submitted;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.badgeStyle}`}>
      {cfg.label}
    </span>
  );
}

function EmptyState({ statusFilter, hasFilters, onClear, mobile = false }) {
  return (
    <div className={`px-4 text-center ${mobile ? 'py-8' : 'py-12'}`}>
      <FileCheck2 className={`mx-auto text-gray-400 mb-3 ${mobile ? 'w-10 h-10' : 'w-12 h-12'}`} />
      <h3 className="text-sm font-medium text-gray-900">No reports found</h3>
      <p className="mt-1 text-xs text-gray-500">
        {hasFilters ? 'Try adjusting your filters or search terms.' : 'No reports available at this time.'}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
          Clear Filters
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Review({ reports, filters, statusCounts }) {
  const [search,        setSearch]         = useState(filters.search || "");
  const [sortBy,        setSortBy]         = useState(filters.sortBy || 'created_at');
  const [sortOrder,     setSortOrder]      = useState(filters.sortOrder || 'desc');
  const [statusFilter,  setStatusFilter]   = useState(filters.statusFilter || 'all');
  const [perPage,       setPerPage]        = useState(filters.perPage || 10);
  const [expandedReport, setExpandedReport] = useState(null);
  const [showModal,     setShowModal]      = useState(false);
  const [modalUrl,      setModalUrl]       = useState(null);
  const [loading,       setLoading]        = useState(false);
  const [showDenyModal, setShowDenyModal]  = useState(false);
  const [denyingReport, setDenyingReport]  = useState(null);
  const [denyReason,    setDenyReason]     = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningAction, setWarningAction]  = useState(null);
  const [warningReportId, setWarningReportId] = useState(null);

  const { auth } = usePage().props;
  const role = auth?.user?.role;
  const isStaff = role === 'staff';
  const isRpmo = role === 'rpmo';
  const canTakeAction = isStaff || isRpmo;

  const pushRouter = (overrides = {}) =>
    router.get(
      route("review-reports.index"),
      { search, sortBy, sortOrder, statusFilter, perPage, ...overrides },
      { preserveState: true, preserveScroll: false }
    );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => pushRouter(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setShowDenyModal(false);
        setShowWarningModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    pushRouter({ statusFilter: val, page: 1 });
  };

  const handlePerPage = (e) => {
    const val = e.target.value;
    setPerPage(val);
    pushRouter({ perPage: val, page: 1 });
  };

  const handleClear = () => {
    setSearch('');
    setStatusFilter('all');
    setPerPage(10);
    router.get(route('review-reports.index'), {}, { preserveState: true });
  };

  const handlePageChange = (link) => {
    if (!link.url) return;
    const pageNum = new URL(link.url).searchParams.get('page');
    if (pageNum) pushRouter({ page: pageNum });
  };

  const handleWarningClick = (action, reportId) => {
    setWarningAction(action);
    setWarningReportId(reportId);
    setShowWarningModal(true);
  };

  const confirmWarningAction = () => {
    if (warningAction === 'recommend') {
      router.post(route("review-reports.recommend", warningReportId));
    } else if (warningAction === 'reviewed') {
      router.post(route("review-reports.reviewed", warningReportId));
    }
    setShowWarningModal(false);
    setWarningAction(null);
    setWarningReportId(null);
  };

  const handleDenyClick = (reportId) => {
    setDenyingReport(reportId);
    setDenyReason("");
    setShowDenyModal(true);
  };

  const confirmDeny = () => {
    if (!denyReason.trim()) {
      alert("Please provide a denial reason");
      return;
    }
    router.post(route("review-reports.deny", denyingReport), {
      reason: denyReason,
    });
    setShowDenyModal(false);
    setDenyingReport(null);
    setDenyReason("");
  };

  const formatSubmissionDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const hasFilters = !!(search || statusFilter !== 'all');
  const data = reports?.data || [];
  const pagination = reports?.data ? reports : null;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Review Reports" />

      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileCheck2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Review Reports</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                  {isStaff && "Review and recommend quarterly report submissions"}
                  {isRpmo && "Review recommended quarterly reports"}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            {/* Status Tabs */}
            <StatusTabs statusFilter={statusFilter} statusCounts={statusCounts} onChange={handleStatusFilter} />

            {/* Search + Per Page */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search project, proponent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-8 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm w-fit">
                <select
                  value={perPage}
                  onChange={handlePerPage}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2"
                >
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
              <div className="flex">
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Clear filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            {data.length === 0 ? (
              <EmptyState statusFilter={statusFilter} hasFilters={hasFilters} onClear={handleClear} />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proponent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((report) => {
                    const isDenied = report.status?.startsWith('denied:');
                    
                    return (
                      <tr key={report.report_id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedReport(expandedReport === report.report_id ? null : report.report_id)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
                          >
                            <span className="line-clamp-2">{report.project.project_title}</span>
                            {expandedReport === report.report_id ? (
                              <ChevronUp className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 flex-shrink-0" />
                            )}
                          </button>

                          {expandedReport === report.report_id && (
                            <div className="mt-4 ml-4 p-4 bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-400 rounded space-y-2">
                              <div className="text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">Report ID:</span> {report.report_id}
                              </div>
                              {isDenied && (
                                <div className="text-sm text-red-800 bg-red-50 p-2 rounded border border-red-200">
                                  <span className="font-semibold">Denial Reason:</span>
                                  <p className="mt-1">{report.status.replace('denied: ', '')}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{report.project.proponent?.company_name || "—"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatSubmissionDate(report.created_at)}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={report.status} />
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center flex-wrap">
                            <button
                              onClick={() => {
                                setLoading(true);
                                setModalUrl(route("reports.view", report.report_id));
                                setShowModal(true);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-xs"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">View</span>
                            </button>

                            {canTakeAction && report.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => handleWarningClick('recommend', report.report_id)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium text-xs"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                  <span className="hidden sm:inline">Recommend</span>
                                </button>

                                <button
                                  onClick={() => handleDenyClick(report.report_id)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-xs"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span className="hidden sm:inline">Deny</span>
                                </button>
                              </>
                            )}

                            {canTakeAction && report.status?.startsWith('recommended') && (
                              <>
                                <button
                                  onClick={() => handleWarningClick('reviewed', report.report_id)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-xs"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="hidden sm:inline">Reviewed</span>
                                </button>

                                <button
                                  onClick={() => handleDenyClick(report.report_id)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-xs"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span className="hidden sm:inline">Deny</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <EmptyState statusFilter={statusFilter} hasFilters={hasFilters} onClear={handleClear} mobile />
            ) : (
              data.map((report) => {
                const isDenied = report.status?.startsWith('denied:');

                return (
                  <div key={report.report_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => setExpandedReport(expandedReport === report.report_id ? null : report.report_id)}
                          className="flex items-center gap-2 font-bold text-gray-900 hover:text-blue-600 transition"
                        >
                          <span className="text-sm line-clamp-2">{report.project.project_title}</span>
                          {expandedReport === report.report_id ? (
                            <ChevronUp className="w-5 h-5 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 flex-shrink-0" />
                          )}
                        </button>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{report.project.proponent?.company_name || "Unknown"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">Submitted:</span> {formatSubmissionDate(report.created_at)}
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    {expandedReport === report.report_id && (
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded space-y-2">
                        <div className="text-xs text-gray-700">
                          <span className="font-semibold">Report ID:</span> {report.report_id}
                        </div>
                        {isDenied && (
                          <div className="text-xs text-red-800 bg-red-50 p-2 rounded border border-red-200">
                            <span className="font-semibold">Denial Reason:</span>
                            <p className="mt-1">{report.status.replace('denied: ', '')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setLoading(true);
                        setModalUrl(route("reports.view", report.report_id));
                        setShowModal(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Report
                    </button>

                    {canTakeAction && report.status === 'submitted' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleWarningClick('recommend', report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium text-xs"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Recommend
                        </button>

                        <button
                          onClick={() => handleDenyClick(report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-xs"
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
                        </button>
                      </div>
                    )}

                    {canTakeAction && report.status?.startsWith('recommended') && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleWarningClick('reviewed', report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Reviewed
                        </button>

                        <button
                          onClick={() => handleDenyClick(report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-xs"
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.links && pagination.links.length > 3 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-medium">{pagination.from || 0}</span>–
                  <span className="font-medium">{pagination.to || 0}</span> of{' '}
                  <span className="font-medium">{pagination.total || 0}</span> reports
                </p>
                <div className="flex gap-1 overflow-x-auto">
                  {pagination.links.map((link, i) => (
                    <button
                      key={i}
                      disabled={!link.url}
                      onClick={() => handlePageChange(link)}
                      className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg border transition-all flex-shrink-0 ${
                        link.active
                          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                          : link.url
                          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
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

      {/* PDF Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl w-full h-[85vh] md:h-[90vh] shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300 z-50 transition"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-40">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-400 border-t-blue-500"></div>
              </div>
            )}

            <iframe
              src={modalUrl}
              className="w-full h-full"
              frameBorder="0"
              onLoad={() => setLoading(false)}
            />
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {warningAction === 'recommend' && "Are you sure you want to recommend this report?"}
                  {warningAction === 'reviewed' && "Are you sure you want to mark this report as reviewed?"}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">⚠️ Warning:</span> This action cannot be easily reversed.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setWarningAction(null);
                  setWarningReportId(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmWarningAction}
                className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition ${
                  warningAction === 'recommend' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Deny Report</h3>
                <p className="text-sm text-gray-600 mt-1">Please provide a reason for denial</p>
              </div>
            </div>

            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="Enter denial reason..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm resize-none"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDenyModal(false);
                  setDenyingReport(null);
                  setDenyReason("");
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeny}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
              >
                Deny Report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}