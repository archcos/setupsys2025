import { Link, router, Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
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
  Trophy,
  Award,
  HandCoins,
  Filter
} from 'lucide-react';

// Helper to format date string to "MMM YYYY"
function formatMonthYear(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toLocaleString('default', { month: 'short', year: 'numeric' });
}

// Helper to get status badge
function getStatusBadge(progress) {
  const statusConfig = {
    'Complete Details': { 
      icon: Clock, 
      bg: 'bg-blue-100', 
      text: 'text-blue-800', 
      label: 'Pending Review' 
    },
    'internal_rtec': { 
      icon: FileText, 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      label: 'Internal RTEC' 
    },
    'internal_compliance': { 
      icon: FileText, 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      label: 'Internal Compliance' 
    },
    'external_rtec': { 
      icon: FileText, 
      bg: 'bg-purple-100', 
      text: 'text-purple-800', 
      label: 'External RTEC' 
    },
    'external_compliance': { 
      icon: FileText, 
      bg: 'bg-orange-100', 
      text: 'text-orange-800', 
      label: 'External Compliance' 
    },
    'approval': { 
      icon: Clock, 
      bg: 'bg-indigo-100', 
      text: 'text-indigo-800', 
      label: 'Awaiting Approval' 
    },
    'Approved': { 
      icon: CheckCircle, 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      label: 'Approved' 
    },
    'Draft MOA': { 
      icon: FileText, 
      bg: 'bg-cyan-100', 
      text: 'text-cyan-800', 
      label: 'Draft MOA' 
    },
    'Implementation': { 
      icon: Play, 
      bg: 'bg-teal-100', 
      text: 'text-teal-800', 
      label: 'Implementation' 
    },
    'Disapproved': { 
      icon: XCircle, 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      label: 'Disapproved' 
    },
    'Refund': { 
      icon: HandCoins, 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      label: 'Refund' 
    },
    'Completed': { 
      icon: Award, 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      label: 'Completed' 
    },
  };

  const config = statusConfig[progress] || { 
    icon: Clock, 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    label: progress || 'Unknown' 
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// Progress status options for filter
const progressOptions = [
  { value: 'Complete Details', label: 'Pending Review' },
  { value: 'internal_rtec', label: 'Internal RTEC' },
  { value: 'internal_compliance', label: 'Internal Compliance' },
  { value: 'external_rtec', label: 'External RTEC' },
  { value: 'external_compliance', label: 'External Compliance' },
  { value: 'approval', label: 'Awaiting Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Draft MOA', label: 'Draft MOA' },
  { value: 'Implementation', label: 'Implementation' },
  { value: 'Disapproved', label: 'Disapproved' },
  { value: 'Refund', label: 'Refund' },
  { value: 'Completed', label: 'Completed' },
];

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
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
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
    const newOffice = e.target.value;
    setOfficeFilter(newOffice);
  };

  const handleProgressFilterChange = (e) => {
    const newProgress = e.target.value;
    setProgressFilter(newProgress);
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="Projects" />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gray-50 p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Project Management</h2>
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  href="/projects/create"
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Project
                </Link>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by company name or project title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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

                <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-500 shadow-sm">
                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">entries</span>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-500 shadow-sm min-w-[200px]">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <select
                    value={officeFilter}
                    onChange={handleOfficeFilterChange}
                    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1"
                  >
                    <option value="">All Offices</option>
                    {offices && offices.map((office) => (
                      <option key={office.office_id} value={office.office_id}>
                        {office.office_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-500 shadow-sm min-w-[200px]">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={progressFilter}
                    onChange={handleProgressFilterChange}
                    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1"
                  >
                    <option value="">All Status</option>
                    {progressOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('project_title')}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      Project Title and Company
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
                      Project Cost
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
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{project.project_title}</div>
                            <div className="text-xs text-gray-500">
                              {project.company?.company_name || 'No company assigned'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {phaseOneDisplay}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {phaseTwoDisplay}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {project.project_cost ? `₱${parseFloat(project.project_cost).toLocaleString()}` : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(project.progress)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {project.items ? project.items.length : 0} items
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200 group"
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
                            title={
                              role === 'rpmo'
                                ? 'Delete Project'
                                : 'Contact RPMO to delete this project'
                            }
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

            {projects.data.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                    <p className="text-gray-500 text-sm">Get started by adding your first project</p>
                  </div>
                  <Link
                    href="/projects/create"
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Project
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {projects.links && projects.links.length > 1 && (
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {projects.from || 1} to {projects.to || projects.data.length} of {projects.total || projects.data.length} results
                </div>
                <div className="flex gap-1">
                  {projects.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Project
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{projectToDelete.project_title}</span>?
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently remove the project and all associated data from the system.
                </p>
                <p className="text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete Project
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-500 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Project Details</h3>
                <p className="text-blue-100 text-sm">Complete project information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Project Information</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Project Title</p>
                      <p className="text-gray-900 font-semibold">{project.project_title}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Company</p>
                      <p className="text-gray-900">{project.company?.company_name || 'No company assigned'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <PhilippinePeso className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Project Cost</p>
                      <p className="text-gray-900 font-semibold">
                        {project.project_cost ? `₱${parseFloat(project.project_cost).toLocaleString()}` : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phase One (Fund Release) Timeline</p>
                      <p className="text-gray-900">{phaseOneDisplay}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phase Two (Refund Schedule) Timeline</p>
                      <p className="text-gray-900">{phaseTwoDisplay}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Project Items</h4>
                </div>
                
                {project.items && project.items.length > 0 ? (
                  <div className="space-y-3">
                    {project.items.map((item) => (
                      <div key={item.item_id} className="bg-white rounded-lg p-4 border border-green-100">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{item.item_name}</h5>
                          <Package className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="font-medium text-gray-900">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cost</p>
                            <p className="font-medium text-green-600">₱{parseFloat(item.item_cost).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No items assigned to this project</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
            <Link
              href={`/projects/${project.project_id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
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