// components/RefundMobileCard.jsx
import React, { useCallback, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Eye, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { REFUND_STATUS, STATUS_STYLES } from "../constants/refundConstants";

const RefundMobileCard = React.memo(
    ({
        project,
        data,
        setData,
        isRPMO,
        currentStatus,
        onStatusChange,
        onSaveClick,
        renderSaveButton,
        selectedMonth,
        selectedYear,
    }) => {
        const [showPayments, setShowPayments] = useState(false);
        const isRestructured = currentStatus === REFUND_STATUS.RESTRUCTURED;
        const latestRefund = project.refunds?.[0];
        const payments = latestRefund?.payments ?? [];
        const totalPaid = payments.reduce(
            (sum, p) => sum + (parseFloat(p.amount) || 0),
            0,
        );

        const handleRefundAmountChange = useCallback(
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

        const handleReceiptNumChange = useCallback(
            (e) => {
                setData(
                    `receipt_num_${project.project_id}`,
                    e.target.value.replace(/\D/g, "").slice(0, 20),
                );
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

        return (
            <div className="p-4 space-y-3">
                {/* Project Info */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                        {project.project_title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-0.5">
                        {project.proponent.company_name}
                    </p>
                    <p className="text-xs text-gray-500">
                        ID: {project.project_id}
                    </p>
                </div>

                {/* Amount Due and New Payment */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">
                            Amount Due
                        </label>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                ₱
                            </span>
                            <input
                                type="number"
                                value={
                                    data[`amount_due_${project.project_id}`] ??
                                    ""
                                }
                                className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
                                placeholder="0.00"
                                disabled
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">
                            {payments.length > 0
                                ? "Add Payment"
                                : "Refund Amt."}
                        </label>
                        {payments.length > 0 && (
                            <div className="text-xs text-gray-400 mb-1">
                                Total: ₱
                                {totalPaid.toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                        )}
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                ₱
                            </span>
                            <input
                                type="number"
                                value={
                                    data[
                                        `refund_amount_${project.project_id}`
                                    ] ?? ""
                                }
                                onChange={handleRefundAmountChange}
                                className={`w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    isRestructured
                                        ? "bg-gray-100 cursor-not-allowed"
                                        : ""
                                }`}
                                placeholder="0.00"
                                disabled={isRestructured || !isRPMO}
                            />
                        </div>
                    </div>
                </div>

                {/* Payments toggle */}
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
                        {showPayments ? "Hide" : "View"} {payments.length}{" "}
                        payment{payments.length > 1 ? "s" : ""}
                    </button>
                )}

                {/* Payments list */}
                {showPayments && payments.length > 0 && (
                    <div className="space-y-1.5 bg-blue-50/40 rounded-lg p-2">
                        {payments.map((payment, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-white rounded px-2 py-1.5 border border-gray-100 text-xs"
                            >
                                <span className="text-gray-400 font-semibold">
                                    #{index + 1}
                                </span>
                                <span className="text-green-700 font-semibold">
                                    ₱
                                    {parseFloat(
                                        payment.amount || 0,
                                    ).toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                                {payment.check_num && (
                                    <span className="text-gray-500">
                                        Chk: {payment.check_num}
                                    </span>
                                )}
                                {payment.receipt_num && (
                                    <span className="text-gray-500">
                                        OR: {payment.receipt_num}
                                    </span>
                                )}
                                {isRPMO && (
                                    <button
                                        onClick={() =>
                                            handleRemovePayment(index)
                                        }
                                        className="ml-auto p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Check and Receipt Numbers for new payment */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">
                            Check No.
                        </label>
                        <input
                            type="text"
                            value={
                                data[`check_num_${project.project_id}`] ?? ""
                            }
                            onChange={handleCheckNumChange}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Check No."
                            disabled={!isRPMO}
                        />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">
                            Receipt No.
                        </label>
                        <input
                            type="text"
                            value={
                                data[`receipt_num_${project.project_id}`] ?? ""
                            }
                            onChange={handleReceiptNumChange}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Receipt No."
                            disabled={!isRPMO}
                        />
                    </div>
                </div>

                {/* Status and Actions */}
                <div className="flex gap-2">
                    <select
                        value={currentStatus}
                        onChange={(e) =>
                            onStatusChange(project.project_id, e.target.value)
                        }
                        className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg focus:ring-1 transition-all duration-200 ${
                            STATUS_STYLES[currentStatus] || STATUS_STYLES.unpaid
                        }`}
                        disabled={!isRPMO}
                    >
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="restructured">Restructured</option>
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
    },
);

RefundMobileCard.displayName = "RefundMobileCard";
export default RefundMobileCard;
