import { usePage, Head, router } from '@inertiajs/react';
import { TrendingUp, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useState, useRef } from 'react';

// Import Components
import HeaderSection from '../Home/components/HeaderSection';
import StatsGrid from '../Home/components/StatsGrid';
import ProjectsPerOfficeCard from '../Home/components/ProjectsPerOfficeCard';
import FilterSection from '../Home/components/FilterSection';
import ProjectsList from '../Home/components/ProjectsList';
import AnalyticsPanel from '../Home/components/AnalyticsPanel';

// Import Hooks
import { useProjectFilters } from '../Home/hooks/useProjectFilters';
import { useAnalytics } from '../Home/hooks/useAnalytics';
import { useDownload } from '../Home/hooks/useDownload';

export default function Home() {
  const {
    projectsPerOffice,
    projectCostByProvince,
    totalProjectCost,
    activeProjectCost,
    withdrawnProjectCost,
    terminatedProjectCost,
    disapprovedProjectCost,
    selectedYear,
    availableYears,
    userOfficeName,
    projectDetails = [],
    userRole,
    userOfficeId,
    canViewAnalytics,
    roleSpecificAnalytics,
  } = usePage().props;

  const isStaff = userRole === 'staff';
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const projectsListRef = useRef(null);

  // Use filter hook
  const {
    selectedOffices,
    toggleOffice,
    selectedStages,
    toggleStage,
    filterOpen,
    setFilterOpen,
    uniqueOffices,
    filteredProjects,
    clearFilters,
  } = useProjectFilters(projectDetails, isStaff);

  // Analytics calculations
  const analytics = useAnalytics(
    projectDetails, 
    projectCostByProvince, 
    totalProjectCost,
    activeProjectCost,
    withdrawnProjectCost,
    terminatedProjectCost,
    disapprovedProjectCost
  );

  // Download functionality
  const { 
    downloadCSV, 
    downloadAnalyticsPDF,
    showOfficeModal,
    selectedOffices: selectedReportOffices,
    allOffices,
    toggleOfficeSelection,
    selectAllOffices,
    clearAllOffices,
    closeModal,
    generateReportWithOffices
  } = useDownload(filteredProjects, analytics, selectedYear);

  // Handle year change using Inertia router
  const handleYearChange = (e) => {
    const year = e.target.value;
    if (year === 'all') {
      router.get('/', { year: 'all' }, { preserveState: false, preserveScroll: false });
    } else {
      router.get('/', { year: year }, { preserveState: false, preserveScroll: false });
    }
  };

  // Scroll to projects list
  const scrollToProjects = () => {
    if (projectsListRef.current) {
      projectsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="flex-1 p-3 md:p-4 overflow-y-auto">
      <Head title="Dashboard" />

      <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
        
        {/* Header Section */}
        <HeaderSection 
          isStaff={isStaff}
          userOfficeName={userOfficeName}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={handleYearChange}
          showDownloadMenu={showDownloadMenu}
          setShowDownloadMenu={setShowDownloadMenu}
          onDownloadCSV={downloadCSV}
          onDownloadPDF={downloadAnalyticsPDF}
        />

        {/* Stats Grid - Pass role information for filtering */}
        <StatsGrid 
          projectDetails={projectDetails} 
          analytics={roleSpecificAnalytics || analytics}
          userRole={userRole}
          userOfficeId={userOfficeId}
        />

        {/* Office Overview Section - Toggle between Projects Per Office and Analytics */}
        {!isStaff && (
          <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                {showAnalytics ? 'Project Analytics' : 'Office Overview'}
              </h2>
              {canViewAnalytics && (
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md flex items-center gap-2 text-sm font-medium"
                >
                  <TrendingUp className="w-4 h-4" />
                  {showAnalytics ? 'View Office Overview' : 'View Analytics'}
                </button>
              )}
            </div>
            
            {/* Toggle between Projects Per Office and Analytics */}
            {showAnalytics ? (
              <AnalyticsPanel 
                analytics={analytics}
                selectedYear={selectedYear}
                onDownloadPDF={downloadAnalyticsPDF}
                onJumpToProjects={scrollToProjects}
              />
            ) : (
              <ProjectsPerOfficeCard 
                projectsPerOffice={projectsPerOffice}
                selectedYear={selectedYear}
              />
            )}
          </div>
        )}

        {/* Analytics Panel for Staff users who can view it */}
        {isStaff && canViewAnalytics && showAnalytics && (
          <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                Project Analytics
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={scrollToProjects}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Jump to Projects
                </button>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 text-sm font-medium"
                >
                  Hide Analytics
                </button>
              </div>
            </div>
            <AnalyticsPanel 
              analytics={analytics}
              selectedYear={selectedYear}
              onDownloadPDF={downloadAnalyticsPDF}
              onJumpToProjects={scrollToProjects}
            />
          </div>
        )}

        {/* View Analytics Button for Staff users */}
        {isStaff && canViewAnalytics && !showAnalytics && (
          <button
            onClick={() => setShowAnalytics(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2 text-sm font-medium"
          >
            <TrendingUp className="w-4 h-4" />
            View Analytics
          </button>
        )}

        {/* Rest of your component remains the same */}
        {/* Project List Section */}
        <div ref={projectsListRef} className="bg-white rounded-lg shadow-md p-3 md:p-5 border border-gray-100">
          
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1 md:p-1.5 bg-purple-100 rounded-md">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {isStaff ? 'Project List' : 'All Projects'}
                </h2>
                <p className="text-xs text-gray-600">Filter and browse projects for {selectedYear}</p>
              </div>
            </div>
            
            {/* Quick Export Button */}
            <button
              onClick={() => downloadCSV(filteredProjects)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>

          {/* Filter Section */}
          <FilterSection 
            selectedOffices={selectedOffices}
            toggleOffice={toggleOffice}
            selectedStages={selectedStages}
            toggleStage={toggleStage}
            projectDetails={projectDetails}
            uniqueOffices={uniqueOffices}
            filterOpen={filterOpen}
            setFilterOpen={setFilterOpen}
            clearFilters={clearFilters}
            isStaff={isStaff}
          />

          {/* Projects List with Pagination */}
          <div className="mt-4">
            <ProjectsList 
              filteredProjects={filteredProjects}
              projectDetails={projectDetails}
              isStaff={isStaff}
              selectedOffices={selectedOffices}
              selectedStages={selectedStages}
              clearFilters={clearFilters}
            />
          </div>
        </div>

      </div>
      
      {/* Office Selection Modal */}
      {showOfficeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Select Offices for Report</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-between mb-4">
                <button
                  onClick={selectAllOffices}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllOffices}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-2">
                {allOffices.map(office => (
                  <label key={office} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReportOffices.includes(office)}
                      onChange={() => toggleOfficeSelection(office)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-700">{office}</span>
                  </label>
                ))}
              </div>
              
              {allOffices.length === 0 && (
                <p className="text-center text-gray-500 py-8">No offices available</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateReportWithOffices}
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}