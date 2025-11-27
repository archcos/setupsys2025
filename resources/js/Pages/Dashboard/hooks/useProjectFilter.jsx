import { useMemo } from 'react';

export const useProjectFilter = (projects, selectedFilter, searchTerm) => {
  return useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.project_title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      if (selectedFilter === 'all') return matchesSearch;
      
      if (selectedFilter === 'completed') 
        return matchesSearch && project.progress === 'Completed';
      
      if (selectedFilter === 'in-progress') 
        return matchesSearch && project.progress !== 'Completed';
      
      if (selectedFilter === 'urgent') {
        const impl = project.implementation || {};
        return matchesSearch && 
               project.progress === 'Implementation' && 
               (!impl.tarp_upload || !impl.pdc_upload);
      }
      
      return matchesSearch;
    });
  }, [projects, selectedFilter, searchTerm]);
};