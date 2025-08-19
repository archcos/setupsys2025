import { Link, router, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Activity,
  FolderOpen,
  Clock,
  ArrowRight,
  Filter,
  Settings,
  Eye,
  Building2
} from 'lucide-react';

export default function Index({ activities, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState([]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/activities', { search, perPage }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delay);
  }, [search, perPage]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      router.delete(`/activities/${id}`);
    }
  };

  const toggleProject = (projectId) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Group activities by project_id
  const grouped = activities.data.reduce((acc, activity) => {
    const projectId = activity.project?.project_id || 'Unassigned';
    if (!acc[projectId]) {
      acc[projectId] = {
        projectTitle: activity.project?.project_title || 'Unassigned Project',
        activities: [],
      };
    }
    acc[projectId].activities.push(activity);
    return acc;
  }, {});

  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      replace: true,
      only: ['activities'],
      data: { search, perPage },
    });
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Activities" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Project Activities</h1>
                    <p className="text-gray-600 mt-1">Manage project milestones and timeline activities</p>
                  </div>
                </div>
                <Link
                  href="/activities/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Add Activity
                </Link>
              </div>
            </div>

            {/* Controls Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by activity or project..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Show</label>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-700">entries</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activities by Project */}
            <div className="space-y-6">
              {Object.entries(grouped).map(([projectId, group]) => (
                <div key={projectId} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Project Header */}
                  <button
                    onClick={() => toggleProject(projectId)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border-b border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900">{group.projectTitle}</h3>
                          <p className="text-sm text-gray-500">{group.activities.length} activities</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {group.activities.length} items
                        </span>
                        {expandedProjectIds.includes(projectId) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Activities List */}
                  {expandedProjectIds.includes(projectId) && (
                    <div className="divide-y divide-gray-100">
                      {group.activities.map((activity, index) => (
                        <div key={activity.activity_id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                  {activity.activity_name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatMonthYear(activity.start_date)}</span>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatMonthYear(activity.end_date)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/activities/${activity.activity_id}/edit`}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(activity.activity_id)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {Object.keys(grouped).length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                  <p className="text-gray-600 mb-6">Get started by creating your first project activity.</p>
                  <Link
                    href="/activities/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    Create Activity
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {activities.links && activities.links.length > 3 && (
              <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {activities.from || 0} to {activities.to || 0} of {activities.total || 0} results
                  </div>
                  <div className="flex items-center gap-1">
                    {activities.links.map((link, i) => (
                      <button
                        key={i}
                        disabled={!link.url}
                        onClick={() => link.url && handlePageChange(link.url)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          link.active
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                            : link.url
                            ? 'text-gray-700 hover:bg-gray-100'
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