import { router, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Activity,
  FolderOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Clock,
  Target,
  PlayCircle
} from 'lucide-react';

export default function ActivityList({ activities, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState([]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/activity-list', { search }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
  const grouped = activities.reduce((acc, activity) => {
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

  return (
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Activities" />
          <div className="max-w-7xl mx-auto">
            {/* Activities by Project */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 pb-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Activities by Project</h2>
                  </div>
                </div>
              </div>

              <div className="pb-8">
                {Object.entries(grouped).map(([projectId, group], index) => {
                  const isExpanded = expandedProjectIds.includes(projectId);
                  
                  return (
                    <div key={projectId} className="mx-8 mb-6 last:mb-0">
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Project Header */}
                        <button
                          onClick={() => toggleProject(projectId)}
                          className="w-full bg-gradient-to-r from-green-50 to-green-50/50 hover:from-green-100 hover:to-green-100/50 transition-all duration-200 border-b border-green-200"
                        >
                          <div className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-sm">
                                <FolderOpen className="w-6 h-6" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {group.projectTitle}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {group.activities.length} activit{group.activities.length !== 1 ? 'ies' : 'y'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                {group.activities.length}
                              </div>
                              <div className="transition-transform duration-200">
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-green-600" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Activity Table */}
                        {isExpanded && (
                          <div className="bg-white">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                      <div className="flex items-center gap-2">
                                        <PlayCircle className="w-4 h-4" />
                                        Activity Name
                                      </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Timeline
                                      </div>
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                                      <div className="flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Status
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.activities.map((activity, activityIndex) => {
                                    const startDate = new Date(activity.start_date);
                                    const endDate = new Date(activity.end_date);
                                    const now = new Date();
                                    
                                    let status = 'upcoming';
                                    let statusColor = 'bg-blue-100 text-blue-700';
                                    
                                    if (now >= startDate && now <= endDate) {
                                      status = 'active';
                                      statusColor = 'bg-green-100 text-green-700';
                                    } else if (now > endDate) {
                                      status = 'completed';
                                      statusColor = 'bg-gray-100 text-gray-700';
                                    }

                                    return (
                                      <tr
                                        key={activity.activity_id}
                                        className={`
                                          border-b border-gray-100 hover:bg-green-50/50 transition-all duration-200
                                          ${activityIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                                        `}
                                      >
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                                              <Activity className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="font-medium text-gray-900">
                                              {activity.activity_name}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="text-gray-700">
                                              {formatMonthYear(activity.start_date)} – {formatMonthYear(activity.end_date)}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {activities.length === 0 && (
                  <div className="text-center py-16 mx-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                    <p className="text-gray-500">Activities will appear here when they are created</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {Object.keys(grouped).length > 0 && (
                <div className="px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Click project headers to expand activities</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Upcoming</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
  );
}