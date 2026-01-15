
import { Link, router, Head, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Eye, Edit3, Trash2, Building2, Calendar, Package, X, AlertCircle, PhilippinePeso, CheckCircle, Clock, XCircle, FileText, Play, ArrowUpDown, HandCoins, Filter, Award, Users, TrendingUp, ChevronDown, ClipboardList } from 'lucide-react';

// Helper to format date string
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Progress status options
const progressOptions = [
  { value: 'Company Details', label: 'Company Details', icon: Clock, color: 'blue' },
  { value: 'Project Created', label: 'Project Created', icon: FileText, color: 'cyan' },
  { value: 'internal_rtec', label: 'Internal RTEC', icon: FileText, color: 'yellow' },
  { value: 'internal_compliance', label: 'Internal Compliance', icon: FileText, color: 'yellow' },
  { value: 'external_rtec', label: 'External RTEC', icon: FileText, color: 'purple' },
  { value: 'external_compliance', label: 'External Compliance', icon: FileText, color: 'purple' },
  { value: 'Project Review', label: 'Project Review', icon: FileText, color: 'cyan' },
  { value: 'Awaiting Approval', label: 'Awaiting Approval', icon: Clock, color: 'indigo' },
  { value: 'Approved', label: 'Approved', icon: CheckCircle, color: 'green' },
  { value: 'Implementation', label: 'Implementation', icon: Play, color: 'teal' },
  { value: 'Refund', label: 'Refund', icon: HandCoins, color: 'green' },
  { value: 'Completed', label: 'Completed', icon: Award, color: 'green' },
  { value: 'Disapproved', label: 'Disapproved', icon: XCircle, color: 'red' },
  { value: 'Withdrawn', label: 'Withdrawn', icon: XCircle, color: 'red' },
  { value: 'Terminated', label: 'Terminated', icon: XCircle, color: 'red' },
];

function getStatusConfig(progress) {
  return progressOptions.find(opt => opt.value === progress) || {
    value: progress,
    label: progress || 'Unknown',
    icon: Clock,
    color: 'gray'
  };
}

