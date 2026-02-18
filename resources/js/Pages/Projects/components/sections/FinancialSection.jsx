import { BarChart3, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

export default function FinancialSection({ data, setData, errors }) {
  const financialFields = [
    { key: 'year_obligated', label: 'Year Obligated', isCurrency: false },
    { key: 'revenue', label: 'Revenue', isCurrency: true },
    { key: 'net_income', label: 'Net Income', isCurrency: true },
    { key: 'current_asset', label: 'Current Asset', isCurrency: true },
    { key: 'noncurrent_asset', label: 'Non-Current Asset', isCurrency: true },
    { key: 'equity', label: 'Equity', isCurrency: true },
    { key: 'liability', label: 'Liability', isCurrency: true },
  ];

  return (
    <FormCard icon={BarChart3} title="Financial Information" iconBgColor="bg-purple-100" iconColor="text-purple-600">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {financialFields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
            {field.isCurrency ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₱</span>
                </div>
                <input
                  type="number"
                  step="any"
                  className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="0.00"
                  value={data[field.key]}
                  onChange={(e) => setData(field.key, e.target.value)}
                />
              </div>
            ) : (
              <input
                type="number"
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                placeholder="YYYY"
                value={data[field.key]}
                onChange={(e) => setData(field.key, e.target.value)}
              />
            )}
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