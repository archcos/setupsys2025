import { useForm, Link, Head } from '@inertiajs/react';
import { ChevronLeft, Plus, Info, Check, Loader2, AlertCircle } from 'lucide-react';

export default function Create({ office_id }) {
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    details: '', // ✅ changed from body
    office_id: office_id,
    start_date: '',
    end_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/announcements');
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="Create Announcement" />
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Announcements
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Announcement</h1>
              <p className="text-gray-600 mt-1">This announcement will be linked to your office automatically</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Announcement Details</h2>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                    placeholder="Enter announcement title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    maxLength={45} 
                    required
                />
                {errors.title && (
                  <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Details
                </label>
                <textarea
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white resize-none"
                    placeholder="Write the announcement here..."
                    value={data.details}
                    onChange={(e) => setData('details', e.target.value)}
                    maxLength={150} 
                    required
                />
                {errors.details && (
                  <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.details}
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date (Announcement will Appear)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  value={data.start_date}
                  onChange={(e) => setData('start_date', e.target.value)}
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date (Announcement will Disappear)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  value={data.end_date}
                  onChange={(e) => setData('end_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Post?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your announcement will be published under your office
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/announcements"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                  processing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Post Announcement
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
