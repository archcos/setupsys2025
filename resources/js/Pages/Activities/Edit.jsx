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
  EditIcon,
  Sparkles
} from 'lucide-react';

export default function Edit({ activity, projects }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, put, processing, errors } = useForm({
    project_id: activity.project_id || '',
    activity_name: activity.activity_name || '',
    start_date: activity.start_date || '',
    end_date: activity.end_date || '',
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate loading for better UX
    setTimeout(() => {
      put(`/activities/${activity.activity_id}`, { 
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false)
      });
    }, 1000);
  };

  return (
        
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Edit Activity" />
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
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <EditIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Activity</h1>
                  <p className="text-gray-600 mt-1">Update activity details and timeline</p>
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

              {/* Activity Details Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Activity Details</h2>
                </div>

                <div className="relative border-2 border-gray-100 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-gray-50/30">
                  {/* Activity Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-sm">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Activity Information
                      </h4>
                      <p className="text-sm text-gray-500">Update activity details and timeline</p>
                    </div>
                  </div>

                  {/* Activity Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Activity Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.activity_name}
                        onChange={(e) => setData('activity_name', e.target.value)}
                        placeholder="Enter activity name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                        required
                      />
                      {errors.activity_name && (
                        <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.activity_name}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Start Month <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        value={data.start_date?.slice(0, 7) || ''}
                        onChange={(e) => setData('start_date', e.target.value + '-01')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                        required
                      />
                      {errors.start_date && (
                        <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.start_date}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        End Month <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        value={data.end_date?.slice(0, 7) || ''}
                        onChange={(e) => setData('end_date', e.target.value + '-01')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                        required
                      />
                      {errors.end_date && (
                        <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.end_date}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity Progress Indicator */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${
                        data.activity_name && data.start_date && data.end_date 
                          ? 'bg-orange-500' 
                          : 'bg-gray-300'
                      }`}></div>
                      {data.activity_name && data.start_date && data.end_date 
                        ? 'All fields complete' 
                        : 'Incomplete - fill all required fields'
                      }
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 text-sm text-orange-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">
                      Editing activity: {data.activity_name || 'Unnamed Activity'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ready to Update Activity?</h3>
                    <p className="text-sm text-gray-600 mt-1">Review all changes before saving</p>
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
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {processing || isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating Activity...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Update Activity
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