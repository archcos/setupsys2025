// components/RefundTableRow.jsx
import React, { useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { REFUND_STATUS, STATUS_STYLES } from '../constants/refundConstants';

const RefundTableRow = React.memo(({
  project,
  data,
  setData,
  isRPMO,
  currentStatus,
  onStatusChange,
  onSaveClick,
  renderSaveButton,
}) => {
  const isRestructured = currentStatus === REFUND_STATUS.RESTRUCTURED;
  const latestRefund = project.refunds?.[0];

  // Memoized handlers for input changes
  const handleRefundAmountChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length > 10) return;
    setData(`refund_amount_${project.project_id}`, val);
  }, [project.project_id, setData]);

  const handleCheckNumChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setData(`check_num_${project.project_id}`, value);
  }, [project.project_id, setData]);

  const handleReceiptNumChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setData(`receipt_num_${project.project_id}`, value);
  }, [project.project_id, setData]);

  return (
    <tr className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group">
      {/* Project & Company */}
      <td className="px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-xs">
          <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
            {project.project_title}
          </div>
          <div className="text-xs text-gray-600 font-medium mb-0.5">
            {project.company.company_name}
          </div>
          <div className="text-xs text-gray-500">
            ID: {project.project_id}
          </div>
        </div>
      </td>

      {/* Amount Due */}
      <td className="px-4 md:px-6 py-3 md:py-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
          <input
            type="number"
            value={data[`amount_due_${project.project_id}`] ?? ''}
            className={`w-full pl-6 pr-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              isRestructured ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="0.00"
            disabled
          />
        </div>
      </td>

      {/* Refund Amount */}
      <td className="px-4 md:px-6 py-3 md:py-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
          <input
            type="number"
            value={data[`refund_amount_${project.project_id}`] ?? ''}
            onChange={handleRefundAmountChange}
            className={`w-full pl-6 pr-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              isRestructured ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="0.00"
            maxLength="10"
            disabled={isRestructured || !isRPMO}
          />
        </div>
      </td>

      {/* Check No. */}
      <td className="px-4 md:px-6 py-3 md:py-4">
        <input
          type="text"
          value={data[`check_num_${project.project_id}`] ?? latestRefund?.check_num ?? ''}
          onChange={handleCheckNumChange}
          className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Check No."
          maxLength="10"
          disabled={!isRPMO}
        />
      </td>

      {/* Receipt No. */}
      <td className="px-4 md:px-6 py-3 md:py-4">
        <input
          type="text"
          value={data[`receipt_num_${project.project_id}`] ?? latestRefund?.receipt_num ?? ''}
          onChange={handleReceiptNumChange}
          className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Receipt No."
          maxLength="10"
          disabled={!isRPMO}
        />
      </td>

      {/* Status */}
      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(project.project_id, e.target.value)}
          className={`px-2 pr-4 py-1 text-xs font-medium rounded-lg focus:ring-1 transition-all duration-200 w-full ${
            STATUS_STYLES[currentStatus] || STATUS_STYLES.unpaid
          }`}
          disabled={!isRPMO}
        >
          <option value="paid" className="text-green-700">Paid</option>
          <option value="unpaid" className="text-red-700">Unpaid</option>
          <option value="restructured" className="text-blue-700">Restructured</option>
        </select>
      </td>

      {/* Actions */}
      <td className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/refunds/project/${project.project_id}`}
            className="p-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-sm hover:shadow-lg"
            title="View Full Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {renderSaveButton(project.project_id)}
        </div>
      </td>
    </tr>
  );
});

RefundTableRow.displayName = 'RefundTableRow';

export default RefundTableRow;