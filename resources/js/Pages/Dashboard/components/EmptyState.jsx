import { memo } from 'react';
import { FileText } from 'lucide-react';

const EmptyState = memo(({ 
  searchTerm, 
  selectedFilter, 
  filterLabel,
  onClearFilters 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
      <div className="text-center">
        <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchTerm ? 'No matching projects found' : 'No projects in this category'}
        </h3>
        <p className="text-gray-500">
          {searchTerm 
            ? `No projects match "${searchTerm}" in the ${filterLabel.toLowerCase()} category`
            : `You don't have any ${filterLabel.toLowerCase()} at the moment`
          }
        </p>
        {(searchTerm || selectedFilter !== 'all') && (
          <button
            onClick={onClearFilters}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Show All Projects
          </button>
        )}
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
export default EmptyState;
