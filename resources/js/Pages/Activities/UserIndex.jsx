import { router, Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Activity, FolderOpen, Calendar, Search, Target, X, Eye, Edit3, Trash2, Building2, AlertCircle } from 'lucide-react';

export default function UserIndex({ activities, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/activity-list', { search }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const grouped = activities.reduce((acc, activity) => {
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

  const openModal = (projectId, group) => {
    setSelectedGroup({ projectId, ...group });
    setShowModal(true);
  };

  const handleDeleteClick = (activity) => {
    setActivityToDelete(activity);
    setShowModal(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      router.delete(`/activities/${activityToDelete.activity_id}`);
      setShowDeleteModal(false);
      setActivityToDelete(null);
    }
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Activities" />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Activities by Project</h2>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-8 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white shadow-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4" />Project</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Activity className="w-4 h-4" />Activities</div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {Object.entries(grouped).map(([projectId, group]) => (
                  <tr key={projectId} className="hover:bg-gray-50/50 transition-all duration-200">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">{group.projectTitle}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{group.activities.length} activit{group.activities.length !== 1 ? 'ies' : 'y'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {group.activities.slice(0, 3).map((a) => (
                          <span key={a.activity_id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {a.activity_name}
                          </span>
                        ))}
                        {group.activities.length > 3 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            +{group.activities.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => openModal(projectId, group)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {Object.entries(grouped).map(([projectId, group]) => (
              <div key={projectId} className="p-4 bg-white">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-gray-900">{group.projectTitle}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{group.activities.length} activities</p>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  {group.activities.slice(0, 2).map((a) => (
                    <div key={a.activity_id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs flex-shrink-0">✓</div>
                      <span className="text-sm font-medium text-gray-900 truncate">{a.activity_name}</span>
                    </div>
                  ))}
                  {group.activities.length > 2 && (
                    <div className="text-center p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                      +{group.activities.length - 2} more activities
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openModal(projectId, group)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 text-sm font-medium transition-all"
                >
                  <Eye className="w-4 h-4" />
                  View All Activities
                </button>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {activities.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
              <p className="text-sm text-gray-500">Activities will appear here when they are created</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-gray-50 to-white p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedGroup.projectTitle}</h3>
                  <p className="text-sm text-gray-500">{selectedGroup.activities.length} activities</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {selectedGroup.activities.map((activity, index) => (
                <div key={activity.activity_id} className="p-4 md:p-5 hover:bg-gray-50 transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-gray-900 truncate">{activity.activity_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">#{activity.activity_id}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{formatMonthYear(activity.start_date)}</span>
                      <span className="text-gray-400">→</span>
                      <span>{formatMonthYear(activity.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link href={`/activities/${activity.activity_id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDeleteClick(activity)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && activityToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Activity</h3>
                <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete <span className="font-semibold text-gray-900">{activityToDelete.activity_name}</span>?</p>
                <p className="text-sm text-red-600 font-medium mt-2">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}