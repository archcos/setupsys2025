// hooks/useRefundData.js
import { useEffect } from 'react';

/**
 * Efficiently initializes and syncs refund data
 * Only updates changed projects instead of reinitializing everything
 */
export const useRefundData = (projects, data, setData) => {
  useEffect(() => {
    if (!projects?.data) return;

    setData(prev => {
      let hasChanges = false;
      const updates = {};

      projects.data.forEach((p) => {
        const latestRefund = p.refunds?.[0];
        const newRefundAmount = latestRefund?.refund_amount ?? p.refund_amount ?? '';
        const newStatus = latestRefund?.status ?? 'unpaid';
        const newAmountDue = latestRefund?.amount_due ?? newRefundAmount;
        const newCheckNum = latestRefund?.check_num ?? '';
        const newReceiptNum = latestRefund?.receipt_num ?? '';

        // Only add to updates if value differs from current state
        if (prev[`refund_amount_${p.project_id}`] !== newRefundAmount) {
          updates[`refund_amount_${p.project_id}`] = newRefundAmount;
          hasChanges = true;
        }

        if (prev[`status_${p.project_id}`] !== newStatus) {
          updates[`status_${p.project_id}`] = newStatus;
          hasChanges = true;
        }

        if (prev[`amount_due_${p.project_id}`] !== newAmountDue) {
          updates[`amount_due_${p.project_id}`] = newAmountDue;
          hasChanges = true;
        }

        if (prev[`check_num_${p.project_id}`] !== newCheckNum) {
          updates[`check_num_${p.project_id}`] = newCheckNum;
          hasChanges = true;
        }

        if (prev[`receipt_num_${p.project_id}`] !== newReceiptNum) {
          updates[`receipt_num_${p.project_id}`] = newReceiptNum;
          hasChanges = true;
        }
      });

      // Only update if there are actual changes
      return hasChanges ? { ...prev, ...updates } : prev;
    });
  }, [projects?.data?.length]); // Only depend on array length, not entire object
};