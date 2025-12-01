// components/FilterSection.jsx
import React from 'react';
import { Search, Filter, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react';
import { MONTHS } from '../constants/refundConstants';

const FilterSection = React.memo(({
  selectedMonth,
  selectedYear,
  searchInput,
  statusFilter,
  months,
  years,
  projects,
  flash,
  onMonthChange,
  onYearChange,
  onSearchChange,
  onStatusChange,
}) => {
  return (
    <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        
        {/* Month Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm"
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="restructured">Restructured</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="lg:col-span-1 md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            <Search className="w-4 h-4 inline mr-1" />
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Company or project..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
            />
            {searchInput && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600">
        {projects.data.length > 0 
          ? `Showing ${projects.data.length} projects for ${MONTHS.find(m => m.value == selectedMonth)?.label} ${selectedYear}`
          : 'No projects found for the selected period'
        }
      </div>

      {/* Flash Messages */}
      {flash.success && (
        <div className="mt-3 md:mt-4 bg-green-50 border border-green-200 text-green-800 px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 text-xs md:text-sm">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
          {flash.success}
        </div>
      )}
      {flash.error && (
        <div className="mt-3 md:mt-4 bg-red-50 border border-red-200 text-red-800 px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 text-xs md:text-sm">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
          {flash.error}
        </div>
      )}
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

export default FilterSection;