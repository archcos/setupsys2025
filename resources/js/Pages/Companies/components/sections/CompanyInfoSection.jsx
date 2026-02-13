// components/sections/CompanyInfoSection.jsx
import { Building2, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

const INDUSTRY_OPTIONS = [
  {
    label: 'Major Industry Sectors',
    options: [
      'Agriculture/Aquaculture/Forestry',
      'Creative Industry',
      'Energy and Environment',
      'Food Processing',
      'Furniture',
      'Gifts, Decors, Handicrafts',
      'Health and Wellness',
      'Metals and Engineering',
      'Other Regional Priority Sectors',
    ]
  },
  {
    label: 'Sub-Industries / Manufacturing',
    options: [
      'Crop and animal production, hunting, and related service activities',
      'Forestry and Logging',
      'Fishing and aquaculture',
      'Food processing',
      'Beverage manufacturing',
      'Textile manufacturing',
      'Wearing apparel manufacturing',
      'Leather and related products manufacturing',
      'Wood and products of wood and cork manufacturing',
      'Paper and paper products manufacturing',
      'Chemicals and chemical products manufacturing',
      'Basic pharmaceutical products and pharmaceutical preparations manufacturing',
      'Rubber and plastic products manufacturing',
      'Non-metallic mineral products manufacturing',
      'Fabricated metal products manufacturing',
      'Machinery and equipment, Not Elsewhere Classified (NEC) manufacturing',
      'Other transport equipment manufacturing',
      'Furniture manufacturing',
      'Information and Communication',
      'Other regional priority industries approved by the Regional Development Council',
    ]
  }
];

export default function CompanyInfoSection({ data, setData, errors }) {
  return (
    <FormCard icon={Building2} title="Company Information" iconBgColor="bg-blue-100" iconColor="text-blue-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            maxLength="254"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="Enter company name"
            value={data.company_name}
            onChange={(e) => setData('company_name', e.target.value)}
            required
          />
          {errors.company_name && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.company_name}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Primary Products/Services</label>
          <input
            type="text"
            maxLength="254"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="Describe your main products or services"
            value={data.products}
            onChange={(e) => setData('products', e.target.value)}
            required
          />
          {errors.products && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.products}
            </div>
          )}
        </div>
          <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Current Market Location</label>
          <input
            type="text"
            maxLength="100"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="Current Market Location (e.g. Carmen, Cagayan de Oro City)"
            value={data.current_market}
            onChange={(e) => setData('current_market', e.target.value)}
          />
          {errors.current_market && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.current_market}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Industry Classification</label>
          <select
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={data.setup_industry}
            onChange={(e) => setData('setup_industry', e.target.value)}
            required
          >
            <option value="">Select Industry</option>
            {INDUSTRY_OPTIONS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.setup_industry && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.setup_industry}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Enterprise Type</label>
          <select
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={data.industry_type}
            onChange={(e) => setData('industry_type', e.target.value)}
            required
          >
            <option value="">Select enterprise size</option>
            <option value="MICRO">Micro Enterprise</option>
            <option value="SMALL">Small Enterprise</option>
            <option value="MEDIUM">Medium Enterprise</option>
          </select>
          {errors.industry_type && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.industry_type}
            </div>
          )}
        </div>

      
      </div>
    </FormCard>
  );
}