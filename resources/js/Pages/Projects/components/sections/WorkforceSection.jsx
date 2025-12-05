import { Users, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

const WORKFORCE_FIELDS = [
  { key: 'female', label: 'Indirect Female' },
  { key: 'male', label: 'Indirect Male' },
  { key: 'direct_female', label: 'Direct Female' },
  { key: 'direct_male', label: 'Direct Male' },
];

export default function WorkforceSection({ data, setData, errors }) {
  return (
    <FormCard icon={Users} title="Workforce Distribution" iconBgColor="bg-cyan-100" iconColor="text-cyan-600">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {WORKFORCE_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
            <input
              type="number"
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              placeholder="0"
              value={data[field.key]}
              onChange={(e) => setData(field.key, e.target.value)}
              min="0"
            />
            {errors[field.key] && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {errors[field.key]}
              </div>
            )}
          </div>
        ))}
      </div>
    </FormCard>
  );
}