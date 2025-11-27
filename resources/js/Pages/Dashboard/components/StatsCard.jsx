import { memo } from 'react';
import { BarChart3, Clock, Award, AlertCircle } from 'lucide-react';

const iconMap = {
  total: { icon: BarChart3, bg: 'bg-blue-100', text: 'text-blue-600' },
  progress: { icon: Clock, bg: 'bg-orange-100', text: 'text-orange-600' },
  completed: { icon: Award, bg: 'bg-green-100', text: 'text-green-600' },
  attention: { icon: AlertCircle, bg: 'bg-red-100', text: 'text-red-600' }
};

const StatsCard = memo(({ label, count, type }) => {
  const { icon: Icon, bg, text } = iconMap[type];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
        <div className={`p-3 ${bg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${text}`} />
        </div>
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';
export default StatsCard;
