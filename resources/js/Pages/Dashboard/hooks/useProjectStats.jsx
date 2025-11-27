import { useMemo } from 'react';

export const useProjectStats = (projects) => {
  return useMemo(() => {
    const completed = projects.filter(p => p.progress === 'Completed').length;
    const total = projects.length;
    const inProgress = total - completed;
    const needsAttention = projects.filter(p => {
      const impl = p.implementation || {};
      return p.progress === 'Implementation' && (!impl.tarp_upload || !impl.pdc_upload);
    }).length;

    return {
      completedProjects: completed,
      totalProjects: total,
      inProgressProjects: inProgress,
      needsAttentionProjects: needsAttention
    };
  }, [projects]);
};