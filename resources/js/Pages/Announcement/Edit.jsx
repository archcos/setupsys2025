import { useForm, Link, Head } from '@inertiajs/react';
import { ChevronLeft, Save, Info, Loader2, AlertCircle } from 'lucide-react';

export default function Edit({ announcement }) {
  const { data, setData, put, processing, errors } = useForm({
    title: announcement.title || '',
    details: announcement.details || '',
    start_date: announcement.start_date || '',
    end_date: announcement.end_date || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/announcements/${announcement.announce_id}`);
  };

  return (
    <main className="flex-1 min-h-screen bg-gray-50 overflow-y-auto">
      <Head title="Edit Announcement" />
      <div className="max-w-3xl mx-auto p-3 md:p-6">
        {/* Header Section */}
        <div className="mb-4 md:mb-8">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
              <Save className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Edit Announcement</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                Update your announcement details and save changes
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-3 md:space-y-6">
          {/* Details Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Details</h2>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Title */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                  placeholder="Enter announcement title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  required
                />
                {errors.title && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                  Details
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white resize-none transition-all"
                  placeholder="Write the announcement here..."
                  value={data.details}
                  onChange={(e) => setData('details', e.target.value)}
                  required
                />
                {errors.details && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                    {errors.details}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                    value={data.start_date}
                    onChange={(e) => setData('start_date', e.target.value)}
                  />
                  {errors.start_date && (
                    <div className="text-red-500 text-xs md:text-sm mt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                      {errors.start_date}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                    value={data.end_date}
                    onChange={(e) => setData('end_date', e.target.value)}
                  />
                  {errors.end_date && (
                    <div className="text-red-500 text-xs md:text-sm mt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0" />
                      {errors.end_date}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="mb-4 md:mb-0 md:flex md:items-center md:justify-between gap-4">
              <div className="mb-4 md:mb-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Save Changes?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                  Your announcement will be updated immediately.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full md:w-auto">
                <Link
                  href="/announcements"
                  className="flex items-center justify-center px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 font-medium text-xs md:text-base rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={processing}
                  className={`flex items-center justify-center px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-medium text-xs md:text-base transition-all duration-200 w-full sm:w-auto ${
                    processing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Save</span>
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