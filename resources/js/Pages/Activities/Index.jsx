import { Link, router, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
  Activity,
  Building2,
  X,
  ArrowUpDown
} from 'lucide-react';

export default function Index({ activities, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState([]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/activities', { search }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      router.delete(`/activities/${id}`);
    }
  };

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/activities', {
      search,
      perPage: newPerPage,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
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
    const projectId = activity.project?.project_id || 'unassigned';
    if (!acc[projectId]) {
      acc[projectId] = {
        projectTitle: activity.project?.project_title || 'Unassigned Project',
        activities: [],
      };
    }
    acc[projectId].activities.push(activity);
    return acc;
  }, {});

  return (
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Activities" />
          <div className="max-w-7xl mx-auto">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Activity Management</h2>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link
                      href="/activities/create"
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Activity
                    </Link>
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
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Project
                          {/* <ArrowUpDown className="w-3 h-3 text-gray-400" /> */}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Activity
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Duration
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {Object.entries(grouped).map(([projectId, group]) => (
                      <>
                        {/* Project Header Row */}
                        <tr
                          key={`project-${projectId}`}
                          className="bg-gradient-to-r from-blue-50 to-blue-100/30 border-b border-blue-200 hover:from-blue-100/50 hover:to-blue-200/30 transition-all duration-200 cursor-pointer"
                          onClick={() => toggleProject(projectId)}
                        >
                          <td colSpan={4} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {expandedProjectIds.includes(projectId) ? (
                                    <ChevronDown className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-blue-600" />
                                  )}
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900">{group.projectTitle}</h3>
                                  <p className="text-sm text-gray-600">{group.activities.length} activities</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {group.activities.length} items
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Activity Rows */}
                        {expandedProjectIds.includes(projectId) && group.activities.map((activity, index) => (
                          <tr
                            key={activity.activity_id}
                            className="hover:bg-gradient-to-r hover:from-gray-50/30 hover:to-transparent transition-all duration-200 group border-b border-gray-100"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 pl-8">
                                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-bold">
                                  {index + 1}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Activity #{activity.activity_id}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{activity.activity_name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{formatMonthYear(activity.start_date)}</span>
                                <span className="text-gray-400">→</span>
                                <span>{formatMonthYear(activity.end_date)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  href={`/activities/${activity.activity_id}/edit`}
                                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Edit Activity"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Link>

                                <button
                                  onClick={() => handleDelete(activity.activity_id)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Delete Activity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>

                {Object.keys(grouped).length === 0 && (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
                        <p className="text-gray-500 text-sm">Get started by adding your first activity</p>
                      </div>
                      <Link
                        href="/activities/create"
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Activity
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {activities.links && activities.links.length > 1 && (
                <div className="bg-gradient-to-r from-gray-50/50 to-white px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {activities.from || 1} to {activities.to || activities.data.length} of {activities.total || activities.data.length} results
                    </div>
                    <div className="flex gap-1">
                      {activities.links.map((link, index) => (
                        <button
                          key={index}
                          disabled={!link.url}
                          onClick={() => link.url && router.visit(link.url)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                            link.active
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent shadow-md'
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
        </main> 
  );
}