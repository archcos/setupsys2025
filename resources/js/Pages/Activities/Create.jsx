import { useForm, Link, Head } from '@inertiajs/react';
import { useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Calendar,
  Target,
  Building2,
  Check,
  Loader2,
  AlertCircle,
  FolderOpen,
  Activity,
  Save,
  Sparkles
} from 'lucide-react';

export default function Create({ projects }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data, setData, post, processing, errors } = useForm({
    project_id: '',
    activities: [
      { activity_name: '', start_date: '', end_date: '' }
    ],
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate loading for better UX
    setTimeout(() => {
      post('/activities', { 
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false)
      });
    }, 1000);
  };

  const handleActivityChange = (index, field, value) => {
    const updatedActivities = [...data.activities];
    updatedActivities[index][field] = value;
    setData('activities', updatedActivities);
  };

  const addActivity = () => {
    setData('activities', [...data.activities, { activity_name: '', start_date: '', end_date: '' }]);
  };

  const removeActivity = (index) => {
    const updatedActivities = data.activities.filter((_, i) => i !== index);
    setData('activities', updatedActivities);
  };

  return (
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Create Activity" />
          <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4 group"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to Activities
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Create New Activities</h1>
                  <p className="text-gray-600 mt-1">Define project milestones and timeline activities</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Project Selection Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Assignment</h2>
                </div>

                <div className="max-w-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.project_id}
                    onChange={(e) => setData('project_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    required
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_title}
                      </option>
                    ))}
                  </select>
                  {errors.project_id && (
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.project_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Activities Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Activity Timeline</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addActivity}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Activity
                  </button>
                </div>

                <div className="space-y-6">
                  {data.activities.map((activity, index) => (
                    <div key={index} className="relative border-2 border-gray-100 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-gray-50/30 hover:shadow-md transition-shadow duration-200">
                      {/* Activity Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              Activity {index + 1}
                            </h4>
                            <p className="text-sm text-gray-500">Define milestone details</p>
                          </div>
                        </div>
                        {data.activities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeActivity(index)}
                            className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                            title="Remove activity"
                          >
                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>

                      {/* Activity Fields */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Activity Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={activity.activity_name}
                            onChange={(e) => handleActivityChange(index, 'activity_name', e.target.value)}
                            placeholder="Enter activity name"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Start Month <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="month"
                            value={activity.start_date.slice(0, 7)}
                            onChange={(e) => handleActivityChange(index, 'start_date', e.target.value + '-01')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            End Month <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="month"
                            value={activity.end_date.slice(0, 7)}
                            onChange={(e) => handleActivityChange(index, 'end_date', e.target.value + '-01')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                            required
                          />
                        </div>
                      </div>

                      {/* Activity Progress Indicator */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.activity_name && activity.start_date && activity.end_date 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                          }`}></div>
                          {activity.activity_name && activity.start_date && activity.end_date 
                            ? 'Complete' 
                            : 'Incomplete - fill all fields'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activities Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">
                      {data.activities.length} {data.activities.length === 1 ? 'activity' : 'activities'} planned
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ready to Create Activities?</h3>
                    <p className="text-sm text-gray-600 mt-1">Review all timeline details before submitting</p>
                  </div>
                  <div className="flex gap-4">
                    <Link
                      href="/activities"
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={processing || isSubmitting}
                      className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                        processing || isSubmitting
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {processing || isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Activities...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Create Activities
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
  );
}