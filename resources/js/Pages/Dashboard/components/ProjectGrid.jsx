import { memo } from 'react';
import ProjectCard from './ProjectCard';

const ProjectGrid = memo(({ projects, onViewDetails }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.project_id}
          project={project}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
});

ProjectGrid.displayName = 'ProjectGrid';
export default ProjectGrid;
