import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import {
  Activity, ChevronDown, ChevronUp, Download,
  SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight,
  Monitor, User, FolderOpen, Clock, FileText, X
} from 'lucide-react';

const ACTION_COLORS = {
  create:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  update:  'bg-sky-50 text-sky-700 ring-sky-200',
  delete:  'bg-red-50 text-red-700 ring-red-200',
  restore: 'bg-violet-50 text-violet-700 ring-violet-200',
  login:   'bg-amber-50 text-amber-700 ring-amber-200',
  logout:  'bg-gray-100 text-gray-600 ring-gray-200',
};

const getActionStyle = (action) => {
  const key = action?.toLowerCase();
  return ACTION_COLORS[key] || 'bg-blue-50 text-blue-700 ring-blue-200';
};

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function LogManagement({
  logs = [],
  filters: initialFilters = {},
  actions = [],
  modelTypes = [],
  pagination = {},
}) {
  const [selectedLogId, setSelectedLogId]   = useState(null);
  const [filters, setFilters]               = useState(initialFilters || {});
  const [sortBy, setSortBy]                 = useState('desc');
  const [perPage, setPerPage]               = useState(pagination.per_page || 10);
  const [currentPage, setCurrentPage]       = useState(pagination.current_page || 1);
  const [showFilters, setShowFilters]       = useState(false);
  const debounceTimer                       = useRef(null);

  const logsArray  = Array.isArray(logs) ? logs : [];
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;
  const startIndex = (currentPage - 1) * perPage;

  const displayLogs = [...logsArray].sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sortBy === 'asc' ? da - db : db - da;
  });

  const hasActiveFilters = Object.values(filters).some(v => v && v !== '90');

  const applyFilters = (newFilters, page = 1) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      router.get(route('logs.index'), { ...newFilters, per_page: perPage, page }, { preserveState: true });
    }, 300);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const resetFilters = () => {
    const cleared = {};
    setFilters(cleared);
    router.get(route('logs.index'), { per_page: perPage, page: 1 }, { preserveState: true });
  };

  const handlePerPageChange = (e) => {
    const v = parseInt(e.target.value);
    setPerPage(v);
    router.get(route('logs.index'), { ...filters, per_page: v, page: 1 }, { preserveState: true });
  };

  const handlePage = (page) => {
    setCurrentPage(page);
    router.get(route('logs.index'), { ...filters, per_page: perPage, page }, { preserveState: true });
  };

  const handleDownload = () => {
    const params = new URLSearchParams();
    if (filters.ip_address) params.append('ip_address', filters.ip_address);
    if (filters.user_id)    params.append('user_id', filters.user_id);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.action)     params.append('action', filters.action);
    if (filters.model_type) params.append('model_type', filters.model_type);
    params.append('days', filters.days || 90);
    window.location.href = route('logs.export') + '?' + params.toString();
  };

  return (
    <main className="min-h-screen">
      <Head title="Activity Logs" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Activity Logs</h1>
            <p className="text-sm mt-1">Track all user actions and system events</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Stats strip */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-0">
            <Activity className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <span>
              <span className="font-semibold text-gray-900">{totalItems.toLocaleString()}</span>
              <span className="text-gray-400"> total logs</span>
              {totalItems > 0 && (
                <span className="text-gray-400">
                  {' '}· showing {startIndex + 1}–{Math.min(startIndex + perPage, totalItems)}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={perPage}
              onChange={handlePerPageChange}
              className="pr-6 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Entries</label>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
          <div className="flex items-center gap-3 p-3 md:p-4 border-b border-gray-100">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilters || hasActiveFilters ? 'bg-sky-50 border-sky-200 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />}
            </button>

            {/* Days quick-select always visible */}
            <select
              name="days"
              value={filters.days || '90'}
              onChange={handleFilterChange}
              className="px-6 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <button
              onClick={() => setSortBy(s => s === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              {sortBy === 'asc' ? 'Oldest first' : 'Newest first'}
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3 md:p-4 bg-gray-50/50">
              {[
                { name: 'ip_address',  label: 'IP Address',  type: 'input',  placeholder: 'e.g. 192.168.1.1' },
                { name: 'user_id',     label: 'User ID',     type: 'input',  placeholder: 'e.g. 42' },
                { name: 'project_id',  label: 'Project ID',  type: 'input',  placeholder: 'e.g. 7' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={filters[name] || ''}
                    onChange={handleFilterChange}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Action</label>
                <select name="action" value={filters.action || ''} onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors">
                  <option value="">All Actions</option>
                  {actions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Model Type</label>
                <select name="model_type" value={filters.model_type || ''} onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors">
                  <option value="">All Models</option>
                  {modelTypes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="w-10 px-4 py-3.5" />
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">IP Address</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th
                    className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition-colors"
                    onClick={() => setSortBy(s => s === 'asc' ? 'desc' : 'asc')}
                  >
                    <span className="flex items-center gap-1">
                      Date
                      {sortBy === 'asc'
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayLogs.length > 0 ? (
                  displayLogs.flatMap((log) => [
                    <tr
                      key={`row-${log.id}`}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center mx-auto text-gray-400 hover:bg-gray-200 transition-colors">
                          {selectedLogId === log.id
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {log.ip_address}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                        {log.user?.name || <span className="text-gray-400 italic text-xs">System</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {log.project_id || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${getActionStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500 font-mono">{log.model_type}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500 block max-w-[180px] truncate" title={log.description}>
                          {log.description || <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {fmt(log.created_at)}
                      </td>
                    </tr>,

                    selectedLogId === log.id && (
                      <tr key={`details-${log.id}`} className="bg-sky-50/40">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                            {/* Detail header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <FileText className="w-4 h-4 text-gray-400" />
                                Log Details
                                <span className="font-mono text-xs font-normal text-gray-400">#{log.id}</span>
                              </div>
                              <button
                                onClick={() => setSelectedLogId(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-4 space-y-4">
                              {/* Meta grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                  { icon: Monitor,    label: 'Model ID',   value: log.model_id },
                                  { icon: User,       label: 'User Agent', value: log.user_agent || 'N/A' },
                                  { icon: FolderOpen, label: 'Model Type', value: log.model_type },
                                  { icon: Clock,      label: 'Timestamp',  value: fmt(log.created_at) },
                                ].map(({ icon: Icon, label, value }) => (
                                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1">
                                      <Icon className="w-3 h-3" />{label}
                                    </div>
                                    <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">{value}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Description */}
                              {log.description && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Description</p>
                                  <p className="font-mono text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 text-gray-700 whitespace-pre-wrap break-words">
                                    {log.description}
                                  </p>
                                </div>
                              )}

                              {/* Before / After */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                  { label: 'Before', data: log.before, accent: 'border-red-100 bg-red-50/30', headerCls: 'text-red-600' },
                                  { label: 'After',  data: log.after,  accent: 'border-emerald-100 bg-emerald-50/30', headerCls: 'text-emerald-600' },
                                ].map(({ label, data, accent, headerCls }) => (
                                  <div key={label} className={`rounded-lg border ${accent} overflow-hidden`}>
                                    <div className={`px-3 py-2 border-b border-current/10 text-xs font-semibold ${headerCls}`}>
                                      {label}
                                    </div>
                                    <pre className="px-3 py-3 text-xs text-gray-700 overflow-auto max-h-52 leading-relaxed">
                                      {data ? JSON.stringify(data, null, 2) : 'null'}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ])
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">No logs found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or date range</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePage(page)}
                      className={`min-w-[2rem] h-8 px-2 text-xs rounded-lg border transition-colors ${
                        page === currentPage
                          ? 'bg-gray-900 border-gray-900 text-white font-medium'
                          : 'border-gray-200 text-gray-600 hover:bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}