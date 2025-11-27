import { STAGES, REVIEW_APPROVAL_STAGES, REVIEW_APPROVAL_LABELS } from './constants';

export const isTerminatedOrWithdrawn = (progress) => 
  progress === 'Terminated' || progress === 'Withdrawn';

export const isReviewApprovalStage = (progress) => 
  REVIEW_APPROVAL_STAGES.includes(progress);

export const getReviewApprovalLabel = (progress) => 
  REVIEW_APPROVAL_LABELS[progress] || progress;

export const getProjectProgress = (project) => {
  if (isTerminatedOrWithdrawn(project.progress)) return 0;
  const currentStageIndex = isReviewApprovalStage(project.progress) 
    ? 2 
    : STAGES.indexOf(project.progress);
  return Math.round((currentStageIndex / (STAGES.length - 1)) * 100);
};

export const getProjectStatus = (project) => {
  if (isTerminatedOrWithdrawn(project.progress)) {
    return { status: 'terminated', color: 'red', message: project.progress };
  }
  
  const impl = project.implementation || {};
  const tags = impl.tags || [];
  const projectCost = parseFloat(project?.project_cost || 0);
  const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
  const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

  if (project.progress === 'Completed') {
    return { status: 'completed', color: 'green', message: 'Project completed' };
  }
  
  if (isReviewApprovalStage(project.progress)) {
    return { 
      status: 'in-review', 
      color: 'indigo', 
      message: `R&A: ${getReviewApprovalLabel(project.progress)}` 
    };
  }
  
  if (project.progress === 'Implementation') {
    const missingItems = [];
    if (!impl.tarp_upload) missingItems.push('Tarpaulin');
    if (!impl.pdc_upload) missingItems.push('PDC');
    if (percentage < 50) missingItems.push('First Untagging (50%)');
    if (percentage < 100) missingItems.push('Final Untagging (100%)');
    
    if (missingItems.length > 0) {
      return { 
        status: 'needs-attention', 
        color: 'orange', 
        message: `Missing: ${missingItems.slice(0, 2).join(', ')}${missingItems.length > 2 ? '...' : ''}` 
      };
    }
  }
  
  return { status: 'in-progress', color: 'blue', message: 'In progress' };
};

export const getTaggingProgress = (project) => {
  const impl = project.implementation || {};
  const tags = impl.tags || [];
  const projectCost = parseFloat(project?.project_cost || 0);
  const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
  return projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;
};

export const fmtDate = (date) => {
  return date 
    ? `Completed on ${new Date(date).toLocaleDateString()}`
    : 'In Progress';
};