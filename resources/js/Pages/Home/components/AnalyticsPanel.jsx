// resources/js/Pages/Home/components/AnalyticsPanel.jsx

import { 
  BarChart4, Ban, XCircle, AlertCircle, MapPin, DollarSign, FileText,
  Building2
} from 'lucide-react';

// Province/Office ordering
const OFFICE_ORDER = [
  'Bukidnon',
  'Camiguin',
  'Lanao del Norte',
  'Misamis Occidental',
  'Misamis Oriental',
];

export default function AnalyticsPanel({ analytics, selectedYear, onDownloadPDF, onJumpToProjects }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Calculate In Progress count (everything not Completed, Withdrawn, or Terminated)
  const getInProgressCount = () => {
    const total = analytics.total || 0;
    const completed = analytics.completed || 0;
    const withdrawn = analytics.withdrawn || 0;
    const terminated = analytics.terminated || 0;
    // In Progress includes all projects that are not Completed, Withdrawn, or Terminated
    // This includes: "In Progress", "For Approval", "For Verification", etc.
    return total - completed - withdrawn - terminated;
  };

  const inProgressCount = getInProgressCount();

  // Sort offices by predefined order
  const sortByOfficeOrder = (entries) => {
    return [...entries].sort(([officeA], [officeB]) => {
      const indexA = OFFICE_ORDER.indexOf(officeA);
      const indexB = OFFICE_ORDER.indexOf(officeB);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return officeA.localeCompare(officeB);
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onJumpToProjects}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Jump to Project List
        </button>
        <button
          onClick={onDownloadPDF}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Print Analytics Report
        </button>
      </div>

      {/* Project Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage Distribution */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Stage Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analytics.stageDistribution).map(([stage, data]) => (
              <div key={stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">{stage}</span>
                  <span className="text-gray-500">
                    {data.count} ({typeof data.percentage === 'number' ? data.percentage.toFixed(2) : '0.00'}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${data.percentage || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal States */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Terminal States</h3>
          <div className="space-y-4">
            {/* Withdrawn */}
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Withdrawn</span>
                </div>
                <span className="text-lg font-bold text-orange-700">
                  {analytics.withdrawn || 0}
                </span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  style={{ width: `${((analytics.withdrawn || 0) / (analytics.total || 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-orange-700 mt-1">
                {analytics.total > 0 ? ((analytics.withdrawn / analytics.total) * 100).toFixed(2) : '0.00'}% of total projects
              </p>
            </div>

            {/* Terminated */}
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Terminated</span>
                </div>
                <span className="text-lg font-bold text-red-700">
                  {analytics.terminated || 0}
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  style={{ width: `${((analytics.terminated || 0) / (analytics.total || 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-red-700 mt-1">
                {analytics.total > 0 ? ((analytics.terminated / analytics.total) * 100).toFixed(2) : '0.00'}% of total projects
              </p>
            </div>

            {/* Disapproved */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Disapproved</span>
                </div>
                <span className="text-lg font-bold text-gray-700">
                  {analytics.disapproved || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full"
                  style={{ width: `${((analytics.disapproved || 0) / (analytics.total || 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-700 mt-1">
                {analytics.total > 0 ? ((analytics.disapproved / analytics.total) * 100).toFixed(2) : '0.00'}% of total projects
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Project Cost by Province */}
      {analytics.provinceCostsFormatted && analytics.provinceCostsFormatted.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Total Project Cost by Province
          </h3>
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.provinceCostsFormatted.map((item) => (
                <div key={item.province} className="bg-white rounded-lg p-3 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.province}</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Cost:</p>
                      <p className="text-lg font-bold text-indigo-700">
                        {formatCurrency(item.totalCost)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-600">
                        {item.projectCount} project{item.projectCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {typeof item.percentageOfTotal === 'number' 
                          ? item.percentageOfTotal.toFixed(2) 
                          : '0.00'}% of total
                      </p>
                    </div>
                    {item.projectCount > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Average per project:</p>
                        <p className="text-sm font-semibold text-indigo-600">
                          {formatCurrency(item.averageCost)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Summary */}
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <span className="text-sm font-semibold text-gray-900">Total Project Cost</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-indigo-700">
                    {formatCurrency(analytics.totalProjectCost)}
                  </span>
                  {analytics.total > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Average: {formatCurrency(analytics.averageProjectCost)} per project
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Office Performance Table */}
      {Object.keys(analytics.officePerformance).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Office Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Office</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Total</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Active</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Completed</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">In Progress</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Withdrawn</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Terminated</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {sortByOfficeOrder(Object.entries(analytics.officePerformance))
                  .map(([office, data]) => {
                    // Calculate In Progress for this office
                    const inProgressForOffice = data.total - (data.completed || 0) - (data.withdrawn || 0) - (data.terminated || 0);
                    return (
                      <tr key={office} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-gray-900">{office}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{data.total}</td>
                        <td className="px-3 py-2 text-center text-blue-600 font-medium">
                          {data.activeCount || (data.total - data.withdrawn - data.terminated - data.disapproved)}
                        </td>
                        <td className="px-3 py-2 text-center text-green-600 font-medium">{data.completed || 0}</td>
                        <td className="px-3 py-2 text-center text-purple-600 font-medium">{inProgressForOffice}</td>
                        <td className="px-3 py-2 text-center text-orange-600 font-medium">{data.withdrawn || 0}</td>
                        <td className="px-3 py-2 text-center text-red-600 font-medium">{data.terminated || 0}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (data.completionRate || 0) >= 75 ? 'bg-green-100 text-green-700' :
                            (data.completionRate || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {typeof data.completionRate === 'number' 
                              ? data.completionRate.toFixed(2) 
                              : '0.00'}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}