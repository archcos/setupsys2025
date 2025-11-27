import { lazy, Suspense } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Calendar } from 'lucide-react';

import StatsCard from './components/StatsCard';
import FilterBar from './components/FilterBar';
import ProjectGrid from './components/ProjectGrid';
import EmptyState from './components/EmptyState';

import { useProjectFilter } from './hooks/useProjectFilter';
import { useProjectStats } from './hooks/useProjectStats';
import { useModal } from './hooks/useModal';

import { useState } from 'react';

const ProjectDetailsModal = lazy(() => import('./components/ProjectDetailsModal'));

export default function Dashboard() {
  const { projectDetails = [] } = usePage().props;
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { selectedProject, isModalOpen, openModal, closeModal } = useModal();
  
  const filteredProjects = useProjectFilter(projectDetails, selectedFilter, searchTerm);
  const stats = useProjectStats(projectDetails);

  const filters = [
    { key: 'all', label: 'All Projects', count: stats.totalProjects },
    { key: 'in-progress', label: 'In Progress', count: stats.inProgressProjects },
    { key: 'completed', label: 'Completed', count: stats.completedProjects },
    { key: 'urgent', label: 'Needs Attention', count: stats.needsAttentionProjects }
  ];

  const currentFilterLabel = filters.find(f => f.key === selectedFilter)?.label || 'All Projects';

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedFilter('all');
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <Head title="Dashboard" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your projects</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-800" />
          <span className="text-sm">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Projects" count={stats.totalProjects} type="total" />
        <StatsCard label="In Progress" count={stats.inProgressProjects} type="progress" />
        <StatsCard label="Completed" count={stats.completedProjects} type="completed" />
        <StatsCard label="Needs Attention" count={stats.needsAttentionProjects} type="attention" />
      </div>

      <FilterBar 
        filters={filters}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="mt-6">
        {filteredProjects.length > 0 ? (
          <ProjectGrid projects={filteredProjects} onViewDetails={openModal} />
        ) : (
          <EmptyState 
            searchTerm={searchTerm}
            selectedFilter={selectedFilter}
            filterLabel={currentFilterLabel}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      <Suspense fallback={null}>
        <ProjectDetailsModal 
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      </Suspense>
    </main>
  );
}

