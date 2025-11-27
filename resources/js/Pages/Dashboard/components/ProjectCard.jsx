import { memo } from 'react';
import { FileText, CheckCircle, Circle, Eye, ChevronRight, FileCheck } from 'lucide-react';
import { 
  getProjectProgress, 
  getProjectStatus, 
  getTaggingProgress,
  isReviewApprovalStage,
  getReviewApprovalLabel 
} from '../utils/projectHelpers';
import { STATUS_COLORS, STATUS_TEXT_COLORS } from '../utils/constants';

const ProjectCard = memo(({ project, onViewDetails }) => {
  const progress = getProjectProgress(project);
  const status = getProjectStatus(project);
  const impl = project.implementation || {};
  const taggingProgress = getTaggingProgress(project);
  const projectCost = parseFloat(project?.project_cost || 0);

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${
        STATUS_COLORS[status.status] || 'border-gray-200'
      }`}
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_TEXT_COLORS[status.status]}`}>
              {status.message}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Progress</div>
            <div className="text-lg font-bold text-blue-600">{progress}%</div>
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
          {project.project_title}
        </h3>
        
        <div className="text-sm text-gray-600 mb-3">
          Budget: <span className="font-semibold text-blue-600">₱{projectCost.toLocaleString()}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {isReviewApprovalStage(project.progress) && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Review & Approval Stage</span>
              </div>
              <p className="text-sm text-indigo-600 font-medium">
                {getReviewApprovalLabel(project.progress)}
              </p>
            </div>
          )}

          {project.progress === 'Implementation' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-700 mb-2">Implementation Status</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  {impl.tarp_upload ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-xs">Tarpaulin</span>
                </div>
                <div className="flex items-center gap-2">
                  {impl.pdc_upload ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-xs">PDC</span>
                </div>
              </div>
              
              {impl.tags?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Equipment Untagging</span>
                    <span className="text-xs font-medium">{taggingProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-green-500 h-1 rounded-full"
                      style={{ width: `${Math.min(taggingProgress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-600">
            Current Stage: <span className="font-medium text-gray-900">
              {isReviewApprovalStage(project.progress) ? 'Review & Approval' : project.progress}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => onViewDetails(project)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            View Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
export default ProjectCard;