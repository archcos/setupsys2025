// components/sections/ProponentInfoSection.jsx
import { Building2, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

const INDUSTRY_OPTIONS = [
  {
    label: 'SETUP 4.0 Priority Sectors',
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
    ],
  },
  {
    label: 'SETUP Former Priority Sectors',
    options: [
      'Agriculture/Aquaculture/Forestry',
      'Creative Industry',
      'Energy and Environment',
      'Furniture',
      'Gifts, Decors, Handicrafts',
      'Health and Wellness',
      'Metals and Engineering',
      'Other Regional Priority Sectors',
    ],
  },
];

// Flat list of all industry option strings for case-insensitive lookup
const ALL_INDUSTRY_OPTIONS = INDUSTRY_OPTIONS.flatMap((g) => g.options);

/**
 * Given a value from the DB (possibly wrong casing e.g. "food processing"),
 * finds and returns the correctly-cased option string (e.g. "Food processing").
 * Falls back to the original value if no match found.
 */
function normalizeIndustry(value) {
  if (!value) return value;
  const match = ALL_INDUSTRY_OPTIONS.find(
    (opt) => opt.toLowerCase() === value.toLowerCase()
  );
  return match ?? value;
}

/**
 * Normalizes enterprise type to uppercase so "micro", "Micro", "MICRO"
 * all map to the option value "MICRO".
 */
function normalizeEnterpriseType(value) {
  if (!value) return value;
  return value.toUpperCase();
}

const inputClass = "w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm";
const selectClass = "w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm";

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
      {message}
    </div>
  );
}

export default function ProponentInfoSection({ data, setData, errors }) {
  return (
    <FormCard icon={Building2} title="Proponent Information" iconBgColor="bg-blue-100" iconColor="text-blue-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">

        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            maxLength="254"
            className={inputClass}
            placeholder="Enter company name"
            value={data.company_name}
            onChange={(e) => setData('company_name', e.target.value)}
            required
          />
          <FieldError message={errors.company_name} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Primary Products/Services</label>
          <input
            type="text"
            maxLength="254"
            className={inputClass}
            placeholder="Describe your main products or services"
            value={data.products}
            onChange={(e) => setData('products', e.target.value)}
            required
          />
          <FieldError message={errors.products} />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Industry Classification</label>
          <select
            className={selectClass}
            // Normalize on render so DB value (any casing) selects the right option
            value={normalizeIndustry(data.setup_industry)}
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
          <FieldError message={errors.setup_industry} />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Enterprise Type</label>
          <select
            className={selectClass}
            // Normalize to uppercase so "micro" / "Micro" all match "MICRO"
            value={normalizeEnterpriseType(data.industry_type)}
            onChange={(e) => setData('industry_type', e.target.value)}
            required
          >
            <option value="">Select enterprise size</option>
            <option value="MICRO">Micro Enterprise</option>
            <option value="SMALL">Small Enterprise</option>
            <option value="MEDIUM">Medium Enterprise</option>
          </select>
          <FieldError message={errors.industry_type} />
        </div>

      </div>
    </FormCard>
  );
}