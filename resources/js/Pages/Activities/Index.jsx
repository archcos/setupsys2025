import { Link, router, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Eye, Edit3, Trash2, Activity, Building2, X, AlertCircle, SquareKanban } from 'lucide-react';


export default function Index({ activities, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [selectedProjectActivities, setSelectedProjectActivities] = useState(null);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/activities', { search }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
        setShowActivitiesModal(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleDeleteClick = (activity) => {
    setActivityToDelete(activity);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      router.delete(`/activities/${activityToDelete.activity_id}`);
      setShowDeleteModal(false);
      setActivityToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setActivityToDelete(null);
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

  const openActivitiesModal = (projectId, group) => {
    setSelectedProjectActivities({ projectId, ...group });
    setShowActivitiesModal(true);
  };

  const closeActivitiesModal = () => {
    setShowActivitiesModal(false);
    setSelectedProjectActivities(null);
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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
    <div className="p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Activities" />
      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <SquareKanban className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Activity Management</h2>
              </div>
              
              <Link
                href="/activities/create"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Activity</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-2 md:gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
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
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">entries</span>
              </div>
            </div>
          </div>

          {/* Desktop Table Section */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Project
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Activities
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {Object.entries(grouped).map(([projectId, group]) => (
                  <tr
                    key={`project-${projectId}`}
                    className="hover:bg-gradient-to-r hover:from-gray-50/30 hover:to-transparent transition-all duration-200 border-b border-gray-100"
                  >
                    <td className="px-4 md:px-6 py-4 md:py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-gray-900">{group.projectTitle}</h3>
                          <p className="text-sm text-gray-600 mt-1">{group.activities.length} activities</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-5">
                      <div className="flex flex-wrap gap-2">
                        {group.activities.slice(0, 3).map((activity) => (
                          <span
                            key={activity.activity_id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {activity.activity_name}
                          </span>
                        ))}
                        {group.activities.length > 3 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{group.activities.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openActivitiesModal(projectId, group)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium text-sm"
                          title="View All Activities"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {Object.entries(grouped).map(([projectId, group]) => (
              <div key={`project-${projectId}`} className="bg-white p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{group.projectTitle}</h3>
                    <p className="text-sm text-gray-600 mt-1">{group.activities.length} activities</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {group.activities.slice(0, 2).map((activity) => (
                    <div key={activity.activity_id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        ✓
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">{activity.activity_name}</span>
                    </div>
                  ))}
                  {group.activities.length > 2 && (
                    <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-medium">
                      +{group.activities.length - 2} more activities
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openActivitiesModal(projectId, group)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium text-sm border border-green-200"
                >
                  <Eye className="w-4 h-4" />
                  View All Activities
                </button>
              </div>
            ))}
          </div>

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No activities found</h3>
                  <p className="text-xs md:text-sm text-gray-500">Get started by adding your first activity</p>
                </div>
                <Link
                  href="/activities/create"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add First Activity
                </Link>
              </div>
            </div>
          )}

          {/* Pagination */}
          {activities.links && activities.links.length > 1 && (
            <div className="bg-gradient-to-r from-gray-50/50 to-white px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {activities.from || 1} to {activities.to || activities.data.length} of {activities.total || activities.data.length}
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {activities.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
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

      {/* Activities Modal */}
      {showActivitiesModal && selectedProjectActivities && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                    {selectedProjectActivities.projectTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedProjectActivities.activities.length} activities</p>
                </div>
              </div>
              <button
                onClick={closeActivitiesModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1">
              <div className="divide-y divide-gray-100">
                {selectedProjectActivities.activities.map((activity, index) => (
                  <div key={activity.activity_id} className="p-4 md:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-semibold text-gray-900 truncate">{activity.activity_name}</h4>
                          <p className="text-sm text-gray-500 mt-1">#{activity.activity_id}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatMonthYear(activity.start_date)}</span>
                            <span className="text-gray-400">→</span>
                            <span>{formatMonthYear(activity.end_date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/activities/${activity.activity_id}/edit`}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit Activity"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            handleDeleteClick(activity);
                            closeActivitiesModal();
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete Activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && activityToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Delete Activity
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  Are you sure you want to delete <span className="font-semibold text-gray-900 break-words">{activityToDelete.activity_name}</span>?
                </p>
                <p className="text-xs md:text-sm text-gray-600 mb-3">
                  This will permanently remove the activity from the system.
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm md:text-base transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm md:text-base transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}