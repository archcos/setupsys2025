// resources/js/Pages/Home/components/ProjectsList.jsx

import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ProjectCard from './ProjectCard';
import { usePagination } from '../hooks/usePagination';
import { ITEMS_PER_PAGE } from '../constants/stages';

export default function ProjectsList({ 
  filteredProjects, 
  projectDetails, 
  isStaff, 
  selectedOffices,
  selectedStages,
  clearFilters 
}) {
  const { 
    currentPage, 
    totalPages, 
    currentItems, 
    nextPage, 
    prevPage, 
    hasNextPage, 
    hasPrevPage,
    goToPage 
  } = usePagination(filteredProjects, ITEMS_PER_PAGE);

  // Empty State
  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <div className="p-2 md:p-3 bg-gray-100 rounded-full w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 flex items-center justify-center">
          <Filter className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
        </div>
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">No Projects Found</h3>
        <p className="text-xs md:text-sm text-gray-600 mb-3">
          {selectedOffices.length > 0 || selectedStages.length > 0
            ? 'No projects match the filters' 
            : 'No records available'}
        </p>
        {(selectedOffices.length > 0 || selectedStages.length > 0) && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-3 h-3 md:w-4 md:h-4" />
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  // Results Counter
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length);

  return (
    <div className="space-y-4">
      {/* Results Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs md:text-sm text-blue-700">
          Showing <span className="font-bold">{startItem}</span> to <span className="font-bold">{endItem}</span> of <span className="font-bold">{filteredProjects.length}</span> projects
        </p>
        {totalPages > 1 && (
          <span className="text-xs md:text-sm text-blue-600">
            Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Projects Grid */}
      <div className="space-y-3 md:space-y-4">
        {currentItems.map((project) => (
          <ProjectCard 
            key={project.project_id} 
            project={project} 
            isStaff={isStaff}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200">
          {/* Previous Button */}
          <button
            onClick={prevPage}
            disabled={!hasPrevPage}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
              hasPrevPage 
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
                : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and adjacent pages
              const isVisible = 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - currentPage) <= 1;

              if (!isVisible && page !== 2 && page !== totalPages - 1) {
                return null;
              }

              if (page === 2 && currentPage > 3) {
                return <span key="ellipsis-start" className="px-1 text-gray-500">...</span>;
              }

              if (page === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key="ellipsis-end" className="px-1 text-gray-500">...</span>;
              }

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
              hasNextPage 
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
                : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}