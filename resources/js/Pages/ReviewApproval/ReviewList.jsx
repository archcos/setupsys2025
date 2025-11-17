import React, { useState, useEffect, useMemo } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import {
  Search,
  FileText,
  Calendar,
  ArrowUpDown,
  X,
  AlertCircle,
  CheckCircle,
  List,
  CheckCheck,
  Send
} from 'lucide-react';

export default function ReviewList({ projects, filters, years }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [year, setYear] = useState(filters?.year || '');
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'project_title');
  const [sortOrder, setSortOrder] = useState(filters?.sortOrder || 'asc');
  const [statusFilter, setStatusFilter] = useState('all');

  const { flash } = usePage().props;

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get(route('checklist.list'), {
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
    router.get('/checklists', {
      search,
      year,
      sortBy: column,
      sortOrder: newSortOrder,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const countFilledLinks = (checklist) => {
    if (!checklist) return 0;
    return [1, 2, 3, 4].filter(i => checklist[`link_${i}`]).length;
  };

  const isCompleted = (checklist) => {
    return checklist && countFilledLinks(checklist) === 4;
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpDown className="w-3 h-3 text-blue-600" />
      : <ArrowUpDown className="w-3 h-3 text-blue-600 rotate-180" />;
  };

  const getStatusBadge = (checklist) => {
    const checklistStatus = checklist?.status || 'pending';
    
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

    const config = statusConfig[checklistStatus] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Calculate stats based on checklist status
  const pendingCount = projects.filter(p => (p.checklist?.status || 'pending') === 'pending').length;
  const raisedCount = projects.filter(p => p.checklist?.status === 'raised').length;
  const approvedCount = projects.filter(p => p.checklist?.status === 'approved').length;

  // Filter projects based on status filter
  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') {
      return projects;
    } else if (statusFilter === 'pending') {
      return projects.filter(p => (p.checklist?.status || 'pending') === 'pending');
    } else if (statusFilter === 'raised') {
      return projects.filter(p => p.checklist?.status === 'raised');
    } else if (statusFilter === 'approved') {
      return projects.filter(p => p.checklist?.status === 'approved');
    }
    return projects;
  }, [projects, statusFilter]);

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="Checklist Review" />

      <div className="max-w-7xl mx-auto">
        {/* Flash Messages */}
        {flash?.success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            {flash.error}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Project Compliance</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and track project compliance status
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards with Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
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
                <p className="text-xs text-amber-600 mt-2 font-medium">● Active Filter</p>
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
                <p className="text-xs text-blue-600 mt-2 font-medium">● Active Filter</p>
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
                <p className="text-xs text-green-600 mt-2 font-medium">● Active Filter</p>
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
                <p className="text-xs font-medium text-gray-600">Total Projects</p>
                <List className={`w-4 h-4 ${statusFilter === 'all' ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-600">{projects.length}</p>
              {statusFilter === 'all' && (
                <p className="text-xs text-slate-600 mt-2 font-medium">● Active Filter</p>
              )}
            </button>
          </div>

          {/* Filter Info Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && (
                <span className="ml-1">
                  ({statusFilter === 'pending' ? 'Pending' : statusFilter === 'raised' ? 'Raised' : 'Approved'})
                </span>
              )}
            </p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Status Filter
              </button>
            )}
          </div>

          {/* Filters Section */}
          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by project title or company ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-300 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2"
                >
                  <option value="">All Years</option>
                  {years && years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('project_title')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Project Title
                      {getSortIcon('project_title')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('company_id')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      Company
                      {getSortIcon('company_id')}
                    </button>
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
                  const checklist = project.checklist;
                  const filledLinks = countFilledLinks(checklist);

                  return (
                    <tr key={project.project_id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {project.project_title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {project.company?.company_name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {project.year_obligated || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <div className="text-sm font-medium">
                            <span className="text-gray-900">{filledLinks}</span>
                            <span className="text-gray-500">/4</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {getStatusBadge(checklist)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <a
                            href={route('checklist.index', project.project_id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            View Details
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {statusFilter === 'all' ? 'No projects found' : `No ${statusFilter} projects found`}
                    </h3>
                    <p className="text-gray-500 text-sm">
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}