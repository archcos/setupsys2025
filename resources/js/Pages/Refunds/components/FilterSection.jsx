// components/FilterSection.jsx
import React from 'react';
import { Search, Filter, Calendar, CheckCircle, AlertCircle, X, Building2 } from 'lucide-react';
import { MONTHS } from '../constants/refundConstants';

const FilterSection = React.memo(({
  selectedMonth,
  selectedYear,
  searchInput,
  statusFilter,
  perPage,
  months,
  years,
  projects,
  flash,
  onMonthChange,
  onYearChange,
  onSearchChange,
  onStatusChange,
  onPerPageChange,
  // new props
  isRPMO,
  offices,
  officeFilter,
  onOfficeChange,
  withWithdrawn,
  onWithdrawnToggle,
  withTerminated,
  onTerminatedToggle,
}) => {
  return (
    <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

      {/* Row 1: Search + Entries */}
      <div className="flex gap-2 md:gap-3">
        {/* Search — flex-1 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search proponent or project..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-8 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Entries — right side */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-shrink-0">
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-3"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs text-gray-500 hidden md:inline">entries</span>
        </div>
      </div>

      {/* Row 2: Month + Year + Status + Office (RPMO/AU only) */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Month */}
        <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="restructured">Restructured</option>
          </select>
        </div>

        {/* Office — RPMO/AU only */}
        {isRPMO && offices?.length > 0 && (
          <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={officeFilter}
              onChange={(e) => onOfficeChange(e.target.value)}
              className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2 md:py-2.5"
            >
              <option value="">All Offices</option>
              {offices.map((o) => (
                <option key={o.office_id} value={o.office_id}>
                  {o.office_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Row 3: Progress checkboxes — RPMO/AU only */}
      {isRPMO && (
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide flex-shrink-0">
            Show also:
          </span>

          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={withWithdrawn}
                onChange={(e) => onWithdrawnToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border border-gray-300 bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-colors flex items-center justify-center">
                {withWithdrawn && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs md:text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              Withdrawn
            </span>
            {withWithdrawn}
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={withTerminated}
                onChange={(e) => onTerminatedToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border border-gray-300 bg-white peer-checked:bg-red-500 peer-checked:border-red-500 transition-colors flex items-center justify-center">
                {withTerminated && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs md:text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              Terminated
            </span>
            {withTerminated}
          </label>
        </div>
      )}

      {/* Flash messages */}
      {flash?.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs md:text-sm text-green-800">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
          {flash.success}
        </div>
      )}
      {flash?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs md:text-sm text-red-800">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
          {flash.error}
        </div>
      )}
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

export default FilterSection;