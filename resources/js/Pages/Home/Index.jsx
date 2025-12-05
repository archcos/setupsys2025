// resources/js/Pages/Home.jsx

import { usePage, Head } from '@inertiajs/react';
import { TrendingUp } from 'lucide-react';

// Import Components
import HeaderSection from '../Home/components/HeaderSection';
import StatsGrid from '../Home/components/StatsGrid';
import ProjectsPerOfficeCard from '../Home/components/ProjectsPerOfficeCard';
import FilterSection from '../Home/components/FilterSection';
import ProjectsList from '../Home/components/ProjectsList';

// Import Hooks
import { useProjectFilters } from '../Home/hooks/useProjectFilters';

export default function Home() {
  const {
    projectsPerOffice,
    selectedYear,
    availableYears,
    userOfficeName,
    projectDetails = [],
    userRole,
  } = usePage().props;

  const isStaff = userRole === 'staff';

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

  // Handle year change
  const handleYearChange = (e) => {
    const year = e.target.value;
    if (year === 'all') {
      window.location.href = '?year=all';
    } else {
      window.location.href = `?year=${year}`;
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
        />

        {/* Stats Grid */}
        <StatsGrid projectDetails={projectDetails} />

        {/* Projects Per Office - Hide for staff */}
        {!isStaff && (
          <ProjectsPerOfficeCard 
            projectsPerOffice={projectsPerOffice}
            selectedYear={selectedYear}
          />
        )}

        {/* Project Progress Status Card */}
        <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border border-gray-100">
          
          {/* Card Header */}
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="p-1 md:p-1.5 bg-purple-100 rounded-md">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {isStaff ? 'Project Progress' : 'Progress Status'}
              </h2>
              <p className="text-xs text-gray-600">Stage tracking for {selectedYear}</p>
            </div>
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
    </main>
  );
}