import { Link, router, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Edit3,
  Building2,
  Calendar,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Sparkles
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
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [isSyncing, setIsSyncing] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get('/projects', { search, perPage }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, perPage]);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(`/projects/${id}`);
    }
  };

  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      replace: true,
      only: ['projects'],
      data: {
        search,
        perPage,
      },
    });
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
  };

  const handleSyncCSV = () => {
    setIsSyncing(true);
    router.visit(route('projects.sync.csv'), {
      method: 'get',
      preserveScroll: true,
      onSuccess: () => {
        router.visit(route('projects.index'), {
          preserveScroll: true,
          preserveState: true,
        });
        setIsSyncing(false);
      },
      onError: () => {
        setIsSyncing(false);
      }
    });
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Projects" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600 mt-1">Manage and track your project portfolio</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSyncCSV}
                    disabled={isSyncing}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isSyncing
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync CSV'}
                  </button>
                  
                  <Link
                    href="/projects/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Project
                  </Link>
                </div>
              </div>
            </div>

            {/* Search & Filter Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by title, company, cost..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 font-medium">Show</span>
                    <select
                      value={perPage}
                      onChange={handlePerPageChange}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="text-gray-700">entries</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Project Details
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Phase One
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Phase Two
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Cost
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.data.map((project) => {
                      const isOpen = openDropdowns[project.project_id] || false;

                      // Format dates or fallback to '-'
                      const phaseOneInitial = formatMonthYear(project.release_initial);
                      const phaseOneEnd = formatMonthYear(project.release_end);
                      const phaseTwoInitial = formatMonthYear(project.refund_initial);
                      const phaseTwoEnd = formatMonthYear(project.refund_end);

                      const phaseOneDisplay = phaseOneInitial && phaseOneEnd ? `${phaseOneInitial} - ${phaseOneEnd}` : '-';
                      const phaseTwoDisplay = phaseTwoInitial && phaseTwoEnd ? `${phaseTwoInitial} - ${phaseTwoEnd}` : '-';

                      return [
                        <tr
                          key={`main-${project.project_id}`}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors duration-200"
                          onClick={() =>
                            setOpenDropdowns((prev) => ({
                              ...prev,
                              [project.project_id]: !prev[project.project_id],
                            }))
                          }
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{project.project_title}</div>
                                <div className="text-sm text-gray-500">
                                  {project.company?.company_name || 'No company assigned'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${phaseOneDisplay !== '-' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className={`text-sm ${phaseOneDisplay !== '-' ? 'text-gray-900' : 'text-gray-400'}`}>
                                {phaseOneDisplay}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${phaseTwoDisplay !== '-' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className={`text-sm ${phaseTwoDisplay !== '-' ? 'text-gray-900' : 'text-gray-400'}`}>
                                {phaseTwoDisplay}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-gray-900">
                                {project.project_cost ? `₱${project.project_cost}` : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdowns((prev) => ({
                                    ...prev,
                                    [project.project_id]: !prev[project.project_id],
                                  }));
                                }}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title={isOpen ? 'Hide details' : 'Show details'}
                              >
                                {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <Link
                                href={`/projects/${project.project_id}/edit`}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                onClick={(e) => e.stopPropagation()}
                                title="Edit project"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>,

                        isOpen && (
                          <tr key={`details-${project.project_id}`} className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 border-b border-blue-100">
                            <td colSpan="5" className="px-6 py-6">
                              <div className="max-w-4xl">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <Package className="w-4 h-4 text-green-600" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-gray-900">Project Items</h4>
                                </div>
                                
                                {project.items && project.items.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {project.items.map((item) => (
                                      <div key={item.item_id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <div className="flex items-start justify-between mb-2">
                                          <h5 className="font-medium text-gray-900 flex-1">{item.item_name}</h5>
                                          <div className="p-1 bg-green-100 rounded">
                                            <Package className="w-3 h-3 text-green-600" />
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Quantity:</span>
                                            <span className="font-medium text-gray-900">{item.quantity}</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Cost:</span>
                                            <span className="font-medium text-green-600">₱{item.item_cost}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">No items assigned to this project yet.</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ),
                      ];
                    })}
                  </tbody>
                </table>

                {/* Empty State */}
                {projects.data.length === 0 && (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500 mb-6">Get started by creating your first project.</p>
                    <Link
                      href="/projects/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Project
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {projects.data.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      Showing {projects.data.length} of {projects.total} projects
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {projects.links.map((link, index) => (
                      <button
                        key={index}
                        disabled={!link.url}
                        onClick={() => link.url && handlePageChange(link.url)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          link.active
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                            : link.url
                            ? 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}