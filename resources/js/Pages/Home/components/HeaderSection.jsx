// resources/js/Pages/Home/components/HeaderSection.jsx

import { BarChart3, Calendar, Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function HeaderSection({ 
  isStaff, 
  userOfficeName, 
  selectedYear, 
  availableYears, 
  onYearChange,
  showDownloadMenu,
  setShowDownloadMenu,
  onDownloadCSV,
  onDownloadPDF,
}) {
  return (
    <div className="flex flex-col gap-2 md:gap-0 md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold truncate">
            {isStaff ? `${userOfficeName}` : 'Dashboard'}
          </h1>
          <p className="text-xs md:text-sm truncate">
            {isStaff ? 'Project overview' : 'Overview & performance'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Download Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Download Options"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {showDownloadMenu && (
            <>
              {/* Backdrop to close dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDownloadMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    onDownloadCSV();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium">Download CSV</div>
                    <div className="text-xs text-gray-500">Export filtered projects</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onDownloadPDF();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Print Analytics PDF</div>
                    <div className="text-xs text-gray-500">Comprehensive report</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <select
            value={selectedYear}
            onChange={onYearChange}
            className="pl-2 pr-6 py-1 text-xs md:text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Years</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}