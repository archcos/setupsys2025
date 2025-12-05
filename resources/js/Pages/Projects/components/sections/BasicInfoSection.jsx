import { Info, AlertCircle, Hash } from 'lucide-react';
import FormCard from '../FormCard';

export default function BasicInfoSection({ data, setData, errors, companies, isCreate = true, nextProjectCode = '' }) {
  return (
    <FormCard icon={Info} title="Basic Information" iconBgColor="bg-blue-100" iconColor="text-blue-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
            Project Title
            <span className="text-xs text-gray-500 font-normal ml-2">
              ({data.project_title.length}/255)
            </span>
          </label>
          <input
            type="text"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="Enter project title"
            value={data.project_title}
            onChange={(e) => setData('project_title', e.target.value)}
            maxLength={255}
            required
          />
          {errors.project_title && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.project_title}
            </div>
          )}
        </div>

        {isCreate && (
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
              Project Code
              <span className="ml-2 text-xs text-gray-500 font-normal">(Auto-generated)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl bg-gray-100 text-gray-700 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={data.project_id}
                readOnly
                title="Format: YYYYMM## (Year-Month-Increment)"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Format: YYYYMM## (e.g., 20250142)</p>
            {errors.project_id && (
              <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                {errors.project_id}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Select Company</label>
          <select
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={data.company_id}
            onChange={(e) => setData('company_id', e.target.value)}
            required
          >
            <option value="">Choose a company</option>
            {companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.company_name}
              </option>
            ))}
          </select>
          {errors.company_id && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.company_id}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
            Current Business Location
            <span className="text-xs text-gray-500 font-normal ml-2">
              ({data.place_name.length}/100)
            </span>
          </label>
          <input
            type="text"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="e.g., Carmen, Cagayan de Oro City"
            value={data.place_name}
            onChange={(e) => setData('place_name', e.target.value)}
            maxLength={100}
            required
          />
          {errors.place_name && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.place_name}
            </div>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Project Cost</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">₱</span>
              </div>
              <input
                type="number"
                className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                placeholder="0.00"
                value={data.project_cost}
                onChange={(e) => setData('project_cost', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Monthly Refund Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">₱</span>
              </div>
              <input
                type="number"
                className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                placeholder="0.00"
                value={data.refund_amount}
                onChange={(e) => setData('refund_amount', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Last Refund Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">₱</span>
              </div>
              <input
                type="number"
                className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                placeholder="0.00"
                value={data.last_refund}
                onChange={(e) => setData('last_refund', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </FormCard>
  );
}
