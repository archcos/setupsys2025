import { Link, router, Head, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Eye, AlertTriangle, ChevronDown, ChevronUp, Clock, Building2, X, ThumbsUp, FileCheck2 } from 'lucide-react';

function formatSubmissionDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formatted = date.toLocaleDateString("en-US", options);
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${formatted} at ${time}`;
}

function getStatusDisplay(status) {
  if (status === 'submitted') return 'Pending Review';
  if (status === 'recommended') return 'Recommended';
  if (status === 'reviewed') return 'Reviewed';
  if (status?.startsWith('denied:')) {
    const reason = status.replace('denied:', '').trim();
    return { type: 'denied', reason };
  }
  return status;
}

export default function Review({ reports, filters }) {
  const [search, setSearch] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [expandedReport, setExpandedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalUrl, setModalUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyingReport, setDenyingReport] = useState(null);
  const [denyReason, setDenyReason] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningAction, setWarningAction] = useState(null);
  const [warningReportId, setWarningReportId] = useState(null);

  const { auth } = usePage().props;
  const role = auth?.user?.role;
  const isStaff = role === 'staff';
  const isRpmo = role === 'rpmo';
  const canTakeAction = isStaff || isRpmo;

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(route("review-reports.index"), { search, perPage }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search, perPage]);

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

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Review Reports" />
      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gray-50 p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                <FileCheck2 className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Review Reports</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  {isStaff && "Review and recommend quarterly report submissions"}
                  {isRpmo && "Review recommended quarterly reports"}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by project or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Per Page */}
              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm w-fit">
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(e.target.value)}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">per page</span>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reports.data.map((report) => {
                  const statusDisplay = getStatusDisplay(report.status);
                  const isDenied = typeof statusDisplay === 'object' && statusDisplay.type === 'denied';
                  
                  return (
                    <tr key={report.report_id} className="hover:bg-amber-50/40 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedReport(expandedReport === report.report_id ? null : report.report_id)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
                        >
                          {report.project.project_title}
                          {expandedReport === report.report_id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
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
                                <p className="mt-1">{statusDisplay.reason}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {report.project.company?.company_name || "Unknown"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-600">
                          {formatSubmissionDate(report.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => {
                              setLoading(true);
                              setModalUrl(route("reports.view", report.report_id));
                              setShowModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm shadow-md hover:shadow-lg"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>

                          {canTakeAction && report.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleWarningClick('recommend', report.report_id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-md hover:shadow-lg"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span className="hidden sm:inline">Recommend</span>
                              </button>

                              <button
                                onClick={() => handleDenyClick(report.report_id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm shadow-md hover:shadow-lg"
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm shadow-md hover:shadow-lg"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">Reviewed</span>
                              </button>

                              <button
                                onClick={() => handleDenyClick(report.report_id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm shadow-md hover:shadow-lg"
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {reports.data.map((report) => {
              const statusDisplay = getStatusDisplay(report.status);
              const isDenied = typeof statusDisplay === 'object' && statusDisplay.type === 'denied';

              return (
                <div key={report.report_id} className="p-4 space-y-4 bg-white">
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
                        <Building2 className="w-3 h-3" />
                        {report.project.company?.company_name || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-900">Submitted:</span> {formatSubmissionDate(report.created_at)}
                  </div>

                  {expandedReport === report.report_id && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded space-y-2">
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">Report ID:</span> {report.report_id}
                      </div>
                      {isDenied && (
                        <div className="text-xs text-red-800 bg-red-50 p-2 rounded border border-red-200">
                          <span className="font-semibold">Denial Reason:</span>
                          <p className="mt-1">{statusDisplay.reason}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {canTakeAction && report.status === 'submitted' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setLoading(true);
                          setModalUrl(route("reports.view", report.report_id));
                          setShowModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Report
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleWarningClick('recommend', report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Recommend
                        </button>

                        <button
                          onClick={() => handleDenyClick(report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
                        </button>
                      </div>
                    </div>
                  )}

                  {canTakeAction && report.status?.startsWith('recommended') && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setLoading(true);
                          setModalUrl(route("reports.view", report.report_id));
                          setShowModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Report
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleWarningClick('reviewed', report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Reviewed
                        </button>

                        <button
                          onClick={() => handleDenyClick(report.report_id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Deny
                        </button>
                      </div>
                    </div>
                  )}

                  {!canTakeAction && (
                    <button
                      onClick={() => {
                        setLoading(true);
                        setModalUrl(route("reports.view", report.report_id));
                        setShowModal(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Report
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {reports.data.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Reports</h3>
              <p className="text-sm text-gray-600">There are no reports at this time.</p>
            </div>
          )}

          {/* Pagination */}
          {reports.links && reports.links.length > 1 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {reports.from || 1} to {reports.to || reports.data.length} of {reports.total || reports.data.length} results
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {reports.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        link.active
                          ? "bg-orange-500 text-white border-transparent shadow-md"
                          : link.url
                          ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {link.label === "&laquo; Previous" ? "←" : link.label === "Next &raquo;" ? "→" : link.label}
                    </button>
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
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-400 border-t-orange-500"></div>
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