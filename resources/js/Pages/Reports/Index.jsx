import { Link, router, Head, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Search, PlusCircle, Building2, X, ChevronDown, ChevronUp, AlertTriangle, FileClock } from 'lucide-react';

function formatReportDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);

  const options = { year: "numeric", month: "long", day: "numeric" };
  const formatted = date.toLocaleDateString("en-US", options);

  const month = date.getMonth() + 1; // 1-based
  let quarter = "Q1";
  if (month >= 4 && month <= 6) quarter = "Q2";
  else if (month >= 7 && month <= 9) quarter = "Q3";
  else if (month >= 10 && month <= 12) quarter = "Q4";

  return `Submitted @ ${formatted} - ${quarter}`;
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'reviewed':
      return 'bg-blue-100 text-blue-800';
    case 'recommended':
      return 'bg-green-100 text-green-800';
    case 'submitted':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function canDeleteReport(status) {
  const restrictedStatuses = ['reviewed', 'recommended'];
  return !restrictedStatuses.includes(status?.toLowerCase());
}

export default function Index({ projects, filters }) {
  const [search, setSearch] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalUrl, setModalUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const { auth } = usePage().props;
  const role = auth?.user?.role;

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(route("reports.index"), { search, perPage }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search, perPage]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setShowDeleteModal(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleDeleteClick = (reportId) => {
    setReportToDelete(reportId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (reportToDelete) {
      router.delete(route("reports.destroy", reportToDelete));
      setShowDeleteModal(false);
      setReportToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Reports" />
      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gray-50 p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                <FileClock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Quarterly Reports</h2>
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
                  placeholder="Search company or project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">entries</span>
              </div>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Title</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Reports</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.data.map((project) => (
                  <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                    {/* Project clickable */}
                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm font-semibold text-gray-900">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === project.project_id ? null : project.project_id)}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        {project.project_title}
                        {openDropdown === project.project_id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {/* Dropdown reports */}
                      {openDropdown === project.project_id && (
                        <div className="mt-3 ml-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-3 min-w-[550px]">
                          {project.reports && project.reports.length > 0 ? (
                            project.reports.map((report, index) => (
                              <div
                                key={report.report_id}
                                className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
                              >
                                {/* Header Row */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                      <span className="text-xs font-semibold text-blue-600">#{index + 1}</span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">Report Submission</p>
                                      <p className="text-xs text-gray-500">{formatReportDate(report.created_at)}</p>
                                    </div>
                                  </div>
                                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${getStatusColor(report.status)}`}>
                                    {report.status || 'submitted'}
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  {/* View */}
                                  <button
                                    onClick={() => {
                                      setLoading(true);
                                      setModalUrl(route("reports.view", report.report_id));
                                      setShowModal(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-xs font-semibold"
                                  >
                                    👁️ View
                                  </button>

                                  {/* Download */}
                                  <a
                                    href={route("reports.download", report.report_id)}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-xs font-semibold"
                                  >
                                    ⬇️ Download
                                  </a>

                                  {/* Delete - Conditional */}
                                  {canDeleteReport(report.status) && (
                                    <button
                                      onClick={() => handleDeleteClick(report.report_id)}
                                      className="flex-1 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-xs font-semibold"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-sm text-gray-500">No reports submitted yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-700">
                      {project.company?.company_name || "No company"}
                    </td>

                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      {project.reports?.length || 0}
                    </td>

                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <Link
                        href={route("reports.create", project.project_id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-medium shadow text-xs md:text-sm"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Create Report</span>
                        <span className="sm:hidden">Create</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {projects.data.map((project) => (
              <div key={project.project_id} className="p-3 space-y-3">
                {/* Project Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{project.project_title}</h3>
                    <p className="text-xs text-gray-600">{project.company?.company_name || "No company"}</p>
                  </div>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === project.project_id ? null : project.project_id)}
                    className="flex-shrink-0 p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    {openDropdown === project.project_id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Reports Count */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                  <span className="text-xs text-gray-600">Total Reports</span>
                  <span className="text-sm font-semibold text-gray-900">{project.reports?.length || 0}</span>
                </div>

                {/* Create Report Button */}
                <Link
                  href={route("reports.create", project.project_id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-medium text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Report
                </Link>

                {/* Expanded Reports List */}
                {openDropdown === project.project_id && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2.5">
                    {project.reports && project.reports.length > 0 ? (
                      project.reports.map((report, index) => (
                        <div key={report.report_id} className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-3 space-y-2.5 hover:shadow-md transition-all duration-200">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
                                <span className="text-xs font-semibold text-blue-600">#{index + 1}</span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">Report #{index + 1}</p>
                                <p className="text-xs text-gray-500">{formatReportDate(report.created_at)}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                              {report.status || 'submitted'}
                            </span>
                          </div>
                          
                          {/* Buttons */}
                          <div className="flex gap-1.5">
                            {/* View */}
                            <button
                              onClick={() => {
                                setLoading(true);
                                setModalUrl(route("reports.view", report.report_id));
                                setShowModal(true);
                              }}
                              className="flex-1 px-2 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold hover:bg-green-100 transition"
                            >
                              👁️
                            </button>

                            {/* Download */}
                            <a
                              href={route("reports.download", report.report_id)}
                              className="flex-1 px-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 transition"
                            >
                              ⬇️
                            </a>

                            {/* Delete - Conditional */}
                            {canDeleteReport(report.status) && (
                              <button
                                onClick={() => handleDeleteClick(report.report_id)}
                                className="flex-1 px-2 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-4">No reports submitted yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {projects.data.length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No projects found</h3>
              <p className="text-xs md:text-sm text-gray-500">Nothing to display, try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {projects.links && projects.links.length > 1 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {projects.from || 1} to {projects.to || projects.data.length} of{" "}
                  {projects.total || projects.data.length} results
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {projects.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        link.active
                          ? "bg-blue-500 text-white border-transparent shadow-md"
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

      {/* View PDF Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg md:rounded-xl w-full h-[85vh] md:h-[90vh] shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 md:top-3 right-2 md:right-3 p-1.5 md:p-2 bg-gray-200 rounded-full hover:bg-gray-300 z-50 transition"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            </button>

            {/* Loading Spinner */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-40">
                <div className="animate-spin rounded-full h-8 md:h-10 w-8 md:w-10 border-4 border-gray-400 border-t-transparent"></div>
              </div>
            )}

            {/* PDF */}
            <iframe
              src={modalUrl}
              className="w-full h-full"
              frameBorder="0"
              onLoad={() => setLoading(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Delete Report
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3">
                  Are you sure you want to delete this report? This action will permanently remove it from the system.
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm md:text-base"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}