import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
  CheckCircle, 
  ExternalLink, 
  FileText, 
  Calendar, 
  User, 
  Search, 
  X, 
  Building2,
  Clock,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Status options for filter
const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
  { value: 'raised', label: 'Raised', icon: FileText, color: 'blue' },
  { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
];

// Helper to get status config
function getStatusConfig(status) {
  return statusOptions.find(opt => opt.value === status) || {
    value: status,
    label: status || 'Unknown',
    icon: Clock,
    color: 'gray'
  };
}

// Helper to get status badge
function getStatusBadge(status) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

export default function VerifyRestructureList({ applyRestructs, auth, offices, filters }) {
  const userRole = auth?.user?.role;
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [officeFilter, setOfficeFilter] = useState(filters?.officeFilter || '');
  const [statusFilter, setStatusFilter] = useState(filters?.statusFilter || '');
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'desc');

  // Debounced search, office filter, and status filter
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/verify-restructure', { 
        search, 
        perPage,
        officeFilter,
        statusFilter,
        sortBy
      }, { 
        preserveState: true, 
        replace: true 
      });
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [search, officeFilter, statusFilter]);

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/verify-restructure', {
      search,
      perPage: newPerPage,
      officeFilter,
      statusFilter,
      sortBy
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleSortToggle = () => {
    const newSort = sortBy === 'desc' ? 'asc' : 'desc';
    setSortBy(newSort);
    router.get('/verify-restructure', {
      search,
      perPage,
      officeFilter,
      statusFilter,
      sortBy: newSort
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setStatusFilter('');
    setSortBy('desc');
    router.get('/verify-restructure', {
      perPage
    }, {
      preserveState: true,
    });
  };

  const hasActiveFilters = search || officeFilter || statusFilter;

  // Handle paginated data structure from Laravel
  const data = applyRestructs?.data || [];
  const paginationData = applyRestructs?.data ? applyRestructs : null;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Verify Restructuring" />
      
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gray-50 p-3 md:p-6 border-b border-gray-100">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Verify Restructuring Applications</h2>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Review and verify project restructuring requests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search Bar and Per Page Selector */}
              <div className="flex flex-col gap-2 md:gap-4 md:flex-row">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search project or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Per Page Selector */}
                <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm w-fit">
                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">entries</span>
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center flex-wrap">
                {/* Office Filter */}
                {offices && offices.length > 0 && (
                  <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <select
                      value={officeFilter}
                      onChange={(e) => setOfficeFilter(e.target.value)}
                      className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
                    >
                      <option value="">All Offices</option>
                      {offices.map((office) => (
                        <option key={office.office_id} value={office.office_id}>
                          {office.office_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status Filter */}
                <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Button */}
                <button
                  onClick={handleSortToggle}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-gray-300 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-xs md:text-sm"
                  title={sortBy === 'desc' ? 'Newest first' : 'Oldest first'}
                >
                  {sortBy === 'desc' ? (
                    <ArrowDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="hidden md:inline font-medium text-gray-700">
                    {sortBy === 'desc' ? 'Newest' : 'Oldest'}
                  </span>
                </button>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors shadow-sm text-xs md:text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden md:inline">Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Section - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Project
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Office
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Added By
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date Submitted
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Status
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Documents</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data && data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={item.apply_id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                      <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                        {paginationData ? paginationData.from + index : index + 1}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div>
                          <div className="text-xs md:text-sm font-semibold text-gray-900">
                            {item.project?.project_title || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.project?.company?.company_name || 'No company'}
                          </div>
                          <div className="text-xs text-gray-400">ID: {item.project_id}</div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm text-gray-600">
                          {item.project?.company?.office?.office_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="text-xs md:text-sm text-gray-600">{item.added_by?.name || '-'}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm text-gray-600">
                          {item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        {getStatusBadge(item.restructure?.status || 'pending')}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex flex-wrap gap-2">
                          {item.proponent && (
                            <a 
                              href={item.proponent} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Proponent
                            </a>
                          )}
                          {item.psto && (
                            <a 
                              href={item.psto} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              PSTO
                            </a>
                          )}
                          {item.annexc && (
                            <a 
                              href={item.annexc} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Annex C
                            </a>
                          )}
                          {item.annexd && (
                            <a 
                              href={item.annexd} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Annex D
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center justify-center">
                          {(userRole === 'rpmo' || userRole === 'rd') ? (
                            <Link
                              href={`/verify-restructure/${item.apply_id}`}
                              className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-green-500/40"
                            >
                              <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                              Verify
                            </Link>
                          ) : (
                            <span className="inline-flex items-center px-2 md:px-3 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">
                              RPMO/RD
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 md:px-6 py-8 md:py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                          <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-medium text-base md:text-lg mb-1">No applications found</p>
                        <p className="text-gray-500 text-xs md:text-sm">
                          {hasActiveFilters 
                            ? 'Try adjusting your filters or search terms' 
                            : 'No restructuring applications to verify'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <div key={item.apply_id} className="p-3 space-y-3">
                  {/* Header with Index */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">#{paginationData ? paginationData.from + index : index + 1}</div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.project?.project_title || '-'}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{item.project?.company?.company_name || 'No company'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(item.restructure?.status || 'pending')}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500">Office</span>
                      <p className="font-medium text-gray-900 truncate">{item.project?.company?.office?.office_name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500">Added By</span>
                      <p className="font-medium text-gray-900 truncate">{item.added_by?.name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 col-span-2">
                      <span className="text-gray-500">Date Submitted</span>
                      <p className="font-medium text-gray-900">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  {(item.proponent || item.psto || item.annexc || item.annexd) && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.proponent && (
                        <a 
                          href={item.proponent} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Proponent
                        </a>
                      )}
                      {item.psto && (
                        <a 
                          href={item.psto} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          PSTO
                        </a>
                      )}
                      {item.annexc && (
                        <a 
                          href={item.annexc} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Annex C
                        </a>
                      )}
                      {item.annexd && (
                        <a 
                          href={item.annexd} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Annex D
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {(userRole === 'rpmo' || userRole === 'rd') ? (
                    <Link
                      href={`/verify-restructure/${item.apply_id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Application
                    </Link>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">
                      RPMO/RD Only
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium text-base mb-1">No applications found</p>
                  <p className="text-gray-500 text-xs">
                    {hasActiveFilters 
                      ? 'Try adjusting your filters or search terms' 
                      : 'No restructuring applications to verify'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {paginationData && paginationData.links && paginationData.links.length > 3 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-medium">{paginationData.from || 0}</span> to{' '}
                  <span className="font-medium">{paginationData.to || 0}</span> of{' '}
                  <span className="font-medium">{paginationData.total || 0}</span> results
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {paginationData.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        link.active
                          ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                          : link.url
                          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
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
    </main>
  );
}