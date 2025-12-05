import { Briefcase, CheckCircle, Activity, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';
import { TERMINAL_STATES } from '../constants/stages';

export default function StatsGrid({ projectDetails }) {
  const totalProjects = projectDetails.length;
  const completedProjects = projectDetails.filter(p => p.progress === 'Completed').length;
  const inProgressProjects = projectDetails.filter(p => p.progress && p.progress !== 'Completed' && !TERMINAL_STATES.includes(p.progress)).length;
  const terminalProjects = projectDetails.filter(p => TERMINAL_STATES.includes(p.progress)).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      <StatCard 
        icon={<Briefcase className="w-3 h-3 md:w-4 md:h-4" />}
        label="Total"
        value={totalProjects}
        color="blue"
      />
      <StatCard 
        icon={<CheckCircle className="w-3 h-3 md:w-4 md:h-4" />}
        label="Completed"
        value={completedProjects}
        color="green"
      />
      <StatCard 
        icon={<Activity className="w-3 h-3 md:w-4 md:h-4" />}
        label="In Progress"
        value={inProgressProjects}
        color="purple"
      />
      <StatCard 
        icon={<AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />}
        label="Terminated/Withdrawn"
        value={terminalProjects}
        color="red"
      />
    </div>
  );
}
