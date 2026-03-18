import React, { useState, useEffect } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import { Search, FileText, Calendar, ArrowUpDown, X, AlertCircle, CheckCircle, Send, Eye, ClipboardCheck, CheckCheck, List } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  all: {
    label:      'All',
    tab:        'bg-gray-700 text-white',
    badge:      'bg-white/25 text-white',
    badgeStyle: 'bg-gray-100 text-gray-700 border border-gray-200',
    icon:       List,
  },
  pending: {
    label:      'Pending',
    tab:        'bg-amber-500 text-white',
    badge:      'bg-white/25 text-white',
    badgeStyle: 'bg-amber-100 text-amber-800 border border-amber-200',
    icon:       AlertCircle,
  },
  recommended: {
    label:      'Recommended',
    tab:        'bg-blue-500 text-white',
    badge:      'bg-white/25 text-white',
    badgeStyle: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon:       Send,
  },
  approved: {
    label:      'Approved',
    tab:        'bg-green-500 text-white',
    badge:      'bg-white/25 text-white',
    badgeStyle: 'bg-green-100 text-green-800 border border-green-200',
    icon:       CheckCheck,
  },
};

const STATUS_KEYS = ['all', 'pending', 'recommended', 'approved'];

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
              isActive ? cfg.badge : 'bg-gray-100 text-gray-600'
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
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badgeStyle}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function EmptyState({ statusFilter, hasFilters, onClear, mobile = false }) {
  return (
    <div className={`text-center ${mobile ? 'py-8 px-4' : 'py-12'}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-medium text-gray-900 mb-1">
            {statusFilter === 'all' ? 'No projects found' : `No ${STATUS_CONFIG[statusFilter]?.label.toLowerCase()} projects`}
          </h3>
          <p className="text-gray-500 text-xs md:text-sm">
            {hasFilters ? 'Try adjusting your filters' : 'No projects available'}
          </p>
        </div>
        {hasFilters && (
          <button onClick={onClear} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Index({ projects, filters, years, statusCounts }) {
  const [search,       setSearch]       = useState(filters?.search       || '');
  const [year,         setYear]         = useState(filters?.year         || '');
  const [sortBy,       setSortBy]       = useState(filters?.sortBy       || 'project_id');
  const [sortOrder,    setSortOrder]    = useState(filters?.sortOrder    || 'desc');
  const [statusFilter, setStatusFilter] = useState(filters?.statusFilter || 'pending');
  const [perPage,      setPerPage]      = useState(filters?.perPage      || 10);

  const { flash } = usePage().props;

  const pushRouter = (overrides = {}) =>
    router.get(
      route('compliance.index'),
      { search, year, sortBy, sortOrder, statusFilter, perPage, ...overrides },
      { preserveState: true, preserveScroll: false }
    );

  // Debounce search + year
  useEffect(() => {
    const timer = setTimeout(() => pushRouter(), 400);
    return () => clearTimeout(timer);
  }, [search, year]);

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
    pushRouter({ sortBy: column, sortOrder: newOrder });
  };

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
    setYear('');
    setStatusFilter('all');
    setPerPage(10);
    router.get(route('compliance.index'), {}, { preserveState: true });
  };

  const handlePageChange = (link) => {
    if (!link.url) return;
    const pageNum = new URL(link.url).searchParams.get('page');
    if (pageNum) pushRouter({ page: pageNum });
  };

  const getSortIcon = (column) => (
    <ArrowUpDown className={`w-3 h-3 ${sortBy === column ? 'text-blue-600' : 'text-gray-400'}`} />
  );

  const hasFilters = !!(search || year || statusFilter !== 'all');
  const data       = projects?.data || [];
  const pagination = projects?.data ? projects : null;

  return (
    <main className="flex-1 min-h-screen overflow-y-auto">
      <Head title="Compliance Review" />

      <div className="max-w-7xl mx-auto p-3 md:p-6">

        {/* Flash Messages */}
        {flash?.success && (
          <div className="mb-3 md:mb-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg md:rounded-xl flex items-center gap-2 text-xs md:text-sm text-green-800">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-3 md:mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg md:rounded-xl flex items-center gap-2 text-xs md:text-sm text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {flash.error}
          </div>
        )}

        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Compliance</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">Manage and track compliance</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            {/* Status Tabs */}
            <StatusTabs statusFilter={statusFilter} statusCounts={statusCounts} onChange={handleStatusFilter} />

            {/* Search + Year + Per Page + Clear */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search project or proponent..."
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

              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm w-fit">
                <select
                  value={perPage}
                  onChange={handlePerPage}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
                >
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>

              {hasFilters && (
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden md:inline">Clear filters</span>
                </button>
              )}
            </div>

            {/* Result summary */}
            {pagination && (
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-900">{pagination.from || 0}</span>–
                <span className="font-semibold text-gray-900">{pagination.to || 0}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total || 0}</span> project{pagination.total !== 1 ? 's' : ''}
                {statusFilter !== 'all' && <span className="ml-1">· {STATUS_CONFIG[statusFilter]?.label}</span>}
              </p>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            {data.length === 0 ? (
              <EmptyState statusFilter={statusFilter} hasFilters={hasFilters} onClear={handleClear} />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <button onClick={() => handleSort('project_title')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <FileText className="w-4 h-4" />
                        Project
                        {getSortIcon('project_title')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proponent</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <button onClick={() => handleSort('year_obligated')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <Calendar className="w-4 h-4" />
                        Year
                        {getSortIcon('year_obligated')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Links</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((project, index) => {
                    const compliance  = project.compliance;
                    const filledLinks = compliance ? ['pp_link', 'fs_link'].filter(k => compliance[k]).length : 0;
                    const status      = compliance?.status || 'pending';

                    return (
                      <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200">
                        <td className="px-4 py-4 text-sm text-gray-400 font-medium">
                          {pagination ? pagination.from + index : index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-xs">
                          <span className="line-clamp-1">{project.project_title}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{project.company?.company_name || '—'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.year_obligated || '—'}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                          {filledLinks}<span className="text-gray-400">/2</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <StatusBadge status={status} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <a
                              href={route('compliance.show', project.project_id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
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
              data.map((project, index) => {
                const compliance  = project.compliance;
                const filledLinks = compliance ? ['pp_link', 'fs_link'].filter(k => compliance[k]).length : 0;
                const status      = compliance?.status || 'pending';

                return (
                  <div key={project.project_id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">
                          #{pagination ? pagination.from + index : index + 1}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{project.project_title}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{project.company?.company_name || 'No company'}</p>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-500 block font-medium">Year</span>
                        <p className="font-medium text-gray-900 mt-0.5">{project.year_obligated || '—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-500 block font-medium">Links</span>
                        <p className="font-medium text-gray-900 mt-0.5">{filledLinks}<span className="text-gray-400">/2</span></p>
                      </div>
                    </div>

                    <a
                      href={route('compliance.show', project.project_id)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg transition-all mt-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </a>
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
                  <span className="font-medium">{pagination.total || 0}</span> projects
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
    </main>
  );
}