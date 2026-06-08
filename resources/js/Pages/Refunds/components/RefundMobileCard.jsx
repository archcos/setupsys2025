// components/RefundMobileCard.jsx
import React, { useCallback, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Eye, ChevronDown, ChevronUp, Trash2, Edit2, X, Save } from "lucide-react";
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
        // Edit functionality props
        onEditPayment,
        editingPayment,
        editFormData,
        onEditFormChange,
        onUpdatePayment,
        onCancelEdit
    }) => {
        const [showPayments, setShowPayments] = useState(false);
        const isRestructured = currentStatus === REFUND_STATUS.RESTRUCTURED;
        const latestRefund = project.refunds?.[0];
        const payments = latestRefund?.payments ?? [];
        const totalPaid = payments.reduce(
            (sum, p) => sum + (parseFloat(p.amount) || 0),
            0,
        );
        
        // Check if this project is currently being edited
        const isEditingThis = editingPayment?.project_id === project.project_id;

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
                if (confirm('Are you sure you want to remove this payment?')) {
                    router.post(
                        "/refunds/remove-payment",
                        {
                            project_id: project.project_id,
                            month_paid,
                            payment_index: index,
                        },
                        { preserveScroll: true, preserveState: true },
                    );
                }
            },
            [project.project_id, selectedMonth, selectedYear],
        );

        const handleStartEdit = (payment, index) => {
            const month = String(selectedMonth).padStart(2, "0");
            const month_paid = `${selectedYear}-${month}-01`;
            onEditPayment(project.project_id, month_paid, index, payment);
        };

        // Edit Modal Component for Mobile
        const EditPaymentModal = () => {
            if (!isEditingThis) return null;
            
            return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl px-4 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-white" />
                                <h3 className="text-sm font-semibold text-white">
                                    Edit Payment
                                </h3>
                            </div>
                            <button
                                onClick={onCancelEdit}
                                className="text-white/70 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-4 space-y-3">
                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Amount (₱)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editFormData.amount}
                                        onChange={(e) => onEditFormChange('amount', e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Bank Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.bank_name}
                                    onChange={(e) => onEditFormChange('bank_name', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                    placeholder="Bank name"
                                />
                            </div>

                            {/* Check Number & Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Check #
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.check_num}
                                        onChange={(e) => onEditFormChange('check_num', e.target.value.replace(/\D/g, "").slice(0, 20))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                        placeholder="Check #"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Check Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editFormData.check_date}
                                        onChange={(e) => onEditFormChange('check_date', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                            </div>

                            {/* OR Number & Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        OR #
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.receipt_num}
                                        onChange={(e) => onEditFormChange('receipt_num', e.target.value.replace(/\D/g, "").slice(0, 20))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                        placeholder="OR #"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        OR Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editFormData.receipt_date}
                                        onChange={(e) => onEditFormChange('receipt_date', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-gray-50 rounded-b-xl px-4 py-3 flex gap-2 justify-end">
                            <button
                                onClick={onCancelEdit}
                                className="px-3 py-1.5 bg-white text-gray-600 rounded-lg hover:bg-gray-100 text-xs font-medium border border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onUpdatePayment}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
                            >
                                <Save className="w-3 h-3" />
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <>
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
                                    {payment.bank_name && (
                                        <span className="text-gray-500">
                                            {payment.bank_name}
                                        </span>
                                    )}
                                    {isRPMO && (
                                        <div className="ml-auto flex gap-1">
                                            <button
                                                onClick={() => handleStartEdit(payment, index)}
                                                className="p-1 text-blue-400 hover:text-blue-600 rounded transition-colors"
                                                title="Edit payment"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleRemovePayment(index)}
                                                className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                                                title="Remove payment"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Check and Receipt Numbers for new payment */}
                    <div className="grid grid-cols-3 gap-2">
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
                        <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                value={data[`bank_name_${project.project_id}`] ?? ""}
                                onChange={handleBankNameChange}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Bank name"
                                disabled={!isRPMO || isRestructured}
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
                
                {/* Edit Modal */}
                <EditPaymentModal />
            </>
        );
    },
);

RefundMobileCard.displayName = "RefundMobileCard";
export default RefundMobileCard;