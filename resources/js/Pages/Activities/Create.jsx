import { useForm, Link, Head } from '@inertiajs/react';
import { useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Calendar,
  Target,
  Check,
  Loader2,
  AlertCircle,
  FolderOpen,
  Activity,
  Sparkles
} from 'lucide-react';

export default function Create({ projects }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data, setData, post, processing, errors } = useForm({
    project_id: '',
    activities: [
      { activity_name: '', start_date: '', end_date: '' }
    ],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
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
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Head title="Create Activity" />
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
            Back to Activities
          </Link>
          <div className="flex items-start md:items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New Activities</h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">Define project milestones and timeline activities</p>
            </div>
          </div>
        </div>

        <div onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          {/* Project Selection Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Assignment</h2>
            </div>

            <div className="max-w-lg">
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                Select Project <span className="text-red-500">*</span>
              </label>
              <select
                value={data.project_id}
                onChange={(e) => setData('project_id', e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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
                <div className="text-red-500 text-xs md:text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  {errors.project_id}
                </div>
              )}
            </div>
          </div>

          {/* Activities Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center justify-between gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Activity Timeline</h2>
              </div>
              <button
                type="button"
                onClick={addActivity}
                className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg md:rounded-xl transition-colors duration-200 flex-shrink-0"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Add Activity</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="space-y-3 md:space-y-6">
              {data.activities.map((activity, index) => (
                <div key={index} className="relative border-2 border-gray-100 rounded-lg md:rounded-xl p-3 md:p-6 bg-gradient-to-r from-gray-50 to-gray-50/30 hover:shadow-md transition-shadow duration-200">
                  {/* Activity Header */}
                  <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="flex items-start gap-2 md:gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base md:text-lg font-semibold text-gray-900">
                          Activity {index + 1}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-500">Define milestone details</p>
                      </div>
                    </div>
                    {data.activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="inline-flex items-center p-1.5 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 group flex-shrink-0"
                        title="Remove activity"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>

                  {/* Activity Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                    {/* Activity Name */}
                    <div className="md:col-span-1">
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        Activity Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={activity.activity_name}
                        onChange={(e) => handleActivityChange(index, 'activity_name', e.target.value)}
                        placeholder="Enter activity name"
                        maxLength={45}
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                        required
                      />
                      <div className="mt-1 text-xs text-gray-500 text-right">
                        {activity.activity_name.length}/45 characters
                      </div>
                    </div>
                    
                    {/* Start Month */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                        Start Month <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        value={activity.start_date.slice(0, 7)}
                        onChange={(e) => handleActivityChange(index, 'start_date', e.target.value + '-01')}
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                        required
                      />
                    </div>
                    
                    {/* End Month */}
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                        End Month <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        value={activity.end_date.slice(0, 7)}
                        onChange={(e) => handleActivityChange(index, 'end_date', e.target.value + '-01')}
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Activity Progress Indicator */}
                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        activity.activity_name && activity.start_date && activity.end_date 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}></div>
                      <span className="truncate">
                        {activity.activity_name && activity.start_date && activity.end_date 
                          ? 'Complete' 
                          : 'Incomplete - fill all fields'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activities Summary */}
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg md:rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-xs md:text-sm text-blue-700">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="font-medium">
                  {data.activities.length} {data.activities.length === 1 ? 'activity' : 'activities'} planned
                </span>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Ready to Create Activities?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review all timeline details before submitting</p>
              </div>
              <div className="flex gap-2 md:gap-4">
                <Link
                  href="/activities"
                  className="flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 font-medium text-sm md:text-base rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200 text-center"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={processing || isSubmitting}
                  className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-200 ${
                    processing || isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {processing || isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Creating Activities...</span>
                      <span className="sm:hidden">Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Activities</span>
                      <span className="sm:hidden">Create</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}