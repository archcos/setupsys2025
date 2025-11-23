import { useForm, Link, Head } from '@inertiajs/react';
import { useState } from 'react';
import {
  ChevronLeft,
  Calendar,
  Target,
  Check,
  Loader2,
  AlertCircle,
  FolderOpen,
  Activity,
  Edit2,
  Sparkles
} from 'lucide-react';

export default function Edit({ activity, projects }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, put, processing, errors } = useForm({
    project_id: activity.project_id || '',
    activity_name: activity.activity_name || '',
    start_date: activity.start_date || '',
    end_date: activity.end_date || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      put(`/activities/${activity.activity_id}`, { 
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false)
      });
    }, 1000);
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen bg-gray-50">
      <Head title="Edit Activity" />
      <div className="max-w-5xl mx-auto">
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
            <div className="p-2 md:p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
              <Edit2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Activity</h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">Update activity details and timeline</p>
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

          {/* Activity Details Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Activity Details</h2>
            </div>

            <div className="relative border-2 border-gray-100 rounded-lg md:rounded-xl p-3 md:p-6 bg-gradient-to-r from-gray-50 to-gray-50/30">
              {/* Activity Header */}
              <div className="flex items-start md:items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg md:rounded-xl text-sm font-bold shadow-sm flex-shrink-0">
                  <Activity className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base md:text-lg font-semibold text-gray-900">
                    Activity Information
                  </h4>
                  <p className="text-xs md:text-sm text-gray-500">Update activity details and timeline</p>
                </div>
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
                    value={data.activity_name}
                    onChange={(e) => setData('activity_name', e.target.value)}
                    placeholder="Enter activity name"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                    required
                    maxLength={45}
                  />
                  {errors.activity_name && (
                    <div className="text-red-500 text-xs md:text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      {errors.activity_name}
                    </div>
                  )}
                </div>
                
                {/* Start Month */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                    Start Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={data.start_date?.slice(0, 7) || ''}
                    onChange={(e) => setData('start_date', e.target.value + '-01')}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                    required
                  />
                  {errors.start_date && (
                    <div className="text-red-500 text-xs md:text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      {errors.start_date}
                    </div>
                  )}
                </div>
                
                {/* End Month */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                    End Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={data.end_date?.slice(0, 7) || ''}
                    onChange={(e) => setData('end_date', e.target.value + '-01')}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                    required
                  />
                  {errors.end_date && (
                    <div className="text-red-500 text-xs md:text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      {errors.end_date}
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Progress Indicator */}
              <div className="mt-3 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    data.activity_name && data.start_date && data.end_date 
                      ? 'bg-orange-500' 
                      : 'bg-gray-300'
                  }`}></div>
                  <span className="truncate">
                    {data.activity_name && data.start_date && data.end_date 
                      ? 'All fields complete' 
                      : 'Incomplete - fill all required fields'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-orange-50 rounded-lg md:rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 text-xs md:text-sm text-orange-700">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="font-medium truncate">
                  Editing activity: {data.activity_name || 'Unnamed Activity'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Ready to Update Activity?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review all changes before saving</p>
              </div>
              <div className="flex gap-2 md:gap-4 flex-shrink-0">
                <Link
                  href="/activities"
                  className="flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 font-medium text-xs md:text-sm rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200 text-center whitespace-nowrap"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={processing || isSubmitting}
                  className={`flex-1 md:flex-none px-3 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
                    processing || isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {processing || isSubmitting ? (
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      <span className="hidden sm:inline">Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <Check className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Update</span>
                      <span className="sm:hidden">Save</span>
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