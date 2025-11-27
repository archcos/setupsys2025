// components/sections/OwnerSection.jsx
import { User, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

export default function OwnerSection({ data, setData, errors }) {
  return (
    <FormCard icon={User} title="Owner Information" iconBgColor="bg-orange-100" iconColor="text-orange-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="Juan Dela Cruz"
            value={data.owner_name}
            onChange={(e) => setData('owner_name', e.target.value)}
            required
          />
          {errors.owner_name && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.owner_name}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Gender</label>
          <select
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={data.sex}
            onChange={(e) => setData('sex', e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.sex && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.sex}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
          <input
            type="tel"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="09XXXXXXXXX"
            value={data.contact_number}
            onChange={(e) => setData('contact_number', e.target.value)}
            required
          />
          {errors.contact_number && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.contact_number}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="owner@company.com"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
          />
          {errors.email && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.email}
            </div>
          )}
        </div>
      </div>
    </FormCard>
  );
}