import { useState, useMemo } from 'react';
import { REVIEW_APPROVAL_STAGES, TERMINAL_STATES } from '../constants/stages';

export function useProjectFilters(projectDetails, isStaff) {
  const [selectedOffices, setSelectedOffices] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const uniqueOffices = useMemo(() => {
    return [...new Set(projectDetails.map(p => p.office_name).filter(Boolean))].sort();
  }, [projectDetails]);

  const filteredProjects = useMemo(() => {
    return projectDetails.filter(project => {
      const officeMatch = selectedOffices.length === 0 || selectedOffices.includes(project.office_name);
      const stageMatch = selectedStages.length === 0 || selectedStages.includes(project.progress);

      return officeMatch && stageMatch;
    });
  }, [projectDetails, selectedOffices, selectedStages]);

  const toggleOffice = (office) => {
    setSelectedOffices(prev => 
      prev.includes(office) 
        ? prev.filter(o => o !== office)
        : [...prev, office]
    );
  };

  const toggleStage = (stage) => {
    setSelectedStages(prev => 
      prev.includes(stage) 
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const clearFilters = () => {
    setSelectedOffices([]);
    setSelectedStages([]);
    setFilterOpen(false);
  };

  return {
    selectedOffices,
    toggleOffice,
    selectedStages,
    toggleStage,
    filterOpen,
    setFilterOpen,
    uniqueOffices,
    filteredProjects,
    clearFilters,
  };
}