// components/RefundTableRow.jsx
import React, { useState, useCallback } from "react";
import { Link, router } from "@inertiajs/react";
import { Eye, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { REFUND_STATUS, STATUS_STYLES } from "../constants/refundConstants";

const RefundTableRow = React.memo(
    ({
        project,
        data,
        setData,
        isRPMO,
        currentStatus,
        onStatusChange,
        renderSaveButton,
        renderUpdatedBy,
        selectedMonth,
        selectedYear,
    }) => {
        const [showPayments, setShowPayments] = useState(false);
        const latestRefund = project.refunds?.[0];
        const payments = latestRefund?.payments ?? [];
        const totalPaid = payments.reduce(
            (sum, p) => sum + (parseFloat(p.amount) || 0),
            0,
        );
        const isRestructured = currentStatus === REFUND_STATUS.RESTRUCTURED;

        const refundInitialFormatted = project.refund_initial
            ? new Date(project.refund_initial).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
              })
            : "";
        const refundEndFormatted = project.refund_end
            ? new Date(project.refund_end).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
              })
            : "";

        const handleAmountDueChange = useCallback(
            (e) => {
                setData(`amount_due_${project.project_id}`, e.target.value);
            },
            [project.project_id, setData],
        );

        const handleNewAmountChange = useCallback(
            (e) => {
                const val = e.target.value;
                if (val.length > 10) return;
                setData(`refund_amount_${project.project_id}`, val);
            },
            [project.project_id, setData],
        );

        const handleCheckNumChange = useCallback(
            (e) => {
                setData(
                    `check_num_${project.project_id}`,
                    e.target.value.replace(/\D/g, "").slice(0, 20),
                );
            },
            [project.project_id, setData],
        );

        const handleCheckDateChange = useCallback(
            (e) => {
                setData(`check_date_${project.project_id}`, e.target.value);
            },
            [project.project_id, setData],
        );

        const handleReceiptNumChange = useCallback(
            (e) => {
                setData(
                    `receipt_num_${project.project_id}`,
                    e.target.value.replace(/\D/g, "").slice(0, 20),
                );
            },
            [project.project_id, setData],
        );

        const handleReceiptDateChange = useCallback(
            (e) => {
                setData(`receipt_date_${project.project_id}`, e.target.value);
            },
            [project.project_id, setData],
        );

        const handleBankNameChange = useCallback(
            (e) => {
                setData(`bank_name_${project.project_id}`, e.target.value);
            },
            [project.project_id, setData],
        );

        const handleRemovePayment = useCallback(
            (index) => {
                const month = String(selectedMonth).padStart(2, "0");
                const month_paid = `${selectedYear}-${month}-01`;

                router.post(
                    "/refunds/remove-payment",
                    {
                        project_id: project.project_id,
                        month_paid,
                        payment_index: index,
                    },
                    { preserveScroll: true, preserveState: true },
                );
            },
            [project.project_id, selectedMonth, selectedYear],
        );

        const updatedByBlock = (() => {
            const refund = project?.refunds?.[0];
            if (!refund?.updated_at) return null;
            const editorName = refund?.editor?.name ?? null;
            const updatedAt = new Date(refund.updated_at);
            const date = updatedAt.toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
            });
            const time = updatedAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            return (
                <div className="text-center space-y-0.5 mt-1">
                    {editorName && (
                        <p className="text-xs text-gray-400 leading-tight">
                            Updated by: <br />
                            {editorName}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 leading-tight whitespace-nowrap">
                        {date} - {time}
                    </p>
                </div>
            );
        })();

        return (
            <>
                <tr className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group">
                    {/* Project & Company */}
                    <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="max-w-xs">
                            <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                                {project.project_title}
                            </div>
                            <div className="text-xs text-gray-600 font-medium mb-0.5">
                                {project.proponent.company_name}
                            </div>
                            <div className="text-xs text-gray-500">
                                {project.project_id}
                            </div>
                        </div>
                    </td>

                    {/* Amount Due */}
                    <td className="px-2 py-3 md:py-4 w-36 md:w-44">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                ₱
                            </span>
                            <input
                                type="number"
                                value={
                                    data[`amount_due_${project.project_id}`] ??
                                    ""
                                }
                                onChange={handleAmountDueChange}
                                className="w-full pl-6 pr-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                                placeholder="0.00"
                                disabled
                            />
                        </div>
                    </td>

                    {/* New payment amount + payments toggle */}
                    <td className="px-2 py-3 md:py-4 w-36 md:w-44">
                        <div className="space-y-1.5">
                            {/* Total paid so far */}
                            {payments.length > 0 && (
                                <div className="text-xs text-gray-500 font-medium">
                                    Total paid: ₱
                                    {totalPaid.toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    <br />
                                    <span className="text-gray-400">
                                        ({payments.length} payment
                                        {payments.length > 1 ? "s" : ""})
                                    </span>
                                </div>
                            )}

                            {/* New payment input */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                    ₱
                                </span>
                                <input
                                    type="number"
                                    value={data[`refund_amount_${project.project_id}`] ?? ""}
                                    onChange={handleNewAmountChange}
                                    className={`w-full pl-6 pr-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                        isRestructured ? "bg-gray-100 cursor-not-allowed" : ""
                                    }`}
                                    placeholder={payments.length > 0 ? "Add payment..." : "0.00"}
                                    disabled={isRestructured || !isRPMO}
                                />
                            </div>

                            <input
                                type="text"
                                value={data[`bank_name_${project.project_id}`] ?? ""}
                                onChange={handleBankNameChange}
                                className={`w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                    isRestructured ? "bg-gray-100 cursor-not-allowed" : ""
                                }`}
                                placeholder="Bank name"
                                disabled={isRestructured || !isRPMO}
                            />

                            {/* Toggle payments list */}
                            {payments.length > 0 && (
                                <button
                                    onClick={() => setShowPayments((v) => !v)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    {showPayments ? (
                                        <ChevronUp className="w-3 h-3" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3" />
                                    )}
                                    {showPayments ? "Hide" : "View"} payments
                                </button>
                            )}
                        </div>
                    </td>

                    {/* Check No. & Date */}
                    <td className="px-2 py-3 md:py-4 w-28 md:w-32">
                        <div className="space-y-1.5">
                            <input
                                type="text"
                                value={
                                    data[`check_num_${project.project_id}`] ??
                                    ""
                                }
                                onChange={handleCheckNumChange}
                                className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Check No."
                                disabled={!isRPMO}
                            />
                            <input
                                type="date"
                                value={
                                    data[`check_date_${project.project_id}`] ??
                                    ""
                                }
                                onChange={handleCheckDateChange}
                                className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                disabled={!isRPMO}
                            />
                        </div>
                    </td>

                    {/* Receipt No. & Date */}
                    <td className="px-2 py-3 md:py-4 w-28 md:w-32">
                        <div className="space-y-1.5">
                            <input
                                type="text"
                                value={
                                    data[`receipt_num_${project.project_id}`] ??
                                    ""
                                }
                                onChange={handleReceiptNumChange}
                                className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Receipt No."
                                disabled={!isRPMO}
                            />
                            <input
                                type="date"
                                value={
                                    data[
                                        `receipt_date_${project.project_id}`
                                    ] ?? ""
                                }
                                onChange={handleReceiptDateChange}
                                className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                disabled={!isRPMO}
                            />
                        </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <select
                            value={currentStatus}
                            onChange={(e) =>
                                onStatusChange(
                                    project.project_id,
                                    e.target.value,
                                )
                            }
                            className={`px-2 pr-4 py-1 text-xs font-medium rounded-lg focus:ring-1 transition-all duration-200 w-full ${
                                STATUS_STYLES[currentStatus] ||
                                STATUS_STYLES.unpaid
                            }`}
                            disabled={!isRPMO}
                            title={`Refund Period: ${refundInitialFormatted} to ${refundEndFormatted}`}
                        >
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="restructured">Restructured</option>
                        </select>
                        {updatedByBlock}
                    </td>

                    {/* Actions */}
                    <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center justify-center gap-2">
                            <Link
                                href={`/refunds/project/${project.project_id}`}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                title="View Full Details"
                            >
                                <Eye className="w-5 h-5" />
                            </Link>
                            {renderSaveButton(project.project_id)}
                        </div>
                    </td>
                </tr>

                {/* Expanded payments list */}
                {showPayments && payments.length > 0 && (
                    <tr className="bg-blue-50/40">
                        <td colSpan="7" className="px-6 py-3">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Payment history for this month
                            </div>
                            <div className="space-y-1.5">
                                {payments.map((payment, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 bg-white rounded-lg px-3 py-2 border border-gray-100 text-xs text-gray-700"
                                    >
                                        <span className="font-semibold text-gray-400 w-4">
                                            #{index + 1}
                                        </span>
                                        <span className="font-semibold text-green-700 min-w-[90px]">
                                            ₱
                                            {parseFloat(
                                                payment.amount || 0,
                                            ).toLocaleString("en-PH", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                        {payment.check_num && (
                                            <span className="text-gray-500">
                                                Check:{" "}
                                                <span className="text-gray-700 font-medium">
                                                    {payment.check_num}
                                                </span>
                                                {payment.check_date && (
                                                    <span className="text-gray-400 ml-1">
                                                        ({payment.check_date})
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                        {payment.receipt_num && (
                                            <span className="text-gray-500">
                                                OR:{" "}
                                                <span className="text-gray-700 font-medium">
                                                    {payment.receipt_num}
                                                </span>
                                                {payment.receipt_date && (
                                                    <span className="text-gray-400 ml-1">
                                                        ({payment.receipt_date})
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                        {payment.bank_name && (
                                            <span className="text-gray-500">
                                                Bank:{" "}
                                                <span className="text-gray-700 font-medium">
                                                    {payment.bank_name}
                                                </span>
                                            </span>
                                        )}
                                        {payment.saved_at && (
                                            <span className="text-gray-400 ml-auto">
                                                {new Date(
                                                    payment.saved_at,
                                                ).toLocaleDateString("en-PH", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        )}
                                        {isRPMO && (
                                            <button
                                                onClick={() =>
                                                    handleRemovePayment(index)
                                                }
                                                className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove this payment"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </td>
                    </tr>
                )}
            </>
        );
    },
);

RefundTableRow.displayName = "RefundTableRow";
export default RefundTableRow;
