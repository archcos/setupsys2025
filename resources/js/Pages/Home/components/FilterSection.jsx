import { Filter, Building2, Target, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { STAGES } from '../constants/stages';

export default function FilterSection({
  selectedOffices,
  toggleOffice,
  selectedStages,
  toggleStage,
  projectDetails,
  uniqueOffices,
  filterOpen,
  setFilterOpen,
  clearFilters,
  isStaff,
}) {
  const [officeDropdownOpen, setOfficeDropdownOpen] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const officeDropdownRef = useRef(null);
  const stageDropdownRef = useRef(null);

  const getStageCount = (stage) => {
    return projectDetails.filter(p => p.progress === stage).length;
  };

  const activeFilterCount = selectedOffices.length + selectedStages.length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (officeDropdownRef.current && !officeDropdownRef.current.contains(event.target)) {
        setOfficeDropdownOpen(false);
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target)) {
        setStageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="md:hidden w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Filters</span>
        </div>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Content */}
      <div className={`${filterOpen ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Office Dropdown */}
          {(!isStaff || uniqueOffices.length > 1) && (
            <div className="relative flex-1" ref={officeDropdownRef}>
              <button
                onClick={() => setOfficeDropdownOpen(!officeDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedOffices.length > 0 
                      ? `Office (${selectedOffices.length})` 
                      : 'Select Office'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${officeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Office Dropdown Menu */}
              {officeDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
                  {uniqueOffices.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No offices available</div>
                  ) : (
                    <div className="p-1">
                      {uniqueOffices.map((office) => {
                        const count = projectDetails.filter(p => p.office_name === office).length;
                        const isSelected = selectedOffices.includes(office);
                        return (
                          <button
                            key={office}
                            onClick={() => toggleOffice(office)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                              isSelected 
                                ? 'bg-blue-100 text-blue-900 font-medium' 
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isSelected && (
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                              )}
                              {office}
                            </span>
                            <span className="text-xs text-gray-500 font-normal">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stage Dropdown */}
          <div className="relative flex-1" ref={stageDropdownRef}>
            <button
              onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedStages.length > 0 
                    ? `Stage (${selectedStages.length})` 
                    : 'Select Stage'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${stageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Stage Dropdown Menu */}
            {stageDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
                <div className="p-1">
                  {[...STAGES, 'Terminated', 'Withdrawn', 'Disapproved'].map((stage) => {
                    const count = getStageCount(stage);
                    const isSelected = selectedStages.includes(stage);
                    return (
                      <button
                        key={stage}
                        onClick={() => toggleStage(stage)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          isSelected 
                            ? 'bg-purple-100 text-purple-900 font-medium' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && (
                            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                          )}
                          {stage}
                        </span>
                        <span className="text-xs text-gray-500 font-normal">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors shadow-sm font-medium text-sm"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedOffices.map((office) => (
              <span 
                key={`office-${office}`} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                <Building2 className="w-3 h-3" />
                {office}
                <button
                  onClick={() => toggleOffice(office)}
                  className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedStages.map((stage) => (
              <span 
                key={`stage-${stage}`} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
              >
                <Target className="w-3 h-3" />
                {stage}
                <button
                  onClick={() => toggleStage(stage)}
                  className="ml-0.5 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}