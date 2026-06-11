// resources/js/Pages/Home/components/StatsGrid.jsx

import { Briefcase, CheckCircle, Activity, Ban, XCircle, DollarSign, TrendingUp, TrendingDown, PhilippinePeso } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function StatsGrid({ projectDetails, analytics }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Calculate completion rate based ONLY on active projects (Completed + In Progress)
  // Excluding Withdrawn and Terminated from the denominator
  const calculateCompletionRate = () => {
    const total = analytics?.total || projectDetails.length;
    const withdrawn = analytics?.withdrawn || 0;
    const terminated = analytics?.terminated || 0;
    
    // Active projects = Total - Withdrawn - Terminated
    const activeProjects = total - withdrawn - terminated;
    const completed = analytics?.completed || 0;
    
    // Completion rate = Completed / Active Projects (only counting active projects)
    if (activeProjects === 0) return 0;
    return (completed / activeProjects) * 100;
  };

  const completionRate = calculateCompletionRate();

  // Animated counter effect
  const [animatedValues, setAnimatedValues] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    withdrawn: 0,
    terminated: 0,
  });

  useEffect(() => {
    const targetValues = {
      total: analytics?.total || projectDetails.length,
      completed: analytics?.completed || 0,
      inProgress: analytics?.inProgress || 0,
      withdrawn: analytics?.withdrawn || 0,
      terminated: analytics?.terminated || 0,
    };

    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedValues({
        total: Math.round(targetValues.total * progress),
        completed: Math.round(targetValues.completed * progress),
        inProgress: Math.round(targetValues.inProgress * progress),
        withdrawn: Math.round(targetValues.withdrawn * progress),
        terminated: Math.round(targetValues.terminated * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedValues(targetValues);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [analytics, projectDetails]);

  // Calculate percentages for progress bars
  const totalProjects = analytics?.total || projectDetails.length;
  const withdrawnPercent = totalProjects ? ((analytics?.withdrawn || 0) / totalProjects) * 100 : 0;
  const terminatedPercent = totalProjects ? ((analytics?.terminated || 0) / totalProjects) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {/* Total Projects */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 -mb-6 -ml-6 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-blue-200" />
          </div>
          <p className="text-blue-100 text-xs font-medium mb-1">Total Projects</p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-2">
            {animatedValues.total}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Completed */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 -mb-6 -ml-6 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="px-2 py-0.5 bg-white/20 rounded-full">
              <span className="text-xs font-medium text-white">
                {completionRate.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-emerald-100 text-xs font-medium mb-1">Completed</p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-2">
            {animatedValues.completed}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-emerald-400/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-xs text-emerald-200">of active</span>
          </div>
        </div>
      </div>

      {/* In Progress */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 -mb-6 -ml-6 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="px-2 py-0.5 bg-white/20 rounded-full">
            </div>
          </div>
          <p className="text-violet-100 text-xs font-medium mb-1">In Progress</p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-2">
            {animatedValues.inProgress}
          </p>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-violet-300 animate-pulse" />
            <span className="text-xs text-violet-200">active projects</span>
          </div>
        </div>
      </div>

      {/* Withdrawn */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 -mb-6 -ml-6 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Ban className="w-5 h-5 text-white" />
            </div>
            <TrendingDown className="w-4 h-4 text-amber-200" />
          </div>
          <p className="text-amber-100 text-xs font-medium mb-1">Withdrawn</p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-2">
            {animatedValues.withdrawn}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-amber-400/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full"
                style={{ width: `${withdrawnPercent}%` }}
              />
            </div>
            <span className="text-xs text-amber-200">{withdrawnPercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Terminated */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-red-600 p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 -mb-6 -ml-6 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <TrendingDown className="w-4 h-4 text-rose-200" />
          </div>
          <p className="text-rose-100 text-xs font-medium mb-1">Terminated</p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-2">
            {animatedValues.terminated}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-rose-400/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full"
                style={{ width: `${terminatedPercent}%` }}
              />
            </div>
            <span className="text-xs text-rose-200">{terminatedPercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Total Project Cost */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 md:col-span-1 lg:col-span-1">
        <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-16 h-16 -mb-6 -ml-6 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <PhilippinePeso className="w-5 h-5 text-white" />
            </div>
            <div className="px-2 py-0.5 bg-white/20 rounded-full">
              <span className="text-xs font-medium text-white">PHP</span>
            </div>
          </div>
          <p className="text-indigo-100 text-xs font-medium mb-1">Total Project Cost</p>
          <p className="text-lg md:text-xl lg:text-lg font-bold text-white mb-2 truncate">
            {formatCurrency(analytics?.totalProjectCost)}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-indigo-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-white to-indigo-200 rounded-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}