function getStatusBadge(progress) {
  const config = getStatusConfig(progress);
  const Icon = config.icon;
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    green: 'bg-green-100 text-green-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    teal: 'bg-teal-100 text-teal-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function formatCurrency(value) {
  if (!value) return '₱0.00';
  return '₱' + parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Index({ projects, filters, offices, allYears }) {
  const [search, setSearch] = useState(filters.search || '');
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [sortField, setSortField] = useState(filters.sortField || 'project_title');
  const [sortDirection, setSortDirection] = useState(filters.sortDirection || 'asc');
  const [officeFilter, setOfficeFilter] = useState(filters.officeFilter || '');
  const [progressFilter, setProgressFilter] = useState(filters.progressFilter || '');
  const [yearFilter, setYearFilter] = useState(filters.yearFilter || '');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const prevFiltersRef = useRef(null);
  const filterTimeoutRef = useRef(null);
  const { auth } = usePage().props;
  const role = auth?.user?.role;

  // Extract unique years from projects for filter dropdown
  const uniqueYears = allYears && allYears.length > 0 
    ? allYears 
    : Array.from(new Set(projects.data.map(p => p.year_obligated).filter(Boolean))).sort((a, b) => b - a);

  useEffect(() => {
    prevFiltersRef.current = {
      search: filters.search || '',
      office: filters.officeFilter || '',
      progress: filters.progressFilter || '',
      year: filters.yearFilter || '',
    };
  }, []);

  useEffect(() => {
    const currentFilters = {
      search,
      office: officeFilter,
      progress: progressFilter,
      year: yearFilter,
    };

    const filtersChanged =
      currentFilters.search !== prevFiltersRef.current?.search ||
      currentFilters.office !== prevFiltersRef.current?.office ||
      currentFilters.progress !== prevFiltersRef.current?.progress ||
      currentFilters.year !== prevFiltersRef.current?.year;

    if (!filtersChanged) return;

    prevFiltersRef.current = currentFilters;

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = setTimeout(() => {
      router.get('/projects', { 
        search, 
        perPage,
        sortField,
        sortDirection,
        officeFilter,
        progressFilter,
        yearFilter
      }, { 
        preserveState: true, 
        replace: true 
      });
    }, 400);

    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [search, officeFilter, progressFilter, yearFilter]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
        setOpenStatusDropdown(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    router.get('/projects', {
      search,
      perPage,
      sortField: field,
      sortDirection: newDirection,
      officeFilter,
      progressFilter,
      yearFilter
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const SortButton = ({ field, label, icon: Icon }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-2 hover:text-blue-600">
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      <ArrowUpDown className={`w-3 h-3 transition-transform ${sortField === field ? (sortDirection === 'desc' ? 'rotate-180' : '') : 'opacity-50'}`} />
    </button>
  );

  const handleStatusChange = (projectId, newStatus) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(projectId);
    
    router.post(`/projects/${projectId}/update-status`, {
      progress: newStatus
    }, {
      preserveScroll: true,
      onFinish: () => {
        setUpdatingStatus(null);
        setOpenStatusDropdown(null);
      },
      onError: (errors) => {
        console.error('Status update failed:', errors);
        alert('Failed to update status. Please try again.');
        setUpdatingStatus(null);
      }
    });
  };

  const handleDeleteClick = (project) => {
    if (role !== 'rpmo') {
      alert('You are not authorized to delete a project. Please contact the RPMO.');
      return;
    }
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      router.delete(`/projects/${projectToDelete.project_id}`);
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/projects', {
      search,
      perPage: newPerPage,
      sortField,
      sortDirection,
      officeFilter,
      progressFilter,
      yearFilter
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setProgressFilter('');
    setYearFilter('');
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Projects" />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gray-50 p-3 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gray-900">Projects</h2>
              </div>
                <button
                onClick={() => router.post('/projects/sync')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
                title="Sync from CSV"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Sync CSV</span>
                <span className="sm:hidden">Sync</span>
              </button>
              <Link
                href="/projects/create"
                className="flex items-center justify-center gap-2 bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Project</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex flex-col gap-2 md:gap-4 md:flex-row">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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
                  <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">items</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center flex-wrap">
                <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={officeFilter}
                    onChange={(e) => setOfficeFilter(e.target.value)}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
                  >
                    <option value="">All Offices</option>
                    {offices && offices.map((office) => (
                      <option key={office.office_id} value={office.office_id}>
                        {office.office_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
                  >
                    <option value="">All Years</option>
                    {uniqueYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={progressFilter}
                    onChange={(e) => setProgressFilter(e.target.value)}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
                  >
                    <option value="">All Status</option>
                    {progressOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(search || officeFilter || progressFilter || yearFilter) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors shadow-sm text-xs md:text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden md:inline">Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <SortButton field="year_obligated" label="Year" icon={Calendar} />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <SortButton field="project_id" label="Code" icon={FileText} />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <SortButton field="project_title" label="Project & Company" icon={Building2} />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <SortButton field="project_cost" label="Cost" icon={PhilippinePeso} />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <SortButton field="fund_release" label="Fund Release" icon={Calendar} />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.data.map((project) => (
                  <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.year_obligated || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{project.project_id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{project.project_title}</div>
                        <div className="text-xs text-gray-600 mt-1">{project.company?.company_name || 'No company'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {project.project_cost ? formatCurrency(project.project_cost) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(project.fund_release)}</td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenStatusDropdown(openStatusDropdown === project.project_id ? null : project.project_id)}
                          disabled={updatingStatus === project.project_id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {getStatusBadge(project.progress)}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        
                        {openStatusDropdown === project.project_id && (
                          <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max max-h-96 overflow-y-auto">
                            {progressOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleStatusChange(project.project_id, option.value)}
                                disabled={updatingStatus === project.project_id}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                  project.progress === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                } ${updatingStatus === project.project_id ? 'opacity-50 cursor-not-allowed' : ''} first:rounded-t-lg last:rounded-b-lg`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/projects/${project.project_id}/edit`}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit Project"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(project)}
                          disabled={role !== 'rpmo'}
                          className={`p-2 rounded-lg transition-all duration-200 ${role === 'rpmo' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'}`}
                          title={role === 'rpmo' ? 'Delete Project' : 'Contact RPMO'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-200">
            {projects.data.map((project) => (
              <div key={project.project_id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{project.project_title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{project.company?.company_name || 'No company'}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => setSelectedProject(project)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link href={`/projects/${project.project_id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDeleteClick(project)} disabled={role !== 'rpmo'} className={`p-2 rounded-lg transition-all ${role === 'rpmo' ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-gray-600">Year: {project.year_obligated || '-'}</span>
                  <div className="relative inline-block">
                    <button
                      onClick={() => setOpenStatusDropdown(openStatusDropdown === project.project_id ? null : project.project_id)}
                      disabled={updatingStatus === project.project_id}
                      className="flex items-center gap-1"
                    >
                      {getStatusBadge(project.progress)}
                    </button>
                    
                    {openStatusDropdown === project.project_id && (
                      <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max max-h-48 overflow-y-auto">
                        {progressOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleStatusChange(project.project_id, option.value)}
                            disabled={updatingStatus === project.project_id}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                              project.progress === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            } ${updatingStatus === project.project_id ? 'opacity-50 cursor-not-allowed' : ''} first:rounded-t-lg last:rounded-b-lg`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.data.length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <ClipboardList className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No projects found</h3>
              <Link href="/projects/create" className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all mt-4">
                <Plus className="w-4 h-4" />
                Add Project
              </Link>
            </div>
          )}

          {/* Pagination */}
          {projects.links && projects.links.length > 1 && (
            <div className="bg-gray-50/50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {projects.from || 1} to {projects.to || projects.data.length} of {projects.total || projects.data.length}
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {projects.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg border transition-all ${link.active ? 'bg-blue-500 text-white border-transparent' : link.url ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectModal project={selectedProject} isOpen={!!selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to delete <span className="font-semibold">{projectToDelete.project_title}</span>?
                </p>
                <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProjectModal({ project, isOpen, onClose }) {
  if (!isOpen) return null;

  const totalEmployees = (project.male || 0) + (project.female || 0);
  const totalDirectEmployees = (project.direct_male || 0) + (project.direct_female || 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-500 p-4 md:p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-bold truncate">Project Details</h3>
                <p className="text-xs md:text-sm text-blue-100">Complete information</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Project Information */}
          <div className="bg-blue-50 rounded-lg md:rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Project Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded p-3 border border-blue-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Project Code</p>
                <p className="text-sm font-mono font-semibold text-gray-900">{project.project_id}</p>
              </div>
              <div className="bg-white rounded p-3 border border-blue-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Year Obligated</p>
                <p className="text-sm font-semibold text-gray-900">{project.year_obligated || '-'}</p>
              </div>
              <div className="bg-white rounded p-3 border border-blue-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Project Title</p>
                <p className="text-sm font-semibold text-gray-900">{project.project_title}</p>
              </div>
              <div className="bg-white rounded p-3 border border-blue-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Company</p>
                <p className="text-sm text-gray-900">{project.company?.company_name || 'N/A'}</p>
              </div>
              <div className="bg-white rounded p-3 border border-blue-100 md:col-span-2">
                <p className="text-xs font-medium text-gray-600 mb-1">Fund Release Date</p>
                <p className="text-sm text-gray-900">{formatDate(project.fund_release)}</p>
              </div>
            </div>
          </div>
          {/* Timeline Data */}
          <div className="bg-amber-50 rounded-lg md:rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Timeline & Dates</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded p-3 border border-amber-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Initial Project Fund Release</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(project.release_initial)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-amber-100">
                <p className="text-xs font-medium text-gray-600 mb-1">End of Fund Release</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(project.release_end)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-amber-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Initial Refund</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(project.refund_initial)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-amber-100">
                <p className="text-xs font-medium text-gray-600 mb-1">End of Refund</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(project.refund_end)}</p>
              </div>
            </div>
          </div>

          {/* Financial Data */}
          <div className="bg-green-50 rounded-lg md:rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Financial Data</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Project Cost (DOST Assistance)</p>
                <p className="text-sm font-semibold text-green-600">{formatCurrency(project.project_cost)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Refund Amount</p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(project.refund_amount)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Last Refund</p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(project.last_refund)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Revenue (Before SETUP)</p>
                <p className="text-sm text-gray-900">{formatCurrency(project.revenue)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Net Income (Before SETUP)</p>
                <p className="text-sm text-gray-900">{formatCurrency(project.net_income)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Current Asset (Before SETUP)</p>
                <p className="text-sm text-gray-900">{formatCurrency(project.current_asset)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Non-Current Asset (Before SETUP)</p>
                <p className="text-sm text-gray-900">{formatCurrency(project.noncurrent_asset)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Equity (Before SETUP)</p>
                <p className="text-sm text-gray-900">{formatCurrency(project.equity)}</p>
              </div>
              <div className="bg-white rounded p-3 border border-green-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Liability (Before SETUP)</p>
                <p className="text-sm text-gray-900">{formatCurrency(project.liability)}</p>
              </div>
            </div>
          </div>

          {/* Workforce Data */}
          <div className="bg-purple-50 rounded-lg md:rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Workforce Data</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Indirect Employees</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded p-3 border border-purple-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Male</p>
                    <p className="text-lg font-bold text-purple-600">{project.male || 0}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-purple-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Female</p>
                    <p className="text-lg font-bold text-purple-600">{project.female || 0}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-purple-100 col-span-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Indirect</p>
                    <p className="text-lg font-bold text-purple-600">{totalEmployees}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Direct Employees</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded p-3 border border-purple-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Male</p>
                    <p className="text-lg font-bold text-purple-600">{project.direct_male || 0}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-purple-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Female</p>
                    <p className="text-lg font-bold text-purple-600">{project.direct_female || 0}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-purple-100 col-span-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Direct</p>
                    <p className="text-lg font-bold text-purple-600">{totalDirectEmployees}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Items */}
          <div className="bg-green-50 rounded-lg md:rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Items</h4>
            </div>
            
            {project.items && project.items.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {project.items.map((item) => (
                  <div key={item.item_id} className="bg-white rounded p-3 border border-green-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="font-medium text-gray-900 text-sm flex-1 break-words">{item.item_name}</h5>
                    </div>
                    {item.specifications && (
                      <p className="text-xs text-gray-600 mb-2">Specs: {item.specifications}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600 mb-1">Qty</p>
                        <p className="font-medium text-gray-900">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Type</p>
                        <p className="font-medium text-gray-900 capitalize">{item.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Cost</p>
                        <p className="font-semibold text-green-600">{formatCurrency(item.item_cost)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No items assigned</p>
              </div>
            )}
          </div>

          {/* Status Section */}
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Current Status</p>
            {getStatusBadge(project.progress)}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 md:px-6 py-4 border-t border-gray-200 sticky bottom-0 rounded-b-lg md:rounded-b-2xl">
          <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Close
            </button>
            <Link
              href={`/projects/${project.project_id}/edit`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}