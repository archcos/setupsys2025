import { BarChart3, Calendar } from 'lucide-react';

export default function HeaderSection({ isStaff, userOfficeName, selectedYear, availableYears, onYearChange }) {
  return (
    <div className="flex flex-col gap-2 md:gap-0 md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
            {isStaff ? `${userOfficeName}` : 'Dashboard'}
          </h1>
          <p className="text-xs md:text-sm text-gray-600 truncate">
            {isStaff ? 'Project overview' : 'Overview & performance'}
          </p>
        </div>
      </div>

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
  );
}