// components/RefundTableRow.jsx
import React, { useState, useCallback } from "react";
import { Link, router } from "@inertiajs/react";
import { Eye, Trash2, Edit2, ChevronDown, ChevronUp, X, Save, CreditCard, Building, Receipt, FileText } from "lucide-react";
import { REFUND_STATUS, STATUS_STYLES } from "../constants/refundConstants";

// ── Remarks Field Component ──────────────────────────────────────────────────
function RemarksField({ value, onChange, disabled }) {
    const remarksOptions = ["", "DAIF", "Techno Transfer"];
    const [isCustom, setIsCustom] = useState(
        value && !remarksOptions.includes(value)
    );

    const handleChange = (newValue) => {
        if (newValue === "custom") {
            setIsCustom(true);
            onChange("");
        } else {
            setIsCustom(false);
            onChange(newValue);
        }
    };

    if (isCustom) {
        return (
            <div className="flex items-center gap-1">
                <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Custom remarks"
                    disabled={disabled}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <button
                    onClick={() => { setIsCustom(false); onChange(""); }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex-shrink-0"
                    type="button" disabled={disabled}
                >
                    List
                </button>
            </div>
        );
    }

    return (
        <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
            <option value="">Select remarks...</option>
            {remarksOptions.filter(r => r).map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
            <option value="custom">Custom...</option>
        </select>
    );
}

const RefundTableRow = React.memo(
    ({
        project, data, setData, isRPMO, currentStatus, onStatusChange,
        renderSaveButton, selectedMonth, selectedYear,
        onEditPayment, editingPayment, editFormData, onEditFormChange,
        onUpdatePayment, onCancelEdit
    }) => {
        const [showPayments, setShowPayments] = useState(false);
        const latestRefund = project.refunds?.[0];
        const payments = latestRefund?.payments ?? [];
        
        const totalPaid = payments.reduce((sum, p) => {
            const remarks = p.remarks || '';
            const isValid = !remarks || remarks === 'Techno Transfer';
            return sum + (isValid ? (parseFloat(p.amount) || 0) : 0);
        }, 0);
        
        const isRestructured = currentStatus === REFUND_STATUS.RESTRUCTURED;
        const isEditingThis = editingPayment?.project_id === project.project_id;

        const s = (key) => data[`${key}_${project.project_id}`] ?? "";

        const handleRemovePayment = useCallback((index) => {
            const month = String(selectedMonth).padStart(2, "0");
            const month_paid = `${selectedYear}-${month}-01`;
            if (confirm('Remove this payment entry?')) {
                router.post("/refunds/remove-payment", {
                    project_id: project.project_id, month_paid, payment_index: index,
                }, { preserveScroll: true, preserveState: true });
            }
        }, [project.project_id, selectedMonth, selectedYear]);

        const handleStartEdit = (payment, index) => {
            const month = String(selectedMonth).padStart(2, "0");
            onEditPayment(project.project_id, `${selectedYear}-${month}-01`, index, payment);
        };

const updatedByBlock = (() => {
    const refund = project?.refunds?.[0];
    if (!refund?.updated_at) return null;
    const editorName = refund?.editor?.name ?? null;
    const updatedAt = new Date(refund.updated_at);
    return (
        <div className="text-center text-[10px] text-gray-400 leading-tight">
            {editorName && <p>{editorName}</p>}
            <p>
                {updatedAt.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                {" "}
                {updatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
        </div>
    );
})();

const EditPaymentModal = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    
    if (!isEditingThis) return null;
    
    const handleUpdate = () => {
        setIsUpdating(true);
        onUpdatePayment();
        // Reset after a short delay (or you can use the router's onFinish callback)
        setTimeout(() => setIsUpdating(false), 2000);
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                        Edit Payment Entry
                    </h3>
                    <button onClick={onCancelEdit} className="p-1 text-gray-400 hover:text-gray-600 rounded" disabled={isUpdating}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                            <input type="number" step="0.01" value={editFormData.amount}
                                onChange={(e) => onEditFormChange('amount', e.target.value)}
                                disabled={isUpdating}
                                className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                                placeholder="0.00" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Bank Name</label>
                        <input type="text" value={editFormData.bank_name}
                            onChange={(e) => onEditFormChange('bank_name', e.target.value)}
                            disabled={isUpdating}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                            placeholder="Bank name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Check Number</label>
                            <input type="text" value={editFormData.check_num}
                                onChange={(e) => onEditFormChange('check_num', e.target.value.replace(/\D/g, "").slice(0, 20))}
                                disabled={isUpdating}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                                placeholder="Check #" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Check Date</label>
                            <input type="date" value={editFormData.check_date}
                                onChange={(e) => onEditFormChange('check_date', e.target.value)}
                                disabled={isUpdating}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">OR Number</label>
                            <input type="text" value={editFormData.receipt_num}
                                onChange={(e) => onEditFormChange('receipt_num', e.target.value.replace(/\D/g, "").slice(0, 20))}
                                disabled={isUpdating}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                                placeholder="OR #" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">OR Date</label>
                            <input type="date" value={editFormData.receipt_date}
                                onChange={(e) => onEditFormChange('receipt_date', e.target.value)}
                                disabled={isUpdating}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Remarks</label>
                        <RemarksField value={editFormData.remarks || ""} 
                            onChange={(value) => onEditFormChange('remarks', value)} 
                            disabled={isUpdating} />
                    </div>
                </div>
                <div className="bg-gray-50 rounded-b-xl px-5 py-3 flex gap-2 justify-end border-t border-gray-100">
                    <button onClick={onCancelEdit}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Cancel
                    </button>
                    <button onClick={handleUpdate}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] justify-center">
                        {isUpdating ? (
                            <>
                                <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" /> Update
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

        return (
            <>
                <tr className="hover:bg-gray-50/60 transition-colors group">
                    {/* Project Info */}
                    <td className="px-4 py-3">
                        <div className="max-w-xs">
                            <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                                {project.project_title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {project.proponent.company_name}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                {project.project_id}
                            </div>
                        </div>
                    </td>

                    {/* Amount Due + Remarks */}
                    <td className="px-3 py-3 w-40">
                        <div className="space-y-2">
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₱</span>
                                <input
                                    type="number"
                                    value={s("amount_due")}
                                    onChange={(e) => setData(`amount_due_${project.project_id}`, e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
                                    placeholder="0.00" disabled
                                />
                            </div>
                            <RemarksField
                                value={s("remarks")}
                                onChange={(v) => setData(`remarks_${project.project_id}`, v)}
                                disabled={isRestructured || !isRPMO}
                            />
                        </div>
                    </td>

                    {/* Payment + Bank */}
                    <td className="px-3 py-3 w-40">
                        <div className="space-y-2">
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₱</span>
                                <input
                                    type="number"
                                    value={s("refund_amount")}
                                    onChange={(e) => setData(`refund_amount_${project.project_id}`, e.target.value.slice(0, 10))}
                                    className={`w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 ${
                                        isRestructured ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                                    }`}
                                    placeholder="0.00" disabled={isRestructured || !isRPMO}
                                />
                            </div>
                            <input
                                type="text"
                                value={s("bank_name")}
                                onChange={(e) => setData(`bank_name_${project.project_id}`, e.target.value)}
                                className={`w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 ${
                                    isRestructured ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                                }`}
                                placeholder="Bank" disabled={isRestructured || !isRPMO}
                            />
                        </div>
                    </td>

                    {/* Check Details */}
                    <td className="px-3 py-3 w-36">
                        <div className="space-y-2">
                            <input
                                type="text" value={s("check_num")}
                                onChange={(e) => setData(`check_num_${project.project_id}`, e.target.value.replace(/\D/g, "").slice(0, 20))}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 bg-white"
                                placeholder="Check #" disabled={!isRPMO}
                            />
                            <input
                                type="date" value={s("check_date")}
                                onChange={(e) => setData(`check_date_${project.project_id}`, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 bg-white"
                                disabled={!isRPMO}
                            />
                        </div>
                    </td>

                    {/* Receipt Details */}
                    <td className="px-3 py-3 w-36">
                        <div className="space-y-2">
                            <input
                                type="text" value={s("receipt_num")}
                                onChange={(e) => setData(`receipt_num_${project.project_id}`, e.target.value.replace(/\D/g, "").slice(0, 20))}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 bg-white"
                                placeholder="OR #" disabled={!isRPMO}
                            />
                            <input
                                type="date" value={s("receipt_date")}
                                onChange={(e) => setData(`receipt_date_${project.project_id}`, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400 bg-white"
                                disabled={!isRPMO}
                            />
                        </div>
                    </td>

{/* Status + Updated By + Total Paid + History */}
<td className="px-3 py-3 w-40">
    <div className="space-y-2">
        {/* 1. Status Dropdown */}
        <select
            value={currentStatus}
            onChange={(e) => onStatusChange(project.project_id, e.target.value)}
            className={`px-2 py-1.5 text-xs font-medium rounded-lg focus:ring-1 transition-all w-full ${
                STATUS_STYLES[currentStatus] || STATUS_STYLES.unpaid
            }`}
            disabled={!isRPMO}
        >
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="restructured">Restructured</option>
        </select>
        
        {/* 2. Updated By */}
        {updatedByBlock}
        
        {/* 3. Total Paid + History Toggle */}
        {payments.length > 0 && (
            <div className="text-center">
                <div className="text-xs font-semibold text-emerald-600">
                    ₱{totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </div>
                <button 
                    onClick={() => setShowPayments(v => !v)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 mt-0.5 flex items-center gap-0.5 mx-auto"
                >
                    {showPayments ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    {payments.length} payment{payments.length > 1 ? "s" : ""}
                </button>
            </div>
        )}
    </div>
</td>

                    {/* Actions */}
                    <td className="px-3 py-3 w-20">
                        <div className="flex items-center justify-center gap-1.5">
                            <Link href={`/refunds/project/${project.project_id}`}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Details">
                                <Eye className="w-4 h-4" />
                            </Link>
                            {renderSaveButton(project.project_id)}
                        </div>
                    </td>
                </tr>

                {/* Expanded Payment History */}
                {showPayments && payments.length > 0 && (
                    <tr>
                        <td colSpan="7" className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Payment History
                            </div>
                            <div className="space-y-1.5">
                                {payments.map((payment, index) => {
                                    const remarks = payment.remarks || '';
                                    const isValid = !remarks || remarks === 'Techno Transfer';
                                    const isDAIF = remarks === 'DAIF';
                                    return (
                                        <div key={index}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs border ${
                                                isDAIF ? 'bg-red-50 border-red-200' : 
                                                !isValid && remarks ? 'bg-yellow-50 border-yellow-200' : 
                                                'bg-white border-gray-200'
                                            }`}
                                        >
                                            <span className="text-gray-400 w-4 text-[11px]">#{index + 1}</span>
                                            <span className={`font-semibold min-w-[90px] ${isValid ? 'text-emerald-600' : 'text-red-500 line-through'}`}>
                                                ₱{parseFloat(payment.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </span>
                                            <div className="flex items-center gap-3 flex-wrap text-gray-500 flex-1">
                                                {payment.bank_name && <span>🏦 {payment.bank_name}</span>}
                                                {payment.check_num && <span>💳 Chk #{payment.check_num} {payment.check_date && `(${payment.check_date})`}</span>}
                                                {payment.receipt_num && <span>🧾 OR #{payment.receipt_num} {payment.receipt_date && `(${payment.receipt_date})`}</span>}
                                                {remarks && (
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                                        isDAIF ? 'bg-red-100 text-red-600' : isValid ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                                                    }`}>{remarks}</span>
                                                )}
                                            </div>
                                            {payment.saved_at && (
                                                <span className="text-gray-400 ml-auto text-[11px]">
                                                    {new Date(payment.saved_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                            {isRPMO && (
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleStartEdit(payment, index)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => handleRemovePayment(index)}
                                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </td>
                    </tr>
                )}
                
                <EditPaymentModal />
            </>
        );
    },
);

RefundTableRow.displayName = "RefundTableRow";
export default RefundTableRow;