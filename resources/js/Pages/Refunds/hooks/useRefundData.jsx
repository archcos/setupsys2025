// hooks/useRefundData.js
import { useEffect } from 'react';

/**
 * Syncs form state from the latest projects prop.
 * Runs on every projects.data change (i.e. after each filter/navigation),
 * so inputs always reflect the freshly loaded server data.
 */
export function useRefundData(projects, data, setData) {
  useEffect(() => {
    if (!projects?.data) return;

    projects.data.forEach((project) => {
      const pid = project.project_id;
      const latestRefund = project.refunds?.[0];

      // Only overwrite form state if we don't already have a local edit for this project.
      // This prevents wiping in-progress edits when Inertia re-renders due to preserveState.
      // We detect a "local edit" by checking whether the form key exists AND differs from
      // what the server just sent us — but on a fresh load the key won't exist at all,
      // so we always initialise in that case.

      const serverStatus   = latestRefund?.status        ?? 'unpaid';
      const serverAmount   = latestRefund?.refund_amount ?? project.refund_amount ?? 0;
      const serverAmtDue   = latestRefund?.amount_due    ?? project.refund_amount ?? 0;
      const serverCheckNum = latestRefund?.check_num     ?? '';
      const serverReceiptNum = latestRefund?.receipt_num ?? '';

      // Always write: after a filter change Inertia replaces the page props, so these are the
      // authoritative values for the newly-loaded page. Any unsaved local edits are intentionally
      // discarded because the user just changed the month/year/filter context.
      setData(`status_${pid}`,      serverStatus);
      setData(`refund_amount_${pid}`, serverAmount);
      setData(`amount_due_${pid}`,  serverAmtDue);
      setData(`check_num_${pid}`,   serverCheckNum);
      setData(`receipt_num_${pid}`, serverReceiptNum);
    });

    // projects.data reference changes on every Inertia page visit — this is the correct dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.data]);
}