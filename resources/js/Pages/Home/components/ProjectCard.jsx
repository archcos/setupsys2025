// resources/js/Pages/Dashboard/components/ProjectCard.jsx

import { Building2, MapPin, AlertTriangle } from 'lucide-react';
import { useProgressConfig } from '../hooks/useProgressConfig';
import { STAGES } from '../constants/stages';
import { REVIEW_APPROVAL_LABELS } from '../constants/label';

export default function ProjectCard({ project, isStaff }) {
  const { getProgressConfig, getStageIcon, isTerminal, isReviewApprovalStage } = useProgressConfig();
  const progressConfig = getProgressConfig(project.progress);
  const isInReviewApproval = isReviewApprovalStage(project.progress);
  const currentStageIndex = isInReviewApproval ? 2 : STAGES.indexOf(project.progress);

  return (
    <div className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow bg-white">
      {/* Project Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">{project.project_title}</h3>
        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1 flex-wrap">
          <Building2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{project.company_name}</span>
          {project.office_name && !isStaff && (
            <>
              <span className="text-gray-400">•</span>
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{project.office_name}</span>
            </>
          )}
        </p>
      </div>

      {/* Status Badge */}
      <div className={`mb-3 inline-block px-2 md:px-3 py-1 rounded-full ${progressConfig.bgColor}`}>
        <span className={`text-xs font-medium ${progressConfig.textColor}`}>
          {isTerminal(project.progress) 
            ? project.progress 
            : (isInReviewApproval 
              ? `R&A: ${REVIEW_APPROVAL_LABELS[project.progress] || project.progress}` 
              : (project.progress || 'No Progress'))}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className={`h-2 rounded-full transition-all duration-500 ${progressConfig.width} ${progressConfig.color}`}></div>
        </div>
      </div>

      {/* Stage Indicators */}
      {project.progress && !isTerminal(project.progress) ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-9 gap-1 md:gap-2 min-w-max md:min-w-0">
            {STAGES.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div
                  key={stage}
                  className={`flex flex-col items-center p-1.5 md:p-2 rounded-md text-center ${
                    isCompleted ? 'bg-green-50 border border-green-200' :
                    isCurrent ? 'bg-blue-50 border border-blue-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="mb-0.5">
                    {getStageIcon(stage, project.progress)}
                  </div>
                  <span className={`text-[10px] md:text-xs font-medium leading-tight line-clamp-2 ${
                    isCompleted ? 'text-green-700' :
                    isCurrent ? 'text-blue-700' :
                    'text-gray-500'
                  }`}>
                    {stage.split(' ').slice(0, 2).join('\n')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-red-700 text-xs md:text-sm">
              {isTerminal(project.progress) ? `Project ${project.progress}` : 'No Progress'}
            </p>
            <p className="text-xs text-red-600">
              {isTerminal(project.progress) ? 'This project is no longer active' : 'Status not available'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}