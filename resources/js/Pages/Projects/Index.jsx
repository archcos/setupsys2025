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
  Filter,
  ArrowUpDown,
  Users,
  PhilippinePeso
} from 'lucide-react';

// Helper to format date string to "MMM YYYY"
function formatMonthYear(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toLocaleString('default', { month: 'short', year: 'numeric' });
}

export default function Index({ projects, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [selectedProject, setSelectedProject] = useState(null);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { auth } = usePage().props;
  const role = auth?.user?.role;

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/projects', { search }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const handleDelete = (id) => {
    if (role !== 'rpmo') {
      alert('You are not authorized to delete a project. Please contact the RPMO.');
      return;
    }

    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(`/projects/${id}`);
    }
  };


  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/projects', {
      search,
      perPage: newPerPage,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleSync = () => {
    if (confirm('Sync projects from CSV?')) {
      setIsSyncing(true);
      router.post('/projects/sync', {}, {
        preserveScroll: true,
        onSuccess: () => {
          alert('CSV sync complete!');
          setIsSyncing(false);
        },
        onError: () => {
          alert('Failed to sync CSV.');
          setIsSyncing(false);
        },
      });
    }
  };

  return (
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Projects" />
          <div className="max-w-7xl mx-auto">
            {/* Main Content Card */}
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
                    
                    <button
                      onClick={handleSync}
                      disabled={isSyncing}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                        isSyncing 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync CSV'}
                    </button>
                  </div>
                </div>
              </div>

                           {/* Filters Section */}
              <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Bar */}
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

                  {/* Per Page Selector */}
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
              </div>

              {/* Table Section */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Project Title and Company
                          {/* <ArrowUpDown className="w-3 h-3 text-gray-400" /> */}
                        </div>
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
                        <div className="flex items-center gap-2">
                          <PhilippinePeso className="w-4 h-4" />
                          Project Cost
                        </div>
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
                      // Format dates or fallback to '-'
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
                                {project.project_cost ? `₱${project.project_cost}` : '-'}
                              </span>
                            </div>
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
                                    onClick={() => handleDelete(project.project_id)}
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
        {/* Modal Header */}
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

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Information */}
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
                        {project.project_cost ? `₱${project.project_cost}` : 'Not specified'}
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

            {/* Project Items */}
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
                            <p className="font-medium text-green-600">₱{item.item_cost}</p>
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

        {/* Modal Footer */}
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