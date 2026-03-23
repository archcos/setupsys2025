import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { Search, ClipboardList, Building2, Eye, CheckCircle, Clock, AlertTriangle, X, ArrowUpDown, Hammer, List } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  all: {
    label:     'All',
    tab:       'bg-gray-700 text-white',
    badge:     'bg-white/25 text-white',
    pillStyle: 'bg-gray-100 text-gray-700 border border-gray-200',
    icon:      List,
  },
  pending: {
    label:     'Pending',
    tab:       'bg-amber-500 text-white',
    badge:     'bg-white/25 text-white',
    pillStyle: 'bg-amber-100 text-amber-800 border border-amber-200',
    icon:      AlertTriangle,
  },
  complete: {
    label:     'Complete',
    tab:       'bg-green-500 text-white',
    badge:     'bg-white/25 text-white',
    pillStyle: 'bg-green-100 text-green-800 border border-green-200',
    icon:      CheckCircle,
  },
};

const STATUS_KEYS = ['all', 'pending', 'complete'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTabs({ statusFilter, counts, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {STATUS_KEYS.map((key) => {
        const cfg      = STATUS_CONFIG[key];
        const isActive = (statusFilter ?? 'all') === key;
        const count    = counts?.[key] ?? 0;

        return (
          <button
            key={key}
            onClick={() => onChange(key === 'all' ? null : key)}
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

function StatusPill({ isComplete }) {
  const cfg  = isComplete ? STATUS_CONFIG.complete : STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.pillStyle}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Untagging Progress Cell ──────────────────────────────────────────────────

function UntaggingProgress({ totalTags, projectCost }) {
  const pct     = projectCost > 0 ? Math.min((totalTags / projectCost) * 100, 100) : 0;
  const reached = pct >= 100;

  // colour ramp: red → amber → blue → green
  const barColor =
    pct === 0   ? 'bg-gray-200' :
    pct < 50    ? 'bg-rose-400' :
    pct < 100   ? 'bg-amber-400' :
                  'bg-emerald-500';

  const pctColor =
    pct === 0   ? 'text-gray-400' :
    pct < 50    ? 'text-rose-600' :
    pct < 100   ? 'text-amber-600' :
                  'text-emerald-600';

  return (
    <div className="w-full min-w-[130px] space-y-1">
      {/* bar + percentage */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums w-10 text-right ${pctColor}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      {/* amounts */}
      <p className="text-[10px] text-gray-400 leading-none tabular-nums">
        ₱{totalTags.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        <span className="mx-0.5 text-gray-300">/</span>
        ₱{projectCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImplementationIndex({ implementations, filters, offices, userRole }) {
  const [search,        setSearch]        = useState(filters?.search        || '');
  const [perPage,       setPerPage]       = useState(filters?.perPage       || 10);
  const [statusFilter,  setStatusFilter]  = useState(filters?.statusFilter  ?? 'pending');
  const [officeFilter,  setOfficeFilter]  = useState(filters?.officeFilter  || '');
  const [sortDirection, setSortDirection] = useState(filters?.direction     || 'desc');
  const [isSorted,      setIsSorted]      = useState(!!filters?.direction);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      router.get(
        '/implementation',
        { search, perPage, statusFilter, officeFilter, page: 1, sort: 'project_id', direction: sortDirection },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }, 400);

    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search, statusFilter, officeFilter, perPage, sortDirection]);

  const handlePageChange = useCallback((url) => {
    if (url) router.visit(url, { preserveState: true, preserveScroll: true, replace: true });
  }, []);

  const handleStatusFilter = useCallback((val) => {
    setStatusFilter(val);
  }, []);

  const handleSortToggle = useCallback(() => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    setIsSorted(true);
  }, []);

  const getUntaggingStatus = useCallback((impl) => {
    const totalTags  = impl.tags?.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0) || 0;
    const projectCost = parseFloat(impl.project?.project_cost || 0);
    return { totalTags, projectCost };
  }, []);

  const total    = implementations.total          || 0;
  const complete = implementations.complete_count || 0;
  const pending  = implementations.pending_count  || 0;

  const statusCounts = { all: total, pending, complete };

  const hasActiveFilters = !!(search || officeFilter || (statusFilter && statusFilter !== 'pending'));

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Implementation Checklist" />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Hammer className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Implementation Management</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Track project implementation progress and checklists</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            <StatusTabs statusFilter={statusFilter ?? 'all'} counts={statusCounts} onChange={handleStatusFilter} />

            <div className="flex flex-col gap-2 md:gap-4 md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search company or project..."
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
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2"
                >
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center flex-wrap">
              {(userRole === 'rpmo' || userRole === 'RPMO') && offices?.length > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-1 md:flex-initial md:min-w-[200px]">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={officeFilter}
                    onChange={(e) => setOfficeFilter(e.target.value)}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
                  >
                    <option value="">All Offices</option>
                    {offices.map((office) => (
                      <option key={office.office_id} value={office.office_id}>{office.office_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleSortToggle}
                className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-gray-300 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-xs md:text-sm"
                title={sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}
              >
                <ArrowUpDown className={`w-4 h-4 ${isSorted ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`hidden md:inline font-medium ${isSorted ? 'text-blue-700' : 'text-gray-700'}`}>
                  {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
                </span>
              </button>

              {hasActiveFilters && (
                <button
                  onClick={() => { setSearch(''); setOfficeFilter(''); setStatusFilter('pending'); setSortDirection('desc'); setIsSorted(false); }}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden md:inline">Clear Filters</span>
                </button>
              )}
            </div>

            {implementations.data && (
              <p className="text-xs text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-900">{implementations.from || 0}</span>–
                <span className="font-semibold text-gray-900">{implementations.to || 0}</span> of{' '}
                <span className="font-semibold text-gray-900">{implementations.total || 0}</span> results
                {statusFilter && statusFilter !== 'all' && (
                  <span className="ml-1">· {STATUS_CONFIG[statusFilter]?.label}</span>
                )}
              </p>
            )}
          </div>

          {/* Content */}
          {implementations.data?.length === 0 ? (
            <div className="text-center py-8 md:py-12 px-4">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm md:text-base mb-1">
                    {statusFilter && statusFilter !== 'all'
                      ? `No ${STATUS_CONFIG[statusFilter]?.label.toLowerCase()} implementations`
                      : 'No implementations found'}
                  </p>
                  <p className="text-gray-500 text-xs md:text-sm">
                    {hasActiveFilters
                      ? 'Try adjusting your filters or search terms'
                      : 'No implementation checklists have been created yet'}
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(''); setOfficeFilter(''); setStatusFilter('pending'); }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ── Desktop Table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button onClick={handleSortToggle} className="flex items-center gap-1">
                          <span className={isSorted ? 'text-blue-600' : ''}>Project Code</span>
                          <ArrowUpDown className={`w-3 h-3 ${isSorted ? 'text-blue-600' : 'text-gray-400'}`} />
                        </button>
                      </th>
                      <th className="px-3 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project & Company</th>
                      <th className="px-3 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Signboard</th>
                      <th className="px-3 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">PDC</th>
                      <th className="px-3 py-3 md:py-4 text-left   text-xs font-semibold text-gray-600 uppercase tracking-wider">Untagging Progress</th>
                      <th className="px-3 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Liquidation</th>
                      <th className="px-3 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {implementations.data.map((impl) => {
                      const { totalTags, projectCost } = getUntaggingStatus(impl);
                      const isComplete = !!impl.liquidation;
                      return (
                        <tr key={impl.implement_id} className="hover:bg-blue-50/30 transition-all duration-200">
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-600">
                            {impl.project_id}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <div className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-1">
                              {impl.project?.project_title || 'No Title'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="line-clamp-1">{impl.project?.company?.company_name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <StatusPill isComplete={isComplete} />
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {impl.tarp
                              ? <CheckCircle className="w-5 h-5 text-blue-600 mx-auto" />
                              : <Clock       className="w-5 h-5 text-gray-300 mx-auto" />}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {impl.pdc
                              ? <CheckCircle className="w-5 h-5 text-blue-600 mx-auto" />
                              : <Clock       className="w-5 h-5 text-gray-300 mx-auto" />}
                          </td>
                          {/* ── Untagging Progress ── */}
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <UntaggingProgress totalTags={totalTags} projectCost={projectCost} />
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {impl.liquidation
                              ? <CheckCircle className="w-5 h-5 text-blue-600 mx-auto" />
                              : <Clock       className="w-5 h-5 text-gray-300 mx-auto" />}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            <Link
                              href={`/implementation/checklist/${impl.implement_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-blue-700 shadow-sm transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Cards ── */}
              <div className="md:hidden divide-y divide-gray-100">
                {implementations.data.map((impl) => {
                  const { totalTags, projectCost } = getUntaggingStatus(impl);
                  const isComplete = !!impl.liquidation;
                  return (
                    <div key={impl.implement_id} className="p-3 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400">ID: {impl.project_id}</div>
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mt-0.5">
                            {impl.project?.project_title || 'No Title'}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{impl.project?.company?.company_name || 'N/A'}</span>
                          </div>
                        </div>
                        <StatusPill isComplete={isComplete} />
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
                        {/* Signboard & PDC */}
                        {[
                          { label: 'Signboard',   value: impl.tarp },
                          { label: 'PDC',         value: impl.pdc  },
                          { label: 'Liquidation', value: impl.liquidation },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{label}</span>
                            {value
                              ? <CheckCircle className="w-4 h-4 text-green-600" />
                              : <Clock       className="w-4 h-4 text-gray-300" />}
                          </div>
                        ))}

                        {/* Untagging progress */}
                        <div className="pt-1 border-t border-gray-200">
                          <p className="text-xs text-gray-500 font-medium mb-1.5">Untagging Progress</p>
                          <UntaggingProgress totalTags={totalTags} projectCost={projectCost} />
                        </div>
                      </div>

                      <Link
                        href={`/implementation/checklist/${impl.implement_id}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        View Checklist
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {implementations.links && implementations.links.length > 3 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-medium">{implementations.from || 0}</span>–
                  <span className="font-medium">{implementations.to || 0}</span> of{' '}
                  <span className="font-medium">{implementations.total || 0}</span> results
                </p>
                <div className="flex gap-1 overflow-x-auto">
                  {implementations.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => handlePageChange(link.url)}
                      className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all flex-shrink-0 ${
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