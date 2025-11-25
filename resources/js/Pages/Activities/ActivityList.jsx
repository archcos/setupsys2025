import { router, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Activity,
  FolderOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  Clock,
  Target,
  PlayCircle,
  X
} from 'lucide-react';

export default function ActivityList({ activities, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [expandedProjectIds, setExpandedProjectIds] = useState([]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/activity-list', { search }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const toggleProject = (projectId) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen">
      <Head title="Activities" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Activities by Project</h2>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Activities by Project */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {Object.entries(grouped).map(([projectId, group], index) => {
              const isExpanded = expandedProjectIds.includes(projectId);
              
              return (
                <div key={projectId} className="bg-white">
                  {/* Project Header */}
                  <button
                    onClick={() => toggleProject(projectId)}
                    className="w-full bg-gradient-to-r from-green-50 to-green-50/50 hover:from-green-100 hover:to-green-100/50 transition-all duration-200 border-b border-green-200"
                  >
                    <div className="flex items-center justify-between p-3 md:p-6">
                      <div className="flex items-center gap-2 md:gap-4 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg md:rounded-xl shadow-sm flex-shrink-0">
                          <FolderOpen className="w-4 h-4 md:w-6 md:h-6" />
                        </div>
                        <div className="text-left min-w-0">
                          <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate">
                            {group.projectTitle}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600">
                            {group.activities.length} activit{group.activities.length !== 1 ? 'ies' : 'y'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="px-2 md:px-3 py-0.5 md:py-1 bg-green-100 text-green-700 text-xs md:text-sm font-medium rounded-full whitespace-nowrap">
                          {group.activities.length}
                        </div>
                        <div className="transition-transform duration-200">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Activity Content */}
                  {isExpanded && (
                    <div className="bg-white">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700">
                                <div className="flex items-center gap-2">
                                  <PlayCircle className="w-4 h-4" />
                                  Activity Name
                                </div>
                              </th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-700">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Timeline
                                </div>
                              </th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-700">
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
                                  className={`border-b border-gray-100 hover:bg-green-50/50 transition-all duration-200 ${
                                    activityIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                  }`}
                                >
                                  <td className="px-4 md:px-6 py-3 md:py-4">
                                    <div className="flex items-center gap-2 md:gap-3">
                                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Activity className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                      </div>
                                      <span className="font-medium text-sm md:text-base text-gray-900 truncate">
                                        {activity.activity_name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 md:px-6 py-3 md:py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                      <span className="text-xs md:text-base text-gray-700 whitespace-nowrap">
                                        {formatMonthYear(activity.start_date)} – {formatMonthYear(activity.end_date)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                    <span className={`inline-flex px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-xs font-medium ${statusColor}`}>
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden divide-y divide-gray-100">
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
                            <div key={activity.activity_id} className="p-3 hover:bg-green-50/50 transition-all duration-200">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Activity className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 truncate">
                                    {activity.activity_name}
                                  </h4>
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {formatMonthYear(activity.start_date)} – {formatMonthYear(activity.end_date)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {activities.length === 0 && (
              <div className="text-center py-8 md:py-16 px-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Activity className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No activities found</h3>
                <p className="text-xs md:text-sm text-gray-500">Activities will appear here when they are created</p>
              </div>
            )}
          </div>

          {/* Footer Legend */}
          {Object.keys(grouped).length > 0 && (
            <div className="px-3 md:px-8 py-3 md:py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="hidden sm:inline">Click project headers to expand activities</span>
                  <span className="sm:hidden">Tap to expand</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
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