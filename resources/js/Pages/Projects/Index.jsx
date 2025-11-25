import { Link, router, Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Building2,
  Calendar,
  Package,
  X,
  AlertCircle,
  PhilippinePeso,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Play,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  HandCoins,
  Filter,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Helper to format date string to "MMM YYYY"
function formatMonthYear(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toLocaleString('default', { month: 'short', year: 'numeric' });
}

// Progress status options for filter and dropdown
const progressOptions = [
  { value: 'Complete Details', label: 'Pending Review', icon: Clock, color: 'blue' },
  { value: 'internal_rtec', label: 'Internal RTEC', icon: FileText, color: 'yellow' },
  { value: 'internal_compliance', label: 'Internal Compliance', icon: FileText, color: 'yellow' },
  { value: 'external_rtec', label: 'External RTEC', icon: FileText, color: 'purple' },
  { value: 'external_compliance', label: 'External Compliance', icon: FileText, color: 'orange' },
  { value: 'approval', label: 'Awaiting Approval', icon: Clock, color: 'indigo' },
  { value: 'Approved', label: 'Approved', icon: CheckCircle, color: 'green' },
  { value: 'Draft MOA', label: 'Draft MOA', icon: FileText, color: 'cyan' },
  { value: 'Implementation', label: 'Implementation', icon: Play, color: 'teal' },
  { value: 'Disapproved', label: 'Disapproved', icon: XCircle, color: 'red' },
  { value: 'Refund', label: 'Refund', icon: HandCoins, color: 'green' },
  { value: 'Completed', label: 'Completed', icon: Award, color: 'green' },
];

// Helper to get status config
function getStatusConfig(progress) {
  return progressOptions.find(opt => opt.value === progress) || {
    value: progress,
    label: progress || 'Unknown',
    icon: Clock,
    color: 'gray'
  };
}

// Helper to get status badge
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

export default function Index({ projects, filters, offices }) {
  const [search, setSearch] = useState(filters.search || '');
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [sortField, setSortField] = useState(filters.sortField || 'project_title');
  const [sortDirection, setSortDirection] = useState(filters.sortDirection || 'asc');
  const [officeFilter, setOfficeFilter] = useState(filters.officeFilter || '');
  const [progressFilter, setProgressFilter] = useState(filters.progressFilter || '');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { auth } = usePage().props;
  const role = auth?.user?.role;

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/projects', { 
        search, 
        perPage,
        sortField,
        sortDirection,
        officeFilter,
        progressFilter
      }, { 
        preserveState: true, 
        replace: true 
      });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search, officeFilter, progressFilter]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
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
      progressFilter
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const getSortIcon = (field) => {
    return <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />;
  };

  const handleStatusChange = (projectId, newStatus) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(projectId);
    
    router.post(`/projects/${projectId}/update-status`, {
      progress: newStatus
    }, {
      preserveScroll: true,
      onFinish: () => setUpdatingStatus(null),
      onError: (errors) => {
        console.error('Status update failed:', errors);
        alert('Failed to update status. Please try again.');
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

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
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
      progressFilter
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleOfficeFilterChange = (e) => {
    setOfficeFilter(e.target.value);
  };

  const handleProgressFilterChange = (e) => {
    setProgressFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setProgressFilter('');
    setFilterOpen(false);
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
                  <Building2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gray-900">Projects</h2>
              </div>
              
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
            {/* Search Bar and Per Page */}
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
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">items</span>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center flex-wrap">
              {/* Office Filter */}
              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={officeFilter}
                  onChange={handleOfficeFilterChange}
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

              {/* Status Filter */}
              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={progressFilter}
                  onChange={handleProgressFilterChange}
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

              {/* Clear Filters Button */}
              {(search || officeFilter || progressFilter) && (
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
                    <button
                      onClick={() => handleSort('project_title')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Project & Company
                      {getSortIcon('project_title')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Phase One
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Phase Two
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('project_cost')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <PhilippinePeso className="w-4 h-4" />
                      Cost
                      {getSortIcon('project_cost')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('progress')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Status
                      {getSortIcon('progress')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Items
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.data.map((project) => {
                  const phaseOneInitial = formatMonthYear(project.release_initial);
                  const phaseOneEnd = formatMonthYear(project.release_end);
                  const phaseTwoInitial = formatMonthYear(project.refund_initial);
                  const phaseTwoEnd = formatMonthYear(project.refund_end);

                  const phaseOneDisplay = phaseOneInitial && phaseOneEnd ? `${phaseOneInitial} - ${phaseOneEnd}` : '-';
                  const phaseTwoDisplay = phaseTwoInitial && phaseTwoEnd ? `${phaseTwoInitial} - ${phaseTwoEnd}` : '-';

                  return (
                    <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{project.project_title}</div>
                          <div className="text-xs text-gray-500 truncate">{project.company?.company_name || 'No company'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{phaseOneDisplay}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{phaseTwoDisplay}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {project.project_cost ? `₱${parseFloat(project.project_cost).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {role === 'rpmo' ? (
                          <select
                            value={project.progress}
                            onChange={(e) => handleStatusChange(project.project_id, e.target.value)}
                            disabled={updatingStatus === project.project_id}
                            className={`text-xs font-medium rounded-full border-0 px-3 py-1.5 cursor-pointer focus:ring-2 focus:ring-offset-0 transition-all ${
                              updatingStatus === project.project_id ? 'opacity-50 cursor-wait' : ''
                            } ${(() => {
                              const config = getStatusConfig(project.progress);
                              const colorClasses = {
                                blue: 'bg-blue-100 text-blue-800 focus:ring-blue-500',
                                yellow: 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500',
                                purple: 'bg-purple-100 text-purple-800 focus:ring-purple-500',
                                orange: 'bg-orange-100 text-orange-800 focus:ring-orange-500',
                                indigo: 'bg-indigo-100 text-indigo-800 focus:ring-indigo-500',
                                green: 'bg-green-100 text-green-800 focus:ring-green-500',
                                cyan: 'bg-cyan-100 text-cyan-800 focus:ring-cyan-500',
                                teal: 'bg-teal-100 text-teal-800 focus:ring-teal-500',
                                red: 'bg-red-100 text-red-800 focus:ring-red-500',
                                gray: 'bg-gray-100 text-gray-800 focus:ring-gray-500',
                              };
                              return colorClasses[config.color];
                            })()}`}
                          >
                            {progressOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div title="Only RPMO can change status">
                            {getStatusBadge(project.progress)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {project.items ? project.items.length : 0}
                        </span>
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
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              role === 'rpmo'
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={role === 'rpmo' ? 'Delete Project' : 'Contact RPMO'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Simple List View */}
          <div className="md:hidden divide-y divide-gray-200">
            {projects.data.map((project) => {
              return (
                <div key={project.project_id} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{project.project_title}</h3>
                    <p className="text-xs text-gray-600 truncate mt-1">{project.company?.company_name || 'No company'}</p>
                  </div>

                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/projects/${project.project_id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Edit Project"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteClick(project)}
                      disabled={role !== 'rpmo'}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        role === 'rpmo'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={role === 'rpmo' ? 'Delete Project' : 'Contact RPMO'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {projects.data.length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                  <p className="text-xs md:text-sm text-gray-600">Get started by adding your first project</p>
                </div>
                <Link
                  href="/projects/create"
                  className="flex items-center gap-2 bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Project
                </Link>
              </div>
            </div>
          )}

          {/* Pagination */}
          {projects.links && projects.links.length > 1 && (
            <div className="bg-gray-50/50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {projects.from || 1} to {projects.to || projects.data.length} of {projects.total || projects.data.length}
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {projects.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        link.active
                          ? 'bg-blue-500 text-white border-transparent shadow-md'
                          : link.url
                          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
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

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  Are you sure you want to delete <span className="font-semibold">{projectToDelete.project_title}</span>?
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4 md:mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm"
              >
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

  const phaseOneInitial = formatMonthYear(project.release_initial);
  const phaseOneEnd = formatMonthYear(project.release_end);
  const phaseTwoInitial = formatMonthYear(project.refund_initial);
  const phaseTwoEnd = formatMonthYear(project.refund_end);

  const phaseOneDisplay = phaseOneInitial && phaseOneEnd ? `${phaseOneInitial} - ${phaseOneEnd}` : 'Not set';
  const phaseTwoDisplay = phaseTwoInitial && phaseTwoEnd ? `${phaseTwoInitial} - ${phaseTwoEnd}` : 'Not set';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl w-full max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-500 p-4 md:p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-xl font-bold truncate">Project Details</h3>
                <p className="text-xs md:text-sm text-blue-100 truncate">Complete information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Project Information */}
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg md:rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 md:gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900">Project Info</h4>
                </div>
                
                <div className="space-y-3 md:space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Project Title</p>
                      <p className="text-sm md:text-base text-gray-900 font-semibold break-words">{project.project_title}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Company</p>
                      <p className="text-sm md:text-base text-gray-900">{project.company?.company_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <PhilippinePeso className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Project Cost</p>
                      <p className="text-sm md:text-base text-gray-900 font-semibold">
                        {project.project_cost ? `₱${parseFloat(project.project_cost).toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Phase One</p>
                      <p className="text-sm md:text-base text-gray-900">{phaseOneDisplay}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Phase Two</p>
                      <p className="text-sm md:text-base text-gray-900">{phaseTwoDisplay}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Status</p>
                      <div className="mt-1">
                        {getStatusBadge(project.progress)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Items */}
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg md:rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 md:gap-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Package className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900">Items</h4>
                </div>
                
                {project.items && project.items.length > 0 ? (
                  <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
                    {project.items.map((item) => (
                      <div key={item.item_id} className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="font-medium text-gray-900 text-sm flex-1 break-words">{item.item_name}</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-600 mb-1">Quantity</p>
                            <p className="font-medium text-gray-900">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Cost</p>
                            <p className="font-semibold text-green-600">₱{parseFloat(item.item_cost).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No items assigned</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-b-lg md:rounded-b-2xl border-t border-gray-200 sticky bottom-0">
          <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
            >
              Close
            </button>
            <Link
              href={`/projects/${project.project_id}/edit`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}