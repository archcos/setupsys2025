import { memo, lazy, Suspense } from 'react';
import { X, FileText, Target, TrendingUp, CheckCircle, Circle, AlertCircle, Calendar, Clock, BarChart3, Award, Sparkles } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { 
  isTerminatedOrWithdrawn, 
  isReviewApprovalStage, 
  getReviewApprovalLabel,
  getTaggingProgress 
} from '../utils/projectHelpers';
import { STAGES } from '../utils/constants';

const renderStatus = (value) =>
  value ? (
    <CheckCircle className="text-green-500 w-5 h-5" />
  ) : (
    <Circle className="text-gray-400 w-5 h-5" />
  );

const fmtDate = (date) => {
  return date
    ? <span className="font-medium text-green-700">{`Completed on ${new Date(date).toLocaleDateString()}`}</span>
    : <span className="italic text-gray-500">In Progress</span>;
};

const ProjectDetailsModal = memo(({ project, isOpen, onClose }) => {
  if (!isOpen || !project) return null;

  const isInReview = isReviewApprovalStage(project.progress);
  const isTerminated = isTerminatedOrWithdrawn(project.progress);
  const currentStageIndex = isTerminated ? -1 : (isInReview ? 2 : STAGES.indexOf(project.progress));
  const progressPercent = isTerminated ? 0 : Math.round((currentStageIndex / (STAGES.length - 1)) * 100);
  
  const hasReached = (stage) => {
    if (isTerminated) return false;
    const stageIdx = STAGES.indexOf(stage);
    if (isInReview && stageIdx === 2) return true;
    return currentStageIndex >= stageIdx;
  };

  const implementation = project.implementation || {};
  const tags = implementation.tags || [];
  const projectCost = parseFloat(project?.project_cost || 0);
  const totalTagged = tags.reduce((sum, t) => sum + parseFloat(t.tag_amount || 0), 0);
  const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{project.project_title}</h2>
              <p className="text-blue-50 text-sm opacity-90">Project Timeline & Status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {isTerminated && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="font-bold text-red-700">Project {project.progress}</h3>
                    <p className="text-sm text-red-600">This project is no longer active</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Target className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Project Cost</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">₱{projectCost.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Target className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Current Stage</p>
                </div>
                <p className="text-lg font-bold text-green-700 leading-tight">
                  {isTerminated ? project.progress : (isInReview ? 'Project Review' : project.progress)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Progress</p>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-purple-700">{progressPercent}%</p>
                  <div className="flex-1 h-2 bg-purple-200 rounded-full overflow-hidden mb-1">
                    <div className="bg-purple-600 h-full transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Timeline Items */}
              {[
                { stage: 'Company Profile', icon: FileText, label: 'Company Details', date: project.company?.created_at },
                { stage: 'Project Created', icon: FileText, label: 'Project Details', date: project.created_at },
              ].map(item => (
                <div key={item.stage} className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <item.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-800">{item.stage}</h3>
                  </div>
                  <div className="ml-11">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {renderStatus(Boolean(item.date || item.stage === 'Company Profile' && project.company?.created_at))}
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                      {item.date && <span className="text-xs text-gray-500">{fmtDate(item.date)}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {/* Project Review */}
              <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">Project Review</h3>
                </div>
                <div className="ml-11">
                  {isInReview ? (
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">{getReviewApprovalLabel(project.progress)}</span>
                    </div>
                  ) : hasReached("Project Review") ? (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">Completed</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Circle className="w-5 h-5" />
                      <span>Pending</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Implementation Section */}
              <div className="bg-white rounded-lg border-2 border-gray-100 p-4 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Target className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">Project Implementation</h3>
                </div>
                <div className="ml-11 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {renderStatus(Boolean(implementation.tarp_upload))}
                      <span className="text-gray-700">Signboard</span>
                    </div>
                    {implementation.tarp_upload && <span className="text-xs text-gray-500">{fmtDate(implementation.tarp_upload)}</span>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {renderStatus(Boolean(implementation.pdc_upload))}
                      <span className="text-gray-700">Post-Dated Check</span>
                    </div>
                    {implementation.pdc_upload && <span className="text-xs text-gray-500">{fmtDate(implementation.pdc_upload)}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {renderStatus(percentage >= 50)}
                    <span className="text-gray-700">First Untagging (50%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {renderStatus(percentage >= 100)}
                    <span className="text-gray-700">Final Untagging (100%)</span>
                  </div>
                </div>
              </div>

              {/* Equipment Untagging */}
              {tags.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-800">Equipment Untagging</h4>
                  </div>
                  <div className="space-y-1.5">
                    {tags.map((tag, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-white/60 px-3 py-2 rounded-lg">
                        <span className="text-gray-700">{tag.tag_name}</span>
                        <span className="font-bold text-blue-600">₱{parseFloat(tag.tag_amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-700">Total Tagged: <span className="font-bold text-blue-600">₱{totalTagged.toLocaleString()}</span></span>
                      <span className="text-xs text-gray-600">{percentage.toFixed(1)}% of ₱{projectCost.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all" style={{ width: `${Math.min(percentage, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

ProjectDetailsModal.displayName = 'ProjectDetailsModal';
export default ProjectDetailsModal;