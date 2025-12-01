// components/RefundMobileCard.jsx
import React, { useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { REFUND_STATUS, STATUS_STYLES } from '../constants/refundConstants';

const RefundMobileCard = React.memo(({
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
    <div className="p-4 space-y-3">
      {/* Project Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{project.project_title}</h3>
        <p className="text-xs text-gray-600 mb-0.5">{project.company.company_name}</p>
        <p className="text-xs text-gray-500">ID: {project.project_id}</p>
      </div>

      {/* Amount Due and Refund Amount */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <label className="text-xs text-gray-600 font-medium block mb-1">Amount Due</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
            <input
              type="number"
              value={data[`amount_due_${project.project_id}`] ?? ''}
              className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              disabled
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-2.5">
          <label className="text-xs text-gray-600 font-medium block mb-1">Refund Amt.</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
            <input
              type="number"
              value={data[`refund_amount_${project.project_id}`] ?? ''}
              onChange={handleRefundAmountChange}
              className={`w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isRestructured ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="0.00"
              maxLength="10"
              disabled={isRestructured || !isRPMO}
            />
          </div>
        </div>
      </div>

      {/* Check and Receipt Numbers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <label className="text-xs text-gray-600 font-medium block mb-1">Check No.</label>
          <input
            type="text"
            value={data[`check_num_${project.project_id}`] ?? latestRefund?.check_num ?? ''}
            onChange={handleCheckNumChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Check No."
            maxLength="10"
            disabled={!isRPMO}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-2.5">
          <label className="text-xs text-gray-600 font-medium block mb-1">Receipt No.</label>
          <input
            type="text"
            value={data[`receipt_num_${project.project_id}`] ?? latestRefund?.receipt_num ?? ''}
            onChange={handleReceiptNumChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Receipt No."
            maxLength="10"
            disabled={!isRPMO}
          />
        </div>
      </div>

      {/* Status and Actions */}
      <div className="flex gap-2">
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(project.project_id, e.target.value)}
          className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg focus:ring-1 transition-all duration-200 ${
            STATUS_STYLES[currentStatus] || STATUS_STYLES.unpaid
          }`}
          disabled={!isRPMO}
        >
          <option value="paid" className="text-green-700">Paid</option>
          <option value="unpaid" className="text-red-700">Unpaid</option>
          <option value="restructured" className="text-blue-700">Restructured</option>
        </select>

        <Link
          href={`/refunds/project/${project.project_id}`}
          className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </Link>

        {renderSaveButton(project.project_id)}
      </div>
    </div>
  );
});

RefundMobileCard.displayName = 'RefundMobileCard';

export default RefundMobileCard;