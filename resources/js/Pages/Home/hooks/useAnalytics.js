// resources/js/Pages/Home/hooks/useAnalytics.js

import { useMemo } from 'react';
import { STAGES, REVIEW_APPROVAL_STAGES } from '../constants/stages';

// Province mapping based on office_id
const PROVINCE_ORDER = [
  'Bukidnon',
  'Camiguin',
  'Lanao del Norte',
  'Misamis Occidental',
  'Misamis Oriental',
];

export function useAnalytics(projectDetails, projectCostByProvince, totalProjectCost, activeProjectCost, withdrawnProjectCost, terminatedProjectCost, disapprovedProjectCost) {
  const analytics = useMemo(() => {
    const total = projectDetails.length;
    
    // Separate counts for each terminal state
    const completed = projectDetails.filter(p => p.progress === 'Completed').length;
    const withdrawn = projectDetails.filter(p => p.progress === 'Withdrawn').length;
    const terminated = projectDetails.filter(p => p.progress === 'Terminated').length;
    const disapproved = projectDetails.filter(p => p.progress === 'Disapproved').length;
    
    // Active projects (excluding terminal states)
    const activeProjects = projectDetails.filter(p => 
      p.progress && !['Withdrawn', 'Terminated', 'Disapproved'].includes(p.progress)
    );
    const inProgress = activeProjects.filter(p => p.progress !== 'Completed').length;
    
    // Completion rate based on active projects - with 2 decimal places
    const completionRate = activeProjects.length > 0 
      ? parseFloat(((completed / activeProjects.length) * 100).toFixed(2))
      : 0;
    
    // Overall completion rate - with 2 decimal places
    const overallCompletionRate = total > 0 
      ? parseFloat(((completed / total) * 100).toFixed(2))
      : 0;
    
    // Review/Approval backlog
    const reviewBacklog = projectDetails.filter(p => REVIEW_APPROVAL_STAGES.includes(p.progress)).length;
    const reviewBacklogPercentage = total > 0 
      ? parseFloat(((reviewBacklog / total) * 100).toFixed(2))
      : 0;
    
    // Stage distribution - with 2 decimal places
    const stageDistribution = {};
    STAGES.forEach(stage => {
      const count = projectDetails.filter(p => p.progress === stage).length;
      stageDistribution[stage] = {
        count,
        percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0
      };
    });
    
    // Terminal states distribution - with 2 decimal places
    const terminalDistribution = {
      'Withdrawn': {
        count: withdrawn,
        percentage: total > 0 ? parseFloat(((withdrawn / total) * 100).toFixed(2)) : 0
      },
      'Terminated': {
        count: terminated,
        percentage: total > 0 ? parseFloat(((terminated / total) * 100).toFixed(2)) : 0
      },
      'Disapproved': {
        count: disapproved,
        percentage: total > 0 ? parseFloat(((disapproved / total) * 100).toFixed(2)) : 0
      }
    };
    
    // Office performance - with 2 decimal places
    const officePerformance = {};
    projectDetails.forEach(p => {
      const office = p.office_name || 'Unknown';
      if (!officePerformance[office]) {
        officePerformance[office] = { 
          total: 0, 
          completed: 0, 
          inProgress: 0,
          withdrawn: 0,
          terminated: 0,
          disapproved: 0,
          reviewStage: 0
        };
      }
      officePerformance[office].total++;
      
      if (p.progress === 'Completed') officePerformance[office].completed++;
      else if (p.progress === 'Withdrawn') officePerformance[office].withdrawn++;
      else if (p.progress === 'Terminated') officePerformance[office].terminated++;
      else if (p.progress === 'Disapproved') officePerformance[office].disapproved++;
      else if (REVIEW_APPROVAL_STAGES.includes(p.progress)) officePerformance[office].reviewStage++;
      else if (p.progress) officePerformance[office].inProgress++;
    });
    
    // Calculate completion rates for offices - with 2 decimal places
    Object.keys(officePerformance).forEach(office => {
      const data = officePerformance[office];
      const activeTotal = data.total - data.withdrawn - data.terminated - data.disapproved;
      
      data.completionRate = activeTotal > 0 
        ? parseFloat(((data.completed / activeTotal) * 100).toFixed(2))
        : 0;
        
      data.withdrawnRate = data.total > 0 
        ? parseFloat(((data.withdrawn / data.total) * 100).toFixed(2))
        : 0;
        
      data.terminatedRate = data.total > 0 
        ? parseFloat(((data.terminated / data.total) * 100).toFixed(2))
        : 0;
      
      data.activeCount = activeTotal;
    });
    
    // Average progress (percentage of projects beyond review stage) - with 2 decimal places
    const projectsBeyondReview = projectDetails.filter(p => {
      if (!p.progress || ['Withdrawn', 'Terminated', 'Disapproved'].includes(p.progress)) return false;
      if (REVIEW_APPROVAL_STAGES.includes(p.progress)) return false;
      const stageIndex = STAGES.indexOf(p.progress);
      return stageIndex > 2;
    }).length;
    
    const averageProgress = total > 0 
      ? parseFloat(((projectsBeyondReview / total) * 100).toFixed(2))
      : 0;
    
    // Project cost analytics - with 2 decimal places
    const totalProjectCostValue = parseFloat(totalProjectCost) || 0;
    const averageProjectCost = total > 0 
      ? parseFloat((totalProjectCostValue / total).toFixed(2))
      : 0;
    
    // Format project cost by province - with stage breakdown and proper ordering
    const provinceCostsFormatted = projectCostByProvince 
      ? Object.entries(projectCostByProvince)
          .map(([province, data]) => ({
            province,
            totalCost: parseFloat((data.total_cost || 0).toFixed(2)),
            projectCount: parseInt(data.project_count) || 0,
            activeCost: parseFloat((data.active_cost || 0).toFixed(2)),
            activeCount: parseInt(data.active_count) || 0,
            withdrawnCost: parseFloat((data.withdrawn_cost || 0).toFixed(2)),
            withdrawnCount: parseInt(data.withdrawn_count) || 0,
            terminatedCost: parseFloat((data.terminated_cost || 0).toFixed(2)),
            terminatedCount: parseInt(data.terminated_count) || 0,
            disapprovedCost: parseFloat((data.disapproved_cost || 0).toFixed(2)),
            disapprovedCount: parseInt(data.disapproved_count) || 0,
            averageCost: data.project_count > 0 
              ? parseFloat(((data.total_cost || 0) / data.project_count).toFixed(2))
              : 0,
            percentageOfTotal: totalProjectCostValue > 0 
              ? parseFloat((((data.total_cost || 0) / totalProjectCostValue) * 100).toFixed(2))
              : 0,
          }))
          .sort((a, b) => {
            // Sort by predefined province order
            const indexA = PROVINCE_ORDER.indexOf(a.province);
            const indexB = PROVINCE_ORDER.indexOf(b.province);
            
            // If both are in the predefined order, sort by that order
            if (indexA !== -1 && indexB !== -1) {
              return indexA - indexB;
            }
            // If only one is in the order, prioritize it
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            // Otherwise sort alphabetically
            return a.province.localeCompare(b.province);
          })
      : [];
    
    // Active vs Inactive metrics - with 2 decimal places
    const activeRate = total > 0 
      ? parseFloat(((activeProjects.length / total) * 100).toFixed(2))
      : 0;
    
    const inactiveRate = total > 0 
      ? parseFloat((((withdrawn + terminated + disapproved) / total) * 100).toFixed(2))
      : 0;
    
    return {
      total,
      completed,
      withdrawn,
      terminated,
      disapproved,
      inProgress,
      activeProjects: activeProjects.length,
      completionRate,
      overallCompletionRate,
      reviewBacklog,
      reviewBacklogPercentage,
      stageDistribution,
      terminalDistribution,
      officePerformance,
      totalProjectCost: totalProjectCostValue,
      activeProjectCost: parseFloat(activeProjectCost || 0),
      withdrawnCost: parseFloat(withdrawnProjectCost || 0),
      terminatedCost: parseFloat(terminatedProjectCost || 0),
      disapprovedCost: parseFloat(disapprovedProjectCost || 0),
      averageProjectCost,
      provinceCostsFormatted,
      averageProgress,
      activeRate,
      inactiveRate,
    };
  }, [projectDetails, projectCostByProvince, totalProjectCost, activeProjectCost, withdrawnProjectCost, terminatedProjectCost, disapprovedProjectCost]);

  return analytics;
}