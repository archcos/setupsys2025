import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import {
  Plus, Edit3, Trash2, AlertCircle, CheckCircle,
  Eye, FileText, X, Download, Search, ArrowUpDown,
  Clock, List, ClipboardList,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────

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
    icon:      Clock,
  },
   recommended: {
    label:     'Recommended',
    tab:       'bg-blue-500 text-white',
    badge:     'bg-white/25 text-white',
    pillStyle: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon:      ClipboardList,
  },
  approved: {
    label:     'Approved',
    tab:       'bg-green-500 text-white',
    badge:     'bg-white/25 text-white',
    pillStyle: 'bg-green-100 text-green-800 border border-green-200',
    icon:      CheckCircle,
  },
 
};

const STATUS_KEYS = ['all', 'pending', 'recommended', 'approved'];

// ─── Status Tabs ──────────────────────────────────────────────────────────────

function StatusTabs({ value, counts, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {STATUS_KEYS.map((key) => {
        const cfg      = STATUS_CONFIG[key];
        const isActive = (value ?? 'all') === key;
        const count    = counts?.[key] ?? 0;
        return (
          <button
            key={key}
            onClick={() => onChange(key === 'all' ? '' : key)}
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

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg  = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.pillStyle}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ApplyRestructIndex({ applyRestructs, filters }) {
  const { props } = usePage();

  const [search,        setSearch]        = useState(filters?.search        ?? '');
  const [perPage,       setPerPage]       = useState(filters?.perPage       ?? 10);
  const [statusFilter,  setStatusFilter]  = useState(filters?.statusFilter  ?? '');
  const [sortDirection, setSortDirection] = useState(filters?.direction     ?? 'desc');
  const [isSorted,      setIsSorted]      = useState(!!filters?.direction);

  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  const [deleting,    setDeleting]    = useState(false);
  const [preview,     setPreview]     = useState({ show: false, url: null, type: null, label: null, raw: null });

  const debounceRef = useRef(null);

  /* ── debounced router push ── */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.get(route('apply_restruct.index'), {
        search, perPage, statusFilter, direction: sortDirection, page: 1,
      }, { preserveState: true, preserveScroll: true, replace: true });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, perPage, statusFilter, sortDirection]);

  /* ── pagination ── */
  const goToPage = useCallback((url) => {
    if (!url) return;
    const page = new URL(url).searchParams.get('page');
    router.get(route('apply_restruct.index'), {
      search, perPage, statusFilter, direction: sortDirection, page,
    }, { preserveState: true, preserveScroll: true, replace: true });
  }, [search, perPage, statusFilter, sortDirection]);

  /* ── clear filters ── */
  const hasActiveFilters = !!(search || statusFilter || perPage !== 10 || isSorted);
  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setPerPage(10);
    setSortDirection('desc'); setIsSorted(false);
  };

  /* ── delete ── */
  const confirmDelete = () => {
    setDeleting(true);
    router.delete(route('apply_restruct.destroy', deleteModal.item.apply_id), {
      onSuccess: () => { setDeleteModal({ show: false, item: null }); setDeleting(false); },
      onError:   () => setDeleting(false),
    });
  };

  /* ── preview ── */
  const openPreview = (val, label) => {
    const url  = route('apply_restruct.view_file') + `?path=${encodeURIComponent(val)}`;
    const ext  = val.split('.').pop().toLowerCase();
    const type = ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : 'pdf';
    setPreview({ show: true, url, type, label, raw: val });
  };
  const closePreview = () => setPreview({ show: false, url: null, type: null, label: null, raw: null });

  /* ── doc buttons ── */
  const docMeta = [
    { key: 'proponent', label: 'Proponent', cls: 'text-blue-600   bg-blue-50   hover:bg-blue-100'   },
    { key: 'psto',      label: 'PSTO',      cls: 'text-green-600  bg-green-50  hover:bg-green-100'  },
    { key: 'annexc',    label: 'Annex C',   cls: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { key: 'annexd',    label: 'Annex D',   cls: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
  ];

  const docButtons = (item) => (
    <div className="flex flex-wrap gap-1.5">
      {docMeta.map(({ key, label, cls }) => {
        const val = item[key];
        if (!val) return null;
        return (
          <button key={key} onClick={() => openPreview(val, label)}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${cls}`}>
            <Eye className="w-3 h-3" />{label}
          </button>
        );
      })}
      {!docMeta.some(({ key }) => item[key]) && (
        <span className="text-xs text-slate-400 italic">No documents yet</span>
      )}
    </div>
  );

  /* ── pagination data ── */
  const items       = applyRestructs?.data         ?? [];
  const currentPage = applyRestructs?.current_page ?? 1;
  const lastPage    = applyRestructs?.last_page     ?? 1;
  const total       = applyRestructs?.total         ?? 0;
  const from        = applyRestructs?.from          ?? 0;
  const to          = applyRestructs?.to            ?? 0;
  const links       = applyRestructs?.links         ?? [];

  /* ── status counts ── */
  const counts = {
    all:      applyRestructs?.total_count    ?? total,
    pending:  applyRestructs?.pending_count  ?? 0,
    approved: applyRestructs?.approved_count ?? 0,
    recommended:   applyRestructs?.recommended_count   ?? 0,
  };

  return (
    <div className="min-h-screen">
      <Head title="Apply for Restructuring" />

      <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-8">

        {/* Flash */}
        {props.flash?.success && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">{props.flash.success}</p>
          </div>
        )}
        {props.flash?.error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">{props.flash.error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* ── Card header ── */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 md:p-6 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Apply Restructuring</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage project restructuring applications</p>
              </div>
            </div>
            <Link
              href={route('apply_restruct.create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 flex-shrink-0 transition-all"
            >
              <Plus className="w-4 h-4" /> Add New
            </Link>
          </div>

          {/* ── Filters ── */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            {/* Status tabs */}
            <StatusTabs value={statusFilter || 'all'} counts={counts} onChange={setStatusFilter} />

            {/* Search + per-page + sort */}
            <div className="flex flex-col gap-2 md:flex-row md:gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by project title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 md:py-2.5 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Per page */}
              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm w-fit">
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2"
                >
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>

              {/* Sort */}
              <button
                onClick={() => { setSortDirection(p => p === 'desc' ? 'asc' : 'desc'); setIsSorted(true); }}
                className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-gray-300 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-xs md:text-sm"
                title={sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}
              >
                <ArrowUpDown className={`w-4 h-4 ${isSorted ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`hidden md:inline font-medium ${isSorted ? 'text-blue-700' : 'text-gray-700'}`}>
                  {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
                </span>
              </button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden md:inline">Clear Filters</span>
                </button>
              )}
            </div>

            {/* Result count */}
            {total > 0 && (
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-900">{from}</span>–
                <span className="font-semibold text-gray-900">{to}</span> of{' '}
                <span className="font-semibold text-gray-900">{total}</span> results
                {statusFilter && statusFilter !== 'all' && (
                  <span className="ml-1">· {STATUS_CONFIG[statusFilter]?.label}</span>
                )}
              </p>
            )}
          </div>

          {/* ── Empty state ── */}
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">
                  {search || statusFilter ? 'No matching results' : 'No records found'}
                </p>
                <p className="text-gray-500 text-sm">
                  {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Add your first application to get started'}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Project Code','Project','Status','Documents','Added By','Date Added','Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.apply_id} className="hover:bg-blue-50/30 transition-all duration-150">
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {item.project_id}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 max-w-[220px]">
                          <div className="line-clamp-2">{item.project?.project_title || '-'}</div>
                        </td>
                        <td className="px-5 py-4"><StatusPill status={item.status} /></td>
                        <td className="px-5 py-4">{docButtons(item)}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{item.added_by?.name || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '-'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={route('apply_restruct.edit', item.apply_id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit / Upload">
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <button onClick={() => setDeleteModal({ show: true, item })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="md:hidden divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.apply_id} className="p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.project_id}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2">
                          {item.project?.project_title || '-'}
                        </h3>
                      </div>
                      <StatusPill status={item.status} />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-2.5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Added By</span>
                        <span className="font-medium text-gray-900">{item.added_by?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span className="font-medium text-gray-900">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '-'}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-gray-200">
                        <p className="text-gray-500 mb-1.5">Documents</p>
                        {docButtons(item)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={route('apply_restruct.edit', item.apply_id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <button onClick={() => setDeleteModal({ show: true, item })}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {links.length > 3 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-medium">{from}</span>–
                  <span className="font-medium">{to}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
                <div className="flex gap-1 overflow-x-auto">
                  {links.map((link, i) => (
                    <button
                      key={i}
                      disabled={!link.url}
                      onClick={() => goToPage(link.url)}
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

      {/* ── File Preview Modal ── */}
      {preview.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 md:p-6"
          onClick={closePreview}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <h3 className="text-sm md:text-base font-semibold text-slate-900 truncate">{preview.label}</h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <a href={route('apply_restruct.download_file') + `?path=${encodeURIComponent(preview.raw)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button onClick={closePreview}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 p-2 md:p-4">
              {preview.type === 'image'
                ? <img src={preview.url} alt={preview.label} className="max-w-full max-h-[72vh] mx-auto rounded-lg shadow object-contain block" />
                : <iframe src={preview.url} className="w-full h-[72vh] rounded-lg border border-slate-200 bg-white" title={preview.label} />
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Application</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Delete the application for <strong>{deleteModal.item?.project?.project_title}</strong>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal({ show: false, item: null })}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}