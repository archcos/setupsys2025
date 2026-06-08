// hooks/useRefundData.js
import { useEffect } from "react";

export function useRefundData(projects, data, setData) {
    useEffect(() => {
        if (!projects?.data) return;

        projects.data.forEach((project) => {
            const pid = project.project_id;
            const latestRefund = project.refunds?.[0];

            const serverStatus = latestRefund?.status ?? "unpaid";
            const serverAmtDue =
                latestRefund != null
                    ? (latestRefund.amount_due ?? project.refund_amount ?? 0)
                    : (project.refund_amount ?? 0);

            setData(`status_${pid}`, serverStatus);
            setData(`refund_amount_${pid}`, "");   // always blank — user types new amount
            setData(`amount_due_${pid}`, serverAmtDue);
            setData(`check_num_${pid}`, "");        // blank — not prefilled from old payment
            setData(`check_date_${pid}`, "");
            setData(`receipt_num_${pid}`, "");
            setData(`receipt_date_${pid}`, "");
            setData(`bank_name_${pid}`, "");
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projects.data]);
}