import { Calendar, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

export default function TimelineSection({ data, setData, errors }) {
  // Ensure proper formatting for month inputs
  const formatToMonth = (dateStr) => {
    if (!dateStr) return '';
    // Handle both YYYY-MM-DD and YYYY-MM formats
    return dateStr.slice(0, 7);
  };

  return (
    <FormCard icon={Calendar} title="Timeline & Dates" iconBgColor="bg-green-100" iconColor="text-green-600">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Initial Project Fund Release</label>
          <input
            type="month"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={formatToMonth(data.release_initial)}
            onChange={(e) => setData('release_initial', e.target.value)}
          />
          {errors.release_initial && (
            <div className="text-red-500 text-xs mt-1">{errors.release_initial}</div>
          )}
        </div>
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">End of Fund Release</label>
          <input
            type="month"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={formatToMonth(data.release_end)}
            onChange={(e) => setData('release_end', e.target.value)}
          />
          {errors.release_end && (
            <div className="text-red-500 text-xs mt-1">{errors.release_end}</div>
          )}
        </div>
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Initial Refund</label>
          <input
            type="month"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={formatToMonth(data.refund_initial)}
            onChange={(e) => setData('refund_initial', e.target.value)}
          />
          {errors.refund_initial && (
            <div className="text-red-500 text-xs mt-1">{errors.refund_initial}</div>
          )}
        </div>
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">End of Refund</label>
          <input
            type="month"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={formatToMonth(data.refund_end)}
            onChange={(e) => setData('refund_end', e.target.value)}
          />
          {errors.refund_end && (
            <div className="text-red-500 text-xs mt-1">{errors.refund_end}</div>
          )}
        </div>
      </div>
    </FormCard>
  );
}