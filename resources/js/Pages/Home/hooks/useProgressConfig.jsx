// resources/js/Pages/Dashboard/hooks/useProgressConfig.js

import { CheckCircle, Clock } from 'lucide-react';
import { STAGES, REVIEW_APPROVAL_STAGES, TERMINAL_STATES } from '../constants/stages';

export function useProgressConfig() {
  const isTerminal = (progress) => TERMINAL_STATES.includes(progress);

  const isReviewApprovalStage = (progress) => 
    REVIEW_APPROVAL_STAGES.includes(progress);

  const getProgressConfig = (progress) => {
    if (isTerminal(progress)) {
      return {
        width: 'w-0',
        color: 'bg-gradient-to-r from-red-500 to-red-600',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50'
      };
    }

    if (isReviewApprovalStage(progress)) {
      return {
        width: 'w-3/12',
        color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        textColor: 'text-indigo-700',
        bgColor: 'bg-indigo-50'
      };
    }

    const stageIndex = STAGES.indexOf(progress);
    const configs = [
      { width: 'w-1/12', color: 'bg-gradient-to-r from-blue-500 to-blue-600', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
      { width: 'w-2/12', color: 'bg-gradient-to-r from-cyan-500 to-cyan-600', textColor: 'text-cyan-700', bgColor: 'bg-cyan-50' },
      { width: '[width:29.166%]', color: 'bg-gradient-to-r from-indigo-500 to-indigo-600', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50' },
      { width: 'w-5/12', color: 'bg-gradient-to-r from-purple-500 to-purple-600', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
      { width: 'w-6/12', color: 'bg-gradient-to-r from-pink-500 to-pink-600', textColor: 'text-pink-700', bgColor: 'bg-pink-50' },
      { width: 'w-[61.666%]', color: 'bg-gradient-to-r from-orange-500 to-orange-600', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
      { width: 'w-9/12', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
      { width: 'w-5/6', color: 'bg-gradient-to-r from-teal-500 to-teal-600', textColor: 'text-teal-700', bgColor: 'bg-teal-50' },
      { width: 'w-full', color: 'bg-gradient-to-r from-green-500 to-green-600', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    ];

    if (!progress) {
      return { width: 'w-0', color: 'bg-gradient-to-r from-gray-400 to-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' };
    }

    return configs[stageIndex] || configs[0];
  };

  const getStageIcon = (stage, currentProgress) => {
    if (isTerminal(currentProgress)) {
      return <div className="w-3 h-3 rounded-full border border-gray-300" />;
    }

    if (isReviewApprovalStage(currentProgress)) {
      const stageIndex = STAGES.indexOf(stage);
      if (stageIndex <= 1) return <CheckCircle className="w-3 h-3 text-green-500" />;
      if (stageIndex === 2) return <Clock className="w-3 h-3 text-blue-500" />;
      return <div className="w-3 h-3 rounded-full border border-gray-300" />;
    }

    const currentIndex = STAGES.indexOf(currentProgress);
    const stageIndex = STAGES.indexOf(stage);

    if (stageIndex < currentIndex) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    if (stageIndex === currentIndex) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    if (stageIndex === currentIndex + 1) {
      return <Clock className="w-3 h-3 text-blue-500" />;
    }
    return <div className="w-3 h-3 rounded-full border border-gray-300" />;
  };

  return { isTerminal, isReviewApprovalStage, getProgressConfig, getStageIcon };
}