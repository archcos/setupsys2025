import { Link, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  ChevronLeft, Calendar, Check, Loader2, AlertCircle,
  FolderOpen, Activity, Edit2, Pencil, Trash2, X, SquareKanban,
} from 'lucide-react';


function ActivityRow({ act, index, projects, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    project_id: act.project_id || '',
    activity_name: act.activity_name || '',
    start_date: act.start_date || '',
    end_date: act.end_date || '',
  });

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const handleSave = () => {
    setSaving(true);
    setErrors({});
    router.put(
      `/activities/${act.activity_id}`,
      form,
      {
        preserveScroll: true,
        onSuccess: () => { setSaving(false); setEditing(false); },
        onError: (e) => { setSaving(false); setErrors(e); },
      }
    );
  };

  const handleCancel = () => {
    setForm({
      project_id: act.project_id || '',
      activity_name: act.activity_name || '',
      start_date: act.start_date || '',
      end_date: act.end_date || '',
    });
    setErrors({});
    setEditing(false);
  };

  return (
    <div className={`p-4 md:p-6 transition-all duration-200 ${editing ? 'bg-blue-50 border-l-4 border-blue-400' : 'hover:bg-gray-50/60'}`}>
      <div className="flex items-start gap-3 md:gap-4">

        {/* Index badge */}
        <div className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm ${
          editing
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
        }`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            /* ── Edit mode ── */
            <div className="space-y-3 md:space-y-4">
              {/* Activity name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.activity_name}
                  onChange={(e) => setForm({ ...form, activity_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                  maxLength={45}
                  autoFocus
                />
                {errors.activity_name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.activity_name}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />Start Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={form.start_date?.slice(0, 7) || ''}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value + '-01' })}
                    className="w-full px-3 py-2 text-sm text-black border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                  />
                  {errors.start_date && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />End Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={form.end_date?.slice(0, 7) || ''}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value + '-01' })}
                    className="w-full px-3 py-2 text-sm text-black border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                  />
                  {errors.end_date && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.end_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm md:text-base font-semibold text-gray-900">{act.activity_name}</h4>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mt-1.5">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span>{formatMonthYear(act.start_date)}</span>
                <span className="text-gray-300">→</span>
                <span>{formatMonthYear(act.end_date)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Row actions */}
        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 text-xs font-medium"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(act)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-xs font-medium"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


export default function Edit({ activity, projects, projectActivities }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  const projectTitle = activity.project?.project_title || 'Unknown Project';

  const handleDeleteClick = (act) => {
    setActivityToDelete(act);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      router.delete(`/activities/${activityToDelete.activity_id}`, {
        preserveScroll: true,
        onSuccess: () => { setShowDeleteModal(false); setActivityToDelete(null); },
      });
    }
  };

  const allActivities = projectActivities ?? [activity];

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen">
      <Head title="Edit Activities" />
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
            Back to Activities
          </button>
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
              <Edit2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold ">Edit Activities</h1>
              <p className="text-xs md:text-base  mt-1">
                {allActivities.length} {allActivities.length === 1 ? 'activity' : 'activities'} for this project
              </p>
            </div>
          </div>
        </div>

        {/* Project info banner */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md border border-gray-100 p-4 md:p-6 mb-4 md:mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <FolderOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Project</p>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">{projectTitle}</h2>
          </div>
        </div>

        {/* Activities list */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-white p-4 md:p-6 border-b border-gray-100 flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
              <SquareKanban className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">All Activities</h3>
              <p className="text-xs text-gray-500 mt-0.5">Click <strong>Edit</strong> on any row to update it inline</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {allActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Activity className="w-10 h-10 mb-3" />
                <p className="text-sm font-medium">No activities for this project</p>
                <Link href="/activities/create" className="mt-3 text-blue-600 hover:underline text-sm font-medium">
                  Add one
                </Link>
              </div>
            ) : (
              allActivities.map((act, index) => (
                <ActivityRow
                  key={act.activity_id}
                  act={act}
                  index={index}
                  projects={projects}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && activityToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Delete Activity</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-900 break-words">{activityToDelete.activity_name}</span>?
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                onClick={() => { setShowDeleteModal(false); setActivityToDelete(null); }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
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