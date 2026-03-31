import { Info, AlertCircle, Hash } from 'lucide-react';
import FormCard from '../FormCard';

export default function BasicInfoSection({ data, setData, errors, proponents, isCreate = true, nextProjectCode = '' }) {
  return (
    <FormCard icon={Info} title="Basic Information" iconBgColor="bg-blue-100" iconColor="text-blue-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">

        {/* Project Title */}
        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
            Project Title
            <span className="text-red-500 ml-1">*</span>
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

        {/* Project Code (create only) */}
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
            {errors.project_id && (
              <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                {errors.project_id}
              </div>
            )}
          </div>
        )}

        {/* Select proponent */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Select proponent <span className="text-red-500 ml-1">*</span></label>
          <select
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={data.proponent_id}
            onChange={(e) => setData('proponent_id', e.target.value)}
            required
          >
            <option value="">Choose a proponent</option>
            {proponents.map((proponent) => (
              <option key={proponent.proponent_id} value={proponent.proponent_id}>
                {proponent.company_name}
              </option>
            ))}
          </select>
          {errors.proponent_id && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.proponent_id}
            </div>
          )}
        </div>

        {/* Current Business Location */}
        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
            Current Business Location
            <span className="text-red-500 ml-1">*</span>
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

        {/* Latitude + Longitude */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
            Latitude
            <span className="text-xs text-gray-500 font-normal ml-2">(e.g., 8.4542)</span>
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            step="0.0000001"
            min="-90"
            max="90"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="e.g., 8.4542480"
            value={data.latitude}
            onChange={(e) => setData('latitude', e.target.value)}
            required
          />
          {errors.latitude && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.latitude}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
            Longitude
            <span className="text-xs text-gray-500 font-normal ml-2">(e.g., 124.6319)</span>
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            step="0.0000001"
            min="-180"
            max="180"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="e.g., 124.6319420"
            value={data.longitude}
            onChange={(e) => setData('longitude', e.target.value)}
            required
          />
          {errors.longitude && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.longitude}
            </div>
          )}
        </div>

        {/* Project Cost + Counterpart */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Project Cost<span className="text-red-500 ml-1">*</span></label>
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
          {errors.project_cost && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.project_cost}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Counterpart<span className="text-red-500 ml-1">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">₱</span>
            </div>
            <input
              type="number"
              className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              placeholder="0.00"
              value={data.counterpart}
              onChange={(e) => setData('counterpart', e.target.value)}
              required
            />
          </div>
          {errors.counterpart && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.counterpart}
            </div>
          )}
        </div>

        {/* Released Date + Released Amount */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Fund Release Date</label>
          <input
            type="date"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            value={data.fund_release}
            onChange={(e) => setData('fund_release', e.target.value)}
          />
          {errors.fund_release && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.fund_release}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Released Amount</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">₱</span>
            </div>
            <input
              type="number"
              className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              placeholder="0.00"
              value={data.released_amount}
              onChange={(e) => setData('released_amount', e.target.value)}
            />
          </div>
          {errors.released_amount && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.released_amount}
            </div>
          )}
        </div>

        {/* Monthly Refund + Last Refund */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Monthly Refund Amount <span className="text-red-500 ml-1">*</span></label>
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
              required
            />
          </div>
          {errors.refund_amount && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.refund_amount}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Last Refund Amount<span className="text-red-500 ml-1">*</span></label>
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
              required
            />
          </div>
          {errors.last_refund && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.last_refund}
            </div>
          )}
        </div>

      </div>
    </FormCard>
  );
}