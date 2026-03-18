import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, ExternalLink, FileText, Calendar, User, Search, X, Building2, Clock, ArrowUp, ArrowDown, Stamp } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  all: {
    label:      'All',
    tab:        'bg-gray-700 text-white',
    badge:      'bg-white/25 text-white',
    pillStyle:  'bg-gray-100 text-gray-700 border border-gray-200',
    icon:       Clock,
  },
  pending: {
    label:      'Pending',
    tab:        'bg-amber-500 text-white',
    badge:      'bg-white/25 text-white',
    pillStyle:  'bg-yellow-100 text-yellow-800 border border-yellow-200',
    icon:       Clock,
  },
  raised: {
    label:      'Recommended',
    tab:        'bg-blue-500 text-white',
    badge:      'bg-white/25 text-white',
    pillStyle:  'bg-blue-100 text-blue-800 border border-blue-200',
    icon:       FileText,
  },
  approved: {
    label:      'Approved',
    tab:        'bg-green-500 text-white',
    badge:      'bg-white/25 text-white',
    pillStyle:  'bg-green-100 text-green-800 border border-green-200',
    icon:       CheckCircle,
  },
};

const STATUS_KEYS = ['all', 'pending', 'raised', 'approved'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTabs({ statusFilter, counts, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {STATUS_KEYS.map((key) => {
        const cfg      = STATUS_CONFIG[key];
        const isActive = statusFilter === key;
        const count    = counts?.[key] ?? 0;

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

function StatusPill({ status }) {
  const cfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.pillStyle}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VerifyRestructureList({ applyRestructs, auth, offices, filters: initialFilters, statusCounts }) {
  const userRole = auth?.user?.role;

  const [search,       setSearch]       = useState(initialFilters?.search       || '');
  const [perPage,      setPerPage]      = useState(initialFilters?.perPage      || 10);
  const [officeFilter, setOfficeFilter] = useState(initialFilters?.officeFilter || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters?.statusFilter || 'all');
  const [sortBy,       setSortBy]       = useState(initialFilters?.sortBy       || 'desc');

  const pushRouter = (overrides = {}) =>
    router.get(
      '/verify-restructure',
      { search, perPage, officeFilter, statusFilter, sortBy, ...overrides },
      { preserveState: true, replace: true }
    );

  // Debounce search + office
  useEffect(() => {
    const timer = setTimeout(() => pushRouter(), 500);
    return () => clearTimeout(timer);
  }, [search, officeFilter]);

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    pushRouter({ statusFilter: val, page: 1 });
  };

  const handlePerPage = (e) => {
    const val = e.target.value;
    setPerPage(val);
    pushRouter({ perPage: val, page: 1 });
  };

  const handleSortToggle = () => {
    const val = sortBy === 'desc' ? 'asc' : 'desc';
    setSortBy(val);
    pushRouter({ sortBy: val });
  };

  const handleClearFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setStatusFilter('all');
    setSortBy('desc');
    router.get('/verify-restructure', { perPage }, { preserveState: true });
  };

  const handlePageChange = (link) => {
    if (!link.url) return;
    const pageNum = new URL(link.url).searchParams.get('page');
    if (pageNum) pushRouter({ page: pageNum });
  };

  const hasActiveFilters = !!(search || officeFilter || statusFilter !== 'all');
  const data             = applyRestructs?.data || [];
  const paginationData   = applyRestructs?.data ? applyRestructs : null;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Verify Restructuring" />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gray-50 p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Stamp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Verify Restructuring Applications</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review and verify project restructuring requests</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            {/* Status Tabs */}
            <StatusTabs statusFilter={statusFilter} counts={statusCounts} onChange={handleStatusFilter} />

            {/* Search + Per Page */}
            <div className="flex flex-col gap-2 md:gap-4 md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search project or proponent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm w-fit">
                <select value={perPage} onChange={handlePerPage}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2">
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>
            </div>

            {/* Office + Sort + Clear */}
            <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center flex-wrap">
              {offices && offices.length > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-1 md:flex-initial md:min-w-[200px]">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5">
                    <option value="">All Offices</option>
                    {offices.map((office) => (
                      <option key={office.office_id} value={office.office_id}>{office.office_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button onClick={handleSortToggle}
                className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-gray-300 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-xs md:text-sm"
                title={sortBy === 'desc' ? 'Newest first' : 'Oldest first'}>
                {sortBy === 'desc' ? <ArrowDown className="w-4 h-4 text-gray-600" /> : <ArrowUp className="w-4 h-4 text-gray-600" />}
                <span className="hidden md:inline font-medium text-gray-700">{sortBy === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>

              {hasActiveFilters && (
                <button onClick={handleClearFilters}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium">
                  <X className="w-4 h-4" />
                  <span className="hidden md:inline">Clear Filters</span>
                </button>
              )}
            </div>

            {/* Result count */}
            {paginationData && (
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-900">{paginationData.from || 0}</span>–
                <span className="font-semibold text-gray-900">{paginationData.to || 0}</span> of{' '}
                <span className="font-semibold text-gray-900">{paginationData.total || 0}</span> results
                {statusFilter !== 'all' && <span className="ml-1">· {STATUS_CONFIG[statusFilter]?.label}</span>}
              </p>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            {data.length === 0 ? (
              <EmptyState hasActiveFilters={hasActiveFilters} statusFilter={statusFilter} onClear={handleClearFilters} />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2"><FileText className="w-4 h-4" />Project</div>
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4" />Office</div>
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2"><User className="w-4 h-4" />Added By</div>
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Date Submitted</div>
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Documents</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((item, index) => (
                    <tr key={item.apply_id} className="hover:bg-blue-50/30 transition-all duration-200">
                      <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-400">
                        {paginationData ? paginationData.from + index : index + 1}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-1">{item.project?.project_title || '-'}</div>
                        <div className="text-xs text-gray-500">{item.project?.company?.company_name || 'No company'}</div>
                        <div className="text-xs text-gray-400">ID: {item.project_id}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                        {item.project?.company?.office?.office_name || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                        {item.added_by?.name || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                        {item.created_at ? new Date(item.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <StatusPill status={item.restructure?.status || 'pending'} />
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex flex-wrap gap-2">
                          {item.proponent && <DocLink href={item.proponent} label="Proponent" color="blue" />}
                          {item.psto     && <DocLink href={item.psto}      label="PSTO"      color="green" />}
                          {item.annexc   && <DocLink href={item.annexc}    label="Annex C"   color="purple" />}
                          {item.annexd   && <DocLink href={item.annexd}    label="Annex D"   color="orange" />}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        {(userRole === 'rpmo' || userRole === 'rd') ? (
                          <Link href={`/verify-restructure/${item.apply_id}`}
                            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />Verify
                          </Link>
                        ) : (
                          <span className="inline-flex items-center px-2 md:px-3 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">RPMO/RD</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {data.length === 0 ? (
              <EmptyState hasActiveFilters={hasActiveFilters} statusFilter={statusFilter} onClear={handleClearFilters} mobile />
            ) : (
              data.map((item, index) => (
                <div key={item.apply_id} className="p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400">#{paginationData ? paginationData.from + index : index + 1}</div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.project?.project_title || '-'}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{item.project?.company?.company_name || 'No company'}</p>
                    </div>
                    <StatusPill status={item.restructure?.status || 'pending'} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500">Office</span>
                      <p className="font-medium text-gray-900 truncate mt-0.5">{item.project?.company?.office?.office_name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500">Added By</span>
                      <p className="font-medium text-gray-900 truncate mt-0.5">{item.added_by?.name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 col-span-2">
                      <span className="text-gray-500">Date Submitted</span>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>

                  {(item.proponent || item.psto || item.annexc || item.annexd) && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.proponent && <DocLink href={item.proponent} label="Proponent" color="blue"   small />}
                      {item.psto      && <DocLink href={item.psto}      label="PSTO"      color="green"  small />}
                      {item.annexc    && <DocLink href={item.annexc}    label="Annex C"   color="purple" small />}
                      {item.annexd    && <DocLink href={item.annexd}    label="Annex D"   color="orange" small />}
                    </div>
                  )}

                  {(userRole === 'rpmo' || userRole === 'rd') ? (
                    <Link href={`/verify-restructure/${item.apply_id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                      <CheckCircle className="w-4 h-4" />Verify Application
                    </Link>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">RPMO/RD Only</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {paginationData && paginationData.links && paginationData.links.length > 3 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-medium">{paginationData.from || 0}</span>–
                  <span className="font-medium">{paginationData.to || 0}</span> of{' '}
                  <span className="font-medium">{paginationData.total || 0}</span> results
                </p>
                <div className="flex gap-1 overflow-x-auto">
                  {paginationData.links.map((link, index) => {
                    const pageNum = link.url ? new URL(link.url).searchParams.get('page') : null;
                    return (
                      <button
                        key={index}
                        disabled={!link.url}
                        onClick={() => handlePageChange(link)}
                        className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all flex-shrink-0 ${
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
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_COLORS = {
  blue:   'text-blue-700 bg-blue-100 hover:bg-blue-200',
  green:  'text-green-700 bg-green-100 hover:bg-green-200',
  purple: 'text-purple-700 bg-purple-100 hover:bg-purple-200',
  orange: 'text-orange-700 bg-orange-100 hover:bg-orange-200',
};

function DocLink({ href, label, color, small = false }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className={`inline-flex items-center gap-1 font-medium rounded transition-colors ${DOC_COLORS[color]} ${small ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs'}`}>
      <ExternalLink className="w-3 h-3" />{label}
    </a>
  );
}

function EmptyState({ hasActiveFilters, statusFilter, onClear, mobile = false }) {
  return (
    <div className={`text-center ${mobile ? 'p-8' : 'px-6 py-12'}`}>
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="text-gray-900 font-medium text-sm md:text-base mb-1">
            {statusFilter !== 'all' ? `No ${STATUS_CONFIG[statusFilter]?.label.toLowerCase()} applications` : 'No applications found'}
          </p>
          <p className="text-gray-500 text-xs md:text-sm">
            {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'No restructuring applications to verify'}
          </p>
        </div>
        {hasActiveFilters && (
          <button onClick={onClear} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}