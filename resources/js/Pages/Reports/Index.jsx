import { Link, router, Head, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import {
  Search, PlusCircle, X, ChevronDown, ChevronUp,
  AlertTriangle, FileClock, ArrowUpDown, Calendar,
  Building2, Eye, Download, Trash2, List, Clock,
  CheckCircle, ThumbsUp, XCircle,
} from 'lucide-react';
import { cleanParams } from '@/utils/cleanParams';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatReportDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formatted = date.toLocaleDateString("en-US", options);
  const month = date.getMonth() + 1;
  let quarter = "Q1";
  if (month >= 4 && month <= 6) quarter = "Q2";
  else if (month >= 7 && month <= 9) quarter = "Q3";
  else if (month >= 10 && month <= 12) quarter = "Q4";
  return `${formatted} · ${quarter}`;
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'reviewed':   return 'bg-green-100 text-green-800 border border-green-200';
    case 'recommended':return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'submitted':  return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'rejected':   return 'bg-red-100 text-red-800 border border-red-200';
    default:           return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}

function getStatusIcon(status) {
  switch (status?.toLowerCase()) {
    case 'reviewed':    return <CheckCircle className="w-3 h-3" />;
    case 'recommended': return <ThumbsUp className="w-3 h-3" />;
    case 'submitted':   return <Clock className="w-3 h-3" />;
    case 'rejected':    return <XCircle className="w-3 h-3" />;
    default:            return <Clock className="w-3 h-3" />;
  }
}

function canDeleteReport(status) {
  return !['reviewed', 'recommended'].includes(status?.toLowerCase());
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status || 'submitted'}
    </span>
  );
}

function SortButton({ column, label, icon: Icon, sortBy, sortOrder, onSort }) {
  const active = sortBy === column;
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors group"
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      <ArrowUpDown className={`w-3 h-3 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-400'}`} />
    </button>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <FileClock className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-medium text-gray-900 mb-1">No projects found</h3>
          <p className="text-gray-500 text-xs md:text-sm">
            {hasFilters ? 'Try adjusting your filters' : 'No projects available'}
          </p>
        </div>
        {hasFilters && (
          <button
            onClick={onClear}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Index({ projects, filters, offices, years }) {
  const [search,     setSearch]     = useState(filters?.search     || "");
  const [perPage,    setPerPage]    = useState(filters?.perPage    || 10);
  const [office,     setOffice]     = useState(filters?.office     || "");
  const [year,       setYear]       = useState(filters?.year       || "");
  const [sortBy,     setSortBy]     = useState(filters?.sortBy     || "project_id");
  const [sortOrder,  setSortOrder]  = useState(filters?.sortOrder  || "desc");
  const [page,       setPage]       = useState(parseInt(filters?.page || 1)); // CRITICAL: Add page state
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [modalUrl,     setModalUrl]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete,  setReportToDelete]  = useState(null);
  
  const filterTimeoutRef = useRef(null);
  const isMountedRef = useRef(false);

  const { auth } = usePage().props;

  const pushRouter = (overrides = {}) => {
    router.get(
      route("reports.index"),
      cleanParams(
        { search, perPage, office, year, sortBy, sortOrder, page, ...overrides },
        { sortBy: 'project_id', sortOrder: 'desc', perPage: 10 }
      ),
      { preserveState: true, preserveScroll: true, replace: true }
    );
  };


useEffect(() => {
  const timer = setTimeout(() => { isMountedRef.current = true; }, 0);
  return () => clearTimeout(timer);
}, []);

// Debounced search
useEffect(() => {
  if (!isMountedRef.current) return;
  if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
  filterTimeoutRef.current = setTimeout(() => {
    setPage(1);
    pushRouter({ page: 1 });
  }, 400);
  return () => { if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current); };
}, [search]);

// Immediate filters (office, year, perPage) - resets to page 1
useEffect(() => {
  if (!isMountedRef.current) return;
  setPage(1);
  pushRouter({ page: 1 });
}, [perPage, office, year]);
  // Escape key
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

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
    setPage(1); // Reset to page 1 on sort
    pushRouter({ sortBy: column, sortOrder: newOrder, page: 1 });
  };

  const handleClear = () => {
    setSearch('');
    setOffice('');
    setYear('');
    setPerPage(10);
    setSortBy('project_id');
    setSortOrder('desc');
    setPage(1);
    router.get(route("reports.index"), {}, { preserveState: true });
  };

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

  const hasFilters = !!(search || office || year || perPage !== 10);
  const data       = projects?.data || [];
  const pagination = projects;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Reports" />
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileClock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Quarterly Reports</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage and track submitted project reports</p>
              </div>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            {/* Row 1: Search + Per Page */}
            <div className="flex gap-2 flex-col md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search project or proponent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-8 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Per page */}
              <div className="flex items-center gap-1.5 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-shrink-0">
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(e.target.value)}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2"
                >
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>
            </div>

            {/* Row 2: Office + Year + Clear */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Office filter */}
              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
                >
                  <option value="">All Offices</option>
                  {offices && offices.map((o) => (
                    <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                  ))}
                </select>
              </div>

              {/* Year filter */}
              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
                >
                  <option value="">All Years</option>
                  {years && years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block overflow-x-auto">
            {data.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={handleClear} />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortButton column="project_id" label="PROJECT CODE" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortButton column="project_title" label="PROJECT TITLE" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortButton column="company_name" label="PROPONENT" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Office</th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Reports</th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((project, index) => (
                    <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200">
                      {/* Project ID */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-black px-2 py-0.5 rounded">
                          {project.project_id}
                        </span>
                      </td>

                      {/* Project Title — clickable to expand reports */}
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 max-w-xs">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === project.project_id ? null : project.project_id)}
                          className="flex items-center gap-1.5 text-left text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          <span className="line-clamp-2">{project.project_title}</span>
                          {openDropdown === project.project_id
                            ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />
                            : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>

                        {/* Expanded reports dropdown */}
                        {openDropdown === project.project_id && (
                          <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2.5 min-w-[540px] z-10 relative">
                            {project.reports && project.reports.length > 0 ? (
                              project.reports.map((report, i) => (
                                <div
                                  key={report.report_id}
                                  className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all"
                                >
                                  <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100">
                                        <span className="text-xs font-bold text-blue-600">#{i + 1}</span>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-gray-900">Report Submission</p>
                                        <p className="text-xs text-gray-500">{formatReportDate(report.created_at)}</p>
                                      </div>
                                    </div>
                                    <StatusBadge status={report.status} />
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => { setLoading(true); setModalUrl(route("reports.view", report.report_id)); setShowModal(true); }}
                                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-xs font-semibold"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                    <a
                                      href={route("reports.download", report.report_id)}
                                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-xs font-semibold"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download
                                    </a>
                                    {canDeleteReport(report.status) && (
                                      <button
                                        onClick={() => handleDeleteClick(report.report_id)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition text-xs font-semibold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-5">
                                <p className="text-xs text-gray-500">No reports submitted yet</p>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Proponent */}
                      <td className="px-4 py-3.5 text-sm text-gray-700">
                        {project.proponent?.company_name || <span className="text-gray-400">—</span>}
                      </td>

                      {/* Office */}
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {project.proponent?.office?.office_name || <span className="text-gray-400">—</span>}
                      </td>

                      {/* Reports count */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${
                          (project.reports?.length || 0) > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {project.reports?.length || 0}
                        </span>
                      </td>

                      {/* Create Report */}
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={route("reports.create", project.project_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium shadow-sm text-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Create Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Mobile Card View ── */}
          <div className="md:hidden divide-y divide-gray-100">
            {data.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={handleClear} mobile />
            ) : (
              data.map((project, index) => (
                <div key={project.project_id} className="p-3 space-y-2.5">
                  {/* Header */}
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {project.project_id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{project.project_title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{project.proponent?.company_name || "No proponent"}</p>
                      {project.proponent?.office?.office_name && (
                        <p className="text-xs text-gray-400">{project.proponent.office.office_name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === project.project_id ? null : project.project_id)}
                      className="flex-shrink-0 p-1 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                      {openDropdown === project.project_id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-2">
                    <span className="text-xs text-gray-500">Total Reports</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      (project.reports?.length || 0) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {project.reports?.length || 0}
                    </span>
                  </div>

                  {/* Create button */}
                  <Link
                    href={route("reports.create", project.project_id)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium text-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create Report
                  </Link>

                  {/* Expanded reports */}
                  {openDropdown === project.project_id && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                      {project.reports && project.reports.length > 0 ? (
                        project.reports.map((report, i) => (
                          <div key={report.report_id} className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
                                  <span className="text-xs font-bold text-blue-600">#{i + 1}</span>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-900">Report #{i + 1}</p>
                                  <p className="text-xs text-gray-500">{formatReportDate(report.created_at)}</p>
                                </div>
                              </div>
                              <StatusBadge status={report.status} />
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => { setLoading(true); setModalUrl(route("reports.view", report.report_id)); setShowModal(true); }}
                                className="flex-1 inline-flex items-center justify-center py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold hover:bg-green-100 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={route("reports.download", report.report_id)}
                                className="flex-1 inline-flex items-center justify-center py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              {canDeleteReport(report.status) && (
                                <button
                                  onClick={() => handleDeleteClick(report.report_id)}
                                  className="flex-1 inline-flex items-center justify-center py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {pagination && pagination.links && pagination.links.length > 1 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-medium">{pagination.from || 0}</span>–
                  <span className="font-medium">{pagination.to || 0}</span> of{' '}
                  <span className="font-medium">{pagination.total || 0}</span> projects
                </p>
                <div className="flex gap-1 overflow-x-auto">
                  {pagination.links.map((link, i) => {
                    const handlePageClick = (e) => {
                      e.preventDefault();
                      if (!link.url) return;
                      
                      // Extract page number from the link URL
                      const linkUrl = new URL(link.url);
                      const pageNum = linkUrl.searchParams.get('page');
                      
                      if (pageNum) {
                        setPage(parseInt(pageNum)); // CRITICAL: Update page state
                        pushRouter({ page: pageNum });
                      }
                    };

                    return (
                      <button
                        key={i}
                        disabled={!link.url}
                        onClick={handlePageClick}
                        className={`px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all flex-shrink-0 ${
                          link.active
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                            : link.url
                            ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PDF Viewer Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg md:rounded-xl w-full h-[85vh] md:h-[90vh] shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 md:top-3 right-2 md:right-3 p-1.5 md:p-2 bg-gray-200 rounded-full hover:bg-gray-300 z-50 transition"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            </button>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-40">
                <div className="animate-spin rounded-full h-8 md:h-10 w-8 md:w-10 border-4 border-gray-300 border-t-blue-500" />
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

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Delete Report</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  Are you sure you want to delete this report? This will permanently remove it from the system.
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm"
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