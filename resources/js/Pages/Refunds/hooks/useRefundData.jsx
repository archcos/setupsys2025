// hooks/useRefundData.js
import { useEffect } from "react";

export function useRefundData(projects, data, setData) {
    useEffect(() => {
        if (!projects?.data) return;

        projects.data.forEach((project) => {
            const pid = project.project_id;
            const latestRefund = project.refunds?.[0];
            const payments = latestRefund?.payments ?? [];

            // Get last real payment (amount > 0) for prefilling check/receipt fields
            const lastRealPayment =
                [...payments]
                    .reverse()
                    .find((p) => (parseFloat(p.amount) || 0) > 0) ?? null;

            const serverStatus = latestRefund?.status ?? "unpaid";
            const serverAmtDue =
                latestRefund != null
                    ? (latestRefund.amount_due ?? project.refund_amount ?? 0)
                    : (project.refund_amount ?? 0);

            // Always start refund_amount at 0/empty — user types new partial amount
            const serverAmount = lastRealPayment?.amount ?? "";

            // Prefill check/receipt from last real payment so user can see what was entered
            const serverCheckNum = lastRealPayment?.check_num ?? "";
            const serverCheckDate = lastRealPayment?.check_date ?? "";
            const serverReceiptNum = lastRealPayment?.receipt_num ?? "";
            const serverReceiptDate = lastRealPayment?.receipt_date ?? "";

            setData(`status_${pid}`, serverStatus);
            setData(`refund_amount_${pid}`, serverAmount);
            setData(`amount_due_${pid}`, serverAmtDue);
            setData(`check_num_${pid}`, serverCheckNum);
            setData(`check_date_${pid}`, serverCheckDate);
            setData(`receipt_num_${pid}`, serverReceiptNum);
            setData(`receipt_date_${pid}`, serverReceiptDate);
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projects.data]);
}
