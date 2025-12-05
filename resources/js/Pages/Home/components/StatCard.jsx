export default function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4 border border-gray-100">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 md:p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
