import React, { useState, useEffect } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import { Search, FileText, Calendar, ArrowUpDown, X, AlertCircle, CheckCircle, List, CheckCheck, Send, Eye, ClipboardCheck } from 'lucide-react';

export default function Index({ projects, filters, years }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [year, setYear] = useState(filters?.year || '');
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'project_title');
  const [sortOrder, setSortOrder] = useState(filters?.sortOrder || 'asc');
  const [statusFilter, setStatusFilter] = useState('all');

  const { flash } = usePage().props;

  // Single debounce effect for search and year
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get(route('compliance.index'), {
        search,
        year,
        sortBy,
        sortOrder,
      }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search, year]);

  const handleSort = (column) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    router.get('/compliance', {
      search,
      year,
      sortBy: column,
      sortOrder: newSortOrder,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  // Inline functions - no need for useMemo
  const countFilledLinks = (compliance) => {
    if (!compliance) return 0;
    return [1, 2, 3, 4].filter(i => compliance[`link_${i}`]).length;
  };

  const isCompleted = (compliance) => {
    return compliance && countFilledLinks(compliance) === 4;
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpDown className="w-3 h-3 text-blue-600" />
      : <ArrowUpDown className="w-3 h-3 text-blue-600 rotate-180" />;
  };

  const getStatusBadge = (compliance) => {
    const complianceStatus = compliance?.status || 'pending';
    
    const statusConfig = {
      pending: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        label: 'Pending',
        icon: AlertCircle,
      },
      raised: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Raised',
        icon: Send,
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Approved',
        icon: CheckCheck,
      },
    };

    const config = statusConfig[complianceStatus] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Calculate stats - inline, no memoization needed
  const pendingCount = projects.filter(p => (p.compliance?.status || 'pending') === 'pending').length;
  const raisedCount = projects.filter(p => p.compliance?.status === 'raised').length;
  const approvedCount = projects.filter(p => p.compliance?.status === 'approved').length;

  // Filter projects - inline, no memoization needed for simple filtering
  const filteredProjects = statusFilter === 'all' 
    ? projects 
    : projects.filter(p => {
        const status = p.compliance?.status || 'pending';
        return statusFilter === 'pending' ? status === 'pending' :
               statusFilter === 'raised' ? status === 'raised' :
               statusFilter === 'approved' ? status === 'approved' :
               true;
      });

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

        {/* Main Content Card */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Compliance</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                  Manage and track compliance
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-3 p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            {/* Pending */}
            <button
              onClick={() => setStatusFilter('pending')}
              className={`bg-white rounded-lg shadow-sm border-2 p-3 text-left transition-all hover:shadow-md ${
                statusFilter === 'pending' 
                  ? 'border-amber-500 ring-2 ring-amber-200' 
                  : 'border-gray-100 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <AlertCircle className={`w-4 h-4 ${statusFilter === 'pending' ? 'text-amber-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              {statusFilter === 'pending' && (
                <p className="text-xs text-amber-600 mt-2 font-medium">● Active</p>
              )}
            </button>

            {/* Raised */}
            <button
              onClick={() => setStatusFilter('raised')}
              className={`bg-white rounded-lg shadow-sm border-2 p-3 text-left transition-all hover:shadow-md ${
                statusFilter === 'raised' 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-100 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Raised</p>
                <Send className={`w-4 h-4 ${statusFilter === 'raised' ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-bold text-blue-600">{raisedCount}</p>
              {statusFilter === 'raised' && (
                <p className="text-xs text-blue-600 mt-2 font-medium">● Active</p>
              )}
            </button>

            {/* Approved */}
            <button
              onClick={() => setStatusFilter('approved')}
              className={`bg-white rounded-lg shadow-sm border-2 p-3 text-left transition-all hover:shadow-md ${
                statusFilter === 'approved' 
                  ? 'border-green-500 ring-2 ring-green-200' 
                  : 'border-gray-100 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <CheckCheck className={`w-4 h-4 ${statusFilter === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              {statusFilter === 'approved' && (
                <p className="text-xs text-green-600 mt-2 font-medium">● Active</p>
              )}
            </button>

            {/* Total */}
            <button
              onClick={() => setStatusFilter('all')}
              className={`bg-white rounded-lg shadow-sm border-2 p-3 text-left transition-all hover:shadow-md ${
                statusFilter === 'all' 
                  ? 'border-slate-500 ring-2 ring-slate-200' 
                  : 'border-gray-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Total</p>
                <List className={`w-4 h-4 ${statusFilter === 'all' ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-600">{projects.length}</p>
              {statusFilter === 'all' && (
                <p className="text-xs text-slate-600 mt-2 font-medium">● Active</p>
              )}
            </button>
          </div>

          {/* Stats Cards - Mobile */}
          <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-gray-50 border-b border-gray-100">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`rounded-lg border-2 p-2 text-xs transition-all ${
                statusFilter === 'pending' 
                  ? 'border-amber-500 bg-amber-50' 
                  : 'border-gray-100 bg-white'
              }`}
            >
              <p className="text-gray-600 font-medium">Pending</p>
              <p className={`text-lg font-bold mt-1 ${statusFilter === 'pending' ? 'text-amber-600' : 'text-gray-900'}`}>{pendingCount}</p>
            </button>

            <button
              onClick={() => setStatusFilter('raised')}
              className={`rounded-lg border-2 p-2 text-xs transition-all ${
                statusFilter === 'raised' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-100 bg-white'
              }`}
            >
              <p className="text-gray-600 font-medium">Raised</p>
              <p className={`text-lg font-bold mt-1 ${statusFilter === 'raised' ? 'text-blue-600' : 'text-gray-900'}`}>{raisedCount}</p>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`rounded-lg border-2 p-2 text-xs transition-all ${
                statusFilter === 'approved' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-green-100 bg-white'
              }`}
            >
              <p className="text-gray-600 font-medium">Approved</p>
              <p className={`text-lg font-bold mt-1 ${statusFilter === 'approved' ? 'text-green-600' : 'text-gray-900'}`}>{approvedCount}</p>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg border-2 p-2 text-xs transition-all ${
                statusFilter === 'all' 
                  ? 'border-slate-500 bg-slate-50' 
                  : 'border-gray-100 bg-white'
              }`}
            >
              <p className="text-gray-600 font-medium">Total</p>
              <p className={`text-lg font-bold mt-1 ${statusFilter === 'all' ? 'text-slate-600' : 'text-gray-900'}`}>{projects.length}</p>
            </button>
          </div>

          {/* Filter Info Bar */}
          <div className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs md:text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span>
              {statusFilter !== 'all' && (
                <span className="ml-1">({statusFilter})</span>
              )}
            </p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-2 md:gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search project or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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

              {/* Year Filter */}
              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm w-fit">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
                >
                  <option value="">All Years</option>
                  {years && years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('project_title')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Project
                      {getSortIcon('project_title')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('year_obligated')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Year
                      {getSortIcon('year_obligated')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProjects.map((project) => {
                  const compliance = project.compliance;
                  const filledLinks = countFilledLinks(compliance);

                  return (
                    <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {project.project_title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {project.company?.company_name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {project.year_obligated || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className="text-sm font-medium text-gray-900">
                            <span>{filledLinks}</span><span className="text-gray-500">/4</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {getStatusBadge(compliance)}
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {filteredProjects.map((project, index) => {
              const compliance = project.compliance;
              const filledLinks = countFilledLinks(compliance);

              return (
                <div key={project.project_id} className="p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">#{index + 1}</div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{project.project_title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{project.company?.company_name || 'No company'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(compliance)}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500 text-xs block">Year</span>
                      <p className="font-medium text-gray-900 mt-0.5">{project.year_obligated || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500 text-xs block">Progress</span>
                      <p className="font-medium text-gray-900 mt-0.5">{filledLinks}<span className="text-gray-500">/4</span></p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500 text-xs block">Status</span>
                      <p className="font-medium text-gray-900 mt-0.5 capitalize">{compliance?.status || 'pending'}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <a
                    href={route('compliance.show', project.project_id)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg transition-all duration-200 mt-2"
                  >
                    View Details
                  </a>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">
                    {statusFilter === 'all' ? 'No projects found' : `No ${statusFilter} projects`}
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm">
                    {search || year || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'No projects available'}
                  </p>
                </div>
                {(search || year || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setYear('');
                      setStatusFilter('all');
                    }}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white text-xs md:text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}