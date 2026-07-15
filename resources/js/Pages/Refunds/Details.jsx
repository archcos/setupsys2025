import { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Building2,
    Calendar,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Clock,
    FileText,
    RefreshCw,
    ChevronLeft,
    Lock,
    PhilippinePeso,
    AlertCircle,
    CreditCard,
    Receipt,
    Pencil,
    Plus,
    Trash2,
    X,
    Save,
    Maximize2,
    Minimize2,
} from "lucide-react";
import UnpaidMonthsWarningModal from "./components/UnpaidMonthsWarningModal";

const EMPTY_PAYMENT = {
    amount: "",
    amount_due: "",
    bank_name: "",
    check_num: "",
    check_date: "",
    receipt_num: "",
    receipt_date: "",
    remarks: "",
};

// ── Remarks Field Component ──────────────────────────────────────────────────
function RemarksField({ value, onChange }) {
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
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter custom remarks"
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <button
                    onClick={() => {
                        setIsCustom(false);
                        onChange("");
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex-shrink-0"
                    type="button"
                >
                    Use List
                </button>
            </div>
        );
    }

    return (
        <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
        >
            <option value="">Select remarks...</option>
            {remarksOptions.filter(r => r).map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
            <option value="custom">Custom...</option>
        </select>
    );
}

// ── Shared single-line payment input row ──────────────────────────────────────
function PaymentRow({ payment, index, showIndex, onChange, onRemove }) {
    const cls =
        "w-0 flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white";

    return (
        <div className="flex items-center gap-1.5">
            {showIndex && (
                <span className="text-[10px] text-gray-400 w-4 flex-shrink-0">
                    #{index + 1}
                </span>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
                <PhilippinePeso className="w-3 h-3 text-gray-400" />
                <input
                    type="number"
                    value={payment.amount}
                    onChange={(e) => onChange("amount", e.target.value)}
                    placeholder="Amount"
                    className="w-24 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                />
            </div>
            <input
                type="text"
                value={payment.bank_name || ""}
                onChange={(e) => onChange("bank_name", e.target.value)}
                placeholder="Bank"
                className={cls}
            />
            <input
                type="number"
                value={payment.check_num || ""}
                onChange={(e) =>
                    onChange("check_num", e.target.value.slice(0, 10))
                }
                placeholder="Check #"
                className={cls}
            />
            <input
                type="date"
                value={payment.check_date || ""}
                onChange={(e) => onChange("check_date", e.target.value)}
                className={cls}
            />
            <input
                type="number"
                value={payment.receipt_num || ""}
                onChange={(e) =>
                    onChange("receipt_num", e.target.value.slice(0, 10))
                }
                placeholder="OR #"
                className={cls}
            />
            <input
                type="date"
                value={payment.receipt_date || ""}
                onChange={(e) => onChange("receipt_date", e.target.value)}
                className={cls}
            />
            <div className="w-0 flex-1">
                <RemarksField
                    value={payment.remarks}
                    onChange={(value) => onChange("remarks", value)}
                />
            </div>
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove"
                    type="button"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}

// ── Single Payment Entry Form ────────────────────────────────────────────────
function PaymentEntryForm({ row, pIdx, totalRows, onUpdate, onRemove, showAmountDue }) {
    return (
        <div className="space-y-2">
            {totalRows > 1 && (
                <span className="text-[10px] text-gray-400 block">
                    Entry #{pIdx + 1}
                </span>
            )}
            
            {/* Refund Amount Row (amount_due) - only show if needed */}
            {showAmountDue && (
                <div>
                    <label className="text-[10px] font-medium text-gray-500 block mb-1">
                        Refund Amount
                    </label>
                    <div className="flex items-center gap-1">
                        <PhilippinePeso className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <input
                            type="number"
                            value={row.amount_due || ""}
                            onChange={(e) => onUpdate("amount_due", e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                    </div>
                </div>
            )}
            
            {/* Payment Amount Row */}
            <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">
                    Payment Amount
                </label>
                <div className="flex items-center gap-1">
                    <PhilippinePeso className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => onUpdate("amount", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            {/* Bank Name Row */}
            <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">
                    Bank Name
                </label>
                <input
                    type="text"
                    value={row.bank_name || ""}
                    onChange={(e) => onUpdate("bank_name", e.target.value)}
                    placeholder="Enter bank name"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                />
            </div>

            {/* Check Number & Check Date Row */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] font-medium text-gray-500 block mb-1">
                        Check Number
                    </label>
                    <input
                        type="number"
                        value={row.check_num || ""}
                        onChange={(e) => onUpdate("check_num", e.target.value.slice(0, 10))}
                        placeholder="Check #"
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-medium text-gray-500 block mb-1">
                        Check Date
                    </label>
                    <input
                        type="date"
                        value={row.check_date || ""}
                        onChange={(e) => onUpdate("check_date", e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            {/* Receipt Number & Receipt Date Row */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] font-medium text-gray-500 block mb-1">
                        OR Number
                    </label>
                    <input
                        type="number"
                        value={row.receipt_num || ""}
                        onChange={(e) => onUpdate("receipt_num", e.target.value.slice(0, 10))}
                        placeholder="OR #"
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-medium text-gray-500 block mb-1">
                        OR Date
                    </label>
                    <input
                        type="date"
                        value={row.receipt_date || ""}
                        onChange={(e) => onUpdate("receipt_date", e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            {/* Remarks Row */}
            <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">
                    Remarks
                </label>
                <RemarksField
                    value={row.remarks}
                    onChange={(value) => onUpdate("remarks", value)}
                />
            </div>

            {/* Remove button */}
            {totalRows > 1 && (
                <button
                    onClick={onRemove}
                    className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors w-full justify-center border border-red-200 mt-2"
                    type="button"
                >
                    <Trash2 className="w-2.5 h-2.5" />
                    Remove Entry
                </button>
            )}
        </div>
    );
}

// ── Floating Bulk Update Panel (right side only) ───────────────────────────
function FloatingBulkPanel({ 
    isOpen, 
    onClose, 
    selectedMonths, 
    months, 
    monthPayments,
    onUpdatePayment,
    onAddPaymentRow,
    onRemovePaymentRow,
    onUpdateAmountDue,
    onSubmit,
    isUpdating 
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [bulkStatus, setBulkStatus] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!bulkStatus) return;
        onSubmit(bulkStatus);
        setBulkStatus("");
    };

    return (
        <div 
            className="fixed top-0 right-0 z-50 bg-white shadow-2xl border-l-2 border-blue-500 transition-all duration-300 flex flex-col"
            style={{ 
                width: isExpanded ? '520px' : '380px',
                height: '100vh',
            }}
        >
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {selectedMonths.length}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                            month{selectedMonths.length !== 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                            type="button"
                        >
                            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content - Step 1: Payment Details */}
            <div className="flex-1 overflow-y-auto">
                {isExpanded && (
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Step 1</span>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                Payment Details (optional)
                            </label>
                        </div>
                        <div className="space-y-4">
                            {selectedMonths.map((monthDate) => {
                                const month = months.find((m) => m.month_date === monthDate);
                                const rows = monthPayments[monthDate] || [];

                                return (
                                    <div
                                        key={monthDate}
                                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-gray-700">
                                                {month?.month}
                                            </span>
                                            <button
                                                onClick={() => onAddPaymentRow(monthDate)}
                                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                type="button"
                                            >
                                                <Plus className="w-2.5 h-2.5" />
                                                Add entry
                                            </button>
                                        </div>

                                        {/* Amount Due - Once per month */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                                        <label className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                                            Refund Amount (Amount Due)
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <PhilippinePeso className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                            <input
                                                type="number"
                                                value={rows[0]?.amount_due ?? ""}
                                                onChange={(e) => onUpdateAmountDue(monthDate, e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-2 py-1.5 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                                            />
                                        </div>
                                        <p className="text-[9px] text-blue-400 mt-1">Expected refund amount for this month</p>
                                    </div>

                                        {/* Payment Entries */}
                                        {rows.map((row, pIdx) => (
                                            <BulkPaymentEntryForm
                                                key={pIdx}
                                                row={row}
                                                pIdx={pIdx}
                                                totalRows={rows.length}
                                                onUpdate={(field, value) =>
                                                    onUpdatePayment(monthDate, pIdx, field, value)
                                                }
                                                onRemove={() =>
                                                    onRemovePaymentRow(monthDate, pIdx)
                                                }
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer hint when collapsed */}
                {!isExpanded && (
                    <div className="flex-shrink-0 px-4 py-3 text-center">
                        <p className="text-[11px] text-gray-400">
                            Click expand to view payment details
                        </p>
                    </div>
                )}
            </div>

            {/* Step 2: Status & Save - Fixed at bottom */}
            <div className="flex-shrink-0 border-t-2 border-blue-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Step 2</span>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Select Status & Save
                    </label>
                </div>
                
                <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white font-medium mb-2"
                >
                    <option value="">— Select Status —</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="restructured">Restructured</option>
                </select>
                
                {!bulkStatus && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1 mb-2">
                        <AlertCircle className="w-3 h-3" />
                        Select a status to enable save
                    </p>
                )}
                
                <button
                    onClick={handleSubmit}
                    disabled={!bulkStatus || isUpdating}
                    className={`w-full px-4 py-2.5 text-sm rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        !bulkStatus || isUpdating
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700 shadow-md"
                    }`}
                    type="button"
                >
                    {isUpdating ? (
                        <>
                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save to {selectedMonths.length} Month{selectedMonths.length !== 1 ? 's' : ''}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ── Bulk Payment Entry Form (without amount_due - that's handled per month) ──
function BulkPaymentEntryForm({ row, pIdx, totalRows, onUpdate, onRemove }) {
    return (
        <div className="space-y-2 border-t border-gray-200 pt-2">
            {totalRows > 1 && (
                <span className="text-[10px] text-gray-400 block">
                    Payment Entry #{pIdx + 1}
                </span>
            )}
            
            {/* Payment Amount Row */}
            <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">
                    Payment Amount
                </label>
                <div className="flex items-center gap-1">
                    <PhilippinePeso className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => onUpdate("amount", e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            {/* Bank Name */}
            <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">Bank Name</label>
                <input type="text" value={row.bank_name || ""} onChange={(e) => onUpdate("bank_name", e.target.value)}
                    placeholder="Enter bank name" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>

            {/* Check Number & Check Date */}
            <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-medium text-gray-500 block mb-1">Check Number</label>
                    <input type="number" value={row.check_num || ""} onChange={(e) => onUpdate("check_num", e.target.value.slice(0, 10))}
                        placeholder="Check #" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 block mb-1">Check Date</label>
                    <input type="date" value={row.check_date || ""} onChange={(e) => onUpdate("check_date", e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white" /></div>
            </div>

            {/* OR Number & OR Date */}
            <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-medium text-gray-500 block mb-1">OR Number</label>
                    <input type="number" value={row.receipt_num || ""} onChange={(e) => onUpdate("receipt_num", e.target.value.slice(0, 10))}
                        placeholder="OR #" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 block mb-1">OR Date</label>
                    <input type="date" value={row.receipt_date || ""} onChange={(e) => onUpdate("receipt_date", e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white" /></div>
            </div>

            {/* Remarks */}
            <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">Remarks</label>
                <RemarksField value={row.remarks} onChange={(value) => onUpdate("remarks", value)} />
            </div>

            {/* Remove button */}
            {totalRows > 1 && (
                <button onClick={onRemove}
                    className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors w-full justify-center border border-red-200 mt-2" type="button">
                    <Trash2 className="w-2.5 h-2.5" /> Remove Entry
                </button>
            )}
        </div>
    );
}

export default function Details({ project, months, summary }) {
    const { userRole, flash } = usePage().props;

    // ── Bulk select state ─────────────────────────────────────────────────────
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [monthPayments, setMonthPayments] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [showBulkPanel, setShowBulkPanel] = useState(false);

    // ── Per-month inline edit state ───────────────────────────────────────────
    const [editingMonth, setEditingMonth] = useState(null);
    const [editStatus, setEditStatus] = useState("");
    const [editAmountDue, setEditAmountDue] = useState("");
    const [editPayments, setEditPayments] = useState([]);
    const [newPayment, setNewPayment] = useState({ ...EMPTY_PAYMENT });
    const [isSaving, setIsSaving] = useState(false);

    // ── Project edit state ────────────────────────────────────────────────────
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editProjectData, setEditProjectData] = useState({
        refund_amount: project.refund_amount || "",
        refund_initial: project.refund_initial || "",
        refund_end: project.refund_end || "",
        last_refund: project.last_refund || "",
    });
    const [isSavingProject, setIsSavingProject] = useState(false);

    // ── Add Month state ───────────────────────────────────────────────────────
    const [showAddMonthModal, setShowAddMonthModal] = useState(false);
    const [newMonthData, setNewMonthData] = useState({
        month_from: "",
        month_to: "",
        status: "unpaid",
        amount_due: "",
        amount: "",
        bank_name: "",
        check_num: "",
        check_date: "",
        receipt_num: "",
        receipt_date: "",
        remarks: "",
    });
    const [isAddingMonth, setIsAddingMonth] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteData, setDeleteData] = useState({
        monthDate: "",
        monthName: "",
        isFirstMonth: false,
        isLastMonth: false,
        isMiddleMonth: false,
        monthsToDelete: [],
        newInitialDate: "",
        newEndDate: "",
    });

    // ── Warning modal ─────────────────────────────────────────────────────────
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningData, setWarningData] = useState({
        unpaidMonths: [],
        projectTitle: "",
        refundInitial: "",
        refundEnd: "",
        message: "",
        action: "",
    });

    // ── Payment deletion modal state ──────────────────────────────────────────
    const [showPaymentDeleteModal, setShowPaymentDeleteModal] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState({
        month: null,
        paymentIndex: -1,
        paymentDetails: null,
    });

    const isRPMO = ["rpmo", "au"].includes(userRole);
    const isAU = userRole === "au";

    useEffect(() => {
        if (flash?.warning) {
            setWarningData({
                unpaidMonths: flash.warning.unpaid_months || [],
                projectTitle: flash.warning.project_title || "",
                refundInitial: flash.warning.refund_initial || "",
                refundEnd: flash.warning.refund_end || "",
                message: flash.warning.message || "Cannot update project status.",
                action: flash.warning.action || "",
            });
            setShowWarningModal(true);
        }
    }, [flash?.warning]);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(amount || 0);

    // ── Bulk helpers ──────────────────────────────────────────────────────────
    const buildMonthPayments = (month) => {
        const existing = Array.isArray(month.payments) ? month.payments : [];
        const rows = existing.length > 0
            ? existing.map((p) => ({ ...EMPTY_PAYMENT, ...p }))
            : [{ ...EMPTY_PAYMENT }];
        
        // Set amount_due on the first row from the month data
        if (rows.length > 0) {
            rows[0].amount_due = month.amount_due || "";
        }
        
        return rows;
    };

    const handleSelectMonth = (monthDate) => {
        if (!isRPMO) return;
        setSelectedMonths((prev) => {
            if (prev.includes(monthDate)) {
                setMonthPayments((mp) => {
                    const next = { ...mp };
                    delete next[monthDate];
                    return next;
                });
                const newSelected = prev.filter((m) => m !== monthDate);
                if (newSelected.length === 0) {
                    setShowBulkPanel(false);
                }
                return newSelected;
            } else {
                const month = months.find((m) => m.month_date === monthDate);
                setMonthPayments((mp) => ({
                    ...mp,
                    [monthDate]: buildMonthPayments(month),
                }));
                const newSelected = [...prev, monthDate];
                if (newSelected.length === 1) {
                    setShowBulkPanel(true);
                }
                return newSelected;
            }
        });
    };

    const handleSelectAll = () => {
        if (!isRPMO) return;
        if (selectedMonths.length === months.length) {
            setSelectedMonths([]);
            setMonthPayments({});
            setShowBulkPanel(false);
        } else {
            const all = months.map((m) => m.month_date);
            setSelectedMonths(all);
            const mp = {};
            months.forEach((m) => {
                mp[m.month_date] = buildMonthPayments(m);
            });
            setMonthPayments(mp);
            setShowBulkPanel(true);
        }
    };

    const updateBulkPayment = (monthDate, rowIndex, field, value) => {
        setMonthPayments((mp) => ({
            ...mp,
            [monthDate]: mp[monthDate].map((p, i) =>
                i === rowIndex ? { ...p, [field]: value } : p,
            ),
        }));
    };

    const addBulkPaymentRow = (monthDate) => {
        setMonthPayments((mp) => ({
            ...mp,
            [monthDate]: [...(mp[monthDate] || []), { ...EMPTY_PAYMENT, amount_due: "" }],
        }));
    };

    const removeBulkPaymentRow = (monthDate, rowIndex) => {
        setMonthPayments((mp) => {
            const next = mp[monthDate].filter((_, i) => i !== rowIndex);
            return {
                ...mp,
                [monthDate]: next.length > 0 ? next : [{ ...EMPTY_PAYMENT }],
            };
        });
    };

    const updateBulkAmountDue = (monthDate, value) => {
        setMonthPayments((mp) => ({
            ...mp,
            [monthDate]: mp[monthDate].map((p) => ({ ...p, amount_due: value })),
        }));
    };

const handleBulkUpdate = (bulkStatus) => {
    if (!isRPMO || !bulkStatus || selectedMonths.length === 0) return;
    setIsUpdating(true);

    const monthDetails = {};
    Object.entries(monthPayments).forEach(([date, rows]) => {
        const amountDue = rows[0]?.amount_due || null;
        
        // Always include at least one row per month
        const filteredRows = rows.filter((r) => {
            const hasAmount = parseFloat(r.amount) > 0;
            const hasAmountDue = parseFloat(r.amount_due) > 0;
            const hasRemarks = r.remarks && r.remarks !== '';
            const hasDetails = r.bank_name || r.check_num || r.receipt_num;
            return hasAmount || hasAmountDue || hasRemarks || hasDetails;
        });
        
        // If nothing filtered but we have amount_due, still include it
        if (filteredRows.length === 0 && amountDue) {
            monthDetails[date] = [{
                amount: 0,
                amount_due: amountDue,
                bank_name: null,
                check_num: null,
                check_date: null,
                receipt_num: null,
                receipt_date: null,
                remarks: null,
            }];
        } else if (filteredRows.length > 0) {
            monthDetails[date] = filteredRows.map((r) => ({
                amount: r.amount || 0,
                amount_due: amountDue,
                bank_name: r.bank_name || null,
                check_num: r.check_num || null,
                check_date: r.check_date || null,
                receipt_num: r.receipt_num || null,
                receipt_date: r.receipt_date || null,
                remarks: r.remarks || null,
            }));
        }
    });

    console.log('Bulk update sending:', { month_details: monthDetails });

    router.post(
        "/refunds/bulk-update",
        {
            project_id: project.project_id,
            month_dates: selectedMonths,
            status: bulkStatus,
            month_details: monthDetails,
        },
        {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedMonths([]);
                setMonthPayments({});
                setShowBulkPanel(false);
            },
            onFinish: () => setIsUpdating(false),
        },
    );
};

    // ── Per-month inline edit handlers ────────────────────────────────────────
    const openEdit = (month) => {
        setEditingMonth(month.month_date);
        setEditStatus(month.status);
        setEditAmountDue(month.amount_due || "");
        const existing = Array.isArray(month.payments) ? month.payments : [];
        setEditPayments(existing.map((p) => ({ ...p, remarks: p.remarks || "" })));
        setNewPayment({ ...EMPTY_PAYMENT });
    };

    const closeEdit = () => {
        setEditingMonth(null);
        setEditStatus("");
        setEditAmountDue(""); 
        setEditPayments([]);
        setNewPayment({ ...EMPTY_PAYMENT });
    };

    const updateExistingPayment = (idx, field, value) => {
        setEditPayments((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
        );
    };

    const handleSave = (month) => {
        if (!isRPMO) return;
        setIsSaving(true);

        router.post(
            "/refunds/save",
            {
                project_id: project.project_id,
                save_date: month.month_date,
                status: editStatus,
                amount_due: parseFloat(editAmountDue || month.amount_due) || 0,
                amount: newPayment.amount || 0,  // Send 0 instead of null
                bank_name: newPayment.bank_name || null,
                check_num: newPayment.check_num || null,
                check_date: newPayment.check_date || null,
                receipt_num: newPayment.receipt_num || null,
                receipt_date: newPayment.receipt_date || null,
                remarks: newPayment.remarks || null,  // Always send remarks
                existing_payments: editPayments.map((ep) => ({
                    amount: ep.amount || 0,  // Send 0 instead of null
                    bank_name: ep.bank_name || null,
                    check_num: ep.check_num || null,
                    check_date: ep.check_date || null,
                    receipt_num: ep.receipt_num || null,
                    receipt_date: ep.receipt_date || null,
                    remarks: ep.remarks || null,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => closeEdit(),
                onFinish: () => setIsSaving(false),
            },
        );
    };

    // ── Payment deletion handlers ─────────────────────────────────────────────
    const handleRemovePaymentClick = (month, paymentIndex) => {
        if (!isRPMO) return;
        
        const payments = Array.isArray(month.payments) ? month.payments : [];
        const payment = payments[paymentIndex];
        
        setPaymentToDelete({
            month: month,
            paymentIndex: paymentIndex,
            paymentDetails: payment,
        });
        setShowPaymentDeleteModal(true);
    };

    const confirmRemovePayment = () => {
        if (!paymentToDelete.month || paymentToDelete.paymentIndex === -1) return;
        
        router.post(
            "/refunds/remove-payment",
            {
                project_id: project.project_id,
                month_paid: paymentToDelete.month.month_date,
                payment_index: paymentToDelete.paymentIndex,
            },
            { 
                preserveScroll: true,
                onFinish: () => {
                    setShowPaymentDeleteModal(false);
                    setPaymentToDelete({
                        month: null,
                        paymentIndex: -1,
                        paymentDetails: null,
                    });
                },
            },
        );
    };

    // ── Project edit handlers ─────────────────────────────────────────────────
    const handleProjectEdit = () => {
        if (!isAU) return;
        setEditProjectData({
            refund_amount: project.refund_amount || "",
            refund_initial: project.refund_initial || "",
            refund_end: project.refund_end || "",
            last_refund: project.last_refund || "",
        });
        setIsEditingProject(true);
    };

    const handleProjectSave = () => {
        if (!isAU) return;
        setIsSavingProject(true);

        router.post(
            "/refunds/update-project",
            {
                project_id: project.project_id,
                refund_amount: editProjectData.refund_amount,
                refund_initial: editProjectData.refund_initial,
                refund_end: editProjectData.refund_end,
                last_refund: editProjectData.last_refund,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditingProject(false);
                },
                onFinish: () => setIsSavingProject(false),
            },
        );
    };

    // ── Add Month handlers ────────────────────────────────────────────────────
const handleAddMonth = () => {
    if (!isRPMO) return;
    setNewMonthData({
        month_from: "",
        month_to: "",
        status: "unpaid",
        amount_due: project.refund_amount || "",
        amount: "",
        bank_name: "",
        check_num: "",
        check_date: "",
        receipt_num: "",
        receipt_date: "",
        remarks: "",
    });
    setShowAddMonthModal(true);
};

const handleSaveNewMonth = () => {
    if (!newMonthData.month_from || !newMonthData.month_to) return;
    
    // Check if any months in the range already exist
    const startDate = new Date(newMonthData.month_from + "-01");
    const endDate = new Date(newMonthData.month_to + "-01");
    const existingMonths = [];
    const newMonths = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const monthStr = currentDate.toISOString().substring(0, 7); // YYYY-MM
        const monthDate = monthStr + "-01";
        
        // Check if month already exists in the months array
        const exists = months.some(m => m.month_date === monthDate);
        
        if (exists) {
            const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            existingMonths.push(monthName);
        } else {
            newMonths.push(monthDate);
        }
        
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // If there are existing months, warn the user
    if (existingMonths.length > 0 && newMonths.length === 0) {
        alert(`The following months already exist and cannot be added:\n${existingMonths.join("\n")}`);
        return;
    }
    
    if (existingMonths.length > 0) {
        const confirmed = confirm(
            `The following months already exist and will be skipped:\n${existingMonths.join("\n")}\n\n` +
            `${newMonths.length} new month(s) will be added. Continue?`
        );
        if (!confirmed) return;
    }
    
    if (newMonths.length === 0) return;
    
    setIsAddingMonth(true);

    router.post(
        "/refunds/add-months",
        {
            project_id: project.project_id,
            month_dates: newMonths,
            status: newMonthData.status,
            amount_due: newMonthData.amount_due || null,
            amount: newMonthData.amount || null,
            bank_name: newMonthData.bank_name || null,
            check_num: newMonthData.check_num || null,
            check_date: newMonthData.check_date || null,
            receipt_num: newMonthData.receipt_num || null,
            receipt_date: newMonthData.receipt_date || null,
            remarks: newMonthData.remarks || null,
        },
        {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddMonthModal(false);
                setNewMonthData({
                    month_from: "",
                    month_to: "",
                    status: "unpaid",
                    amount_due: "",
                    amount: "",
                    bank_name: "",
                    check_num: "",
                    check_date: "",
                    receipt_num: "",
                    receipt_date: "",
                    remarks: "",
                });
            },
            onFinish: () => setIsAddingMonth(false),
        },
    );
};

    const handleDeleteMonth = (monthDate) => {
        if (!isRPMO) return;
        
        const targetDate = new Date(monthDate + "T00:00:00");
        const targetMonth = targetDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        
        const initialDate = project.refund_initial ? new Date(project.refund_initial + "T00:00:00") : null;
        const endDate = project.refund_end ? new Date(project.refund_end + "T00:00:00") : null;
        
        const isFirstMonth = initialDate && targetDate.getTime() === initialDate.getTime();
        const isLastMonth = endDate && targetDate.getTime() === endDate.getTime();
        const isMiddleMonth = !isFirstMonth && !isLastMonth;
        
        let monthsToDelete = [];
        let newInitialDate = "";
        let newEndDate = "";
        
        if (isMiddleMonth) {
            const current = new Date(initialDate);
            while (current <= targetDate) {
                monthsToDelete.push(current.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
                current.setMonth(current.getMonth() + 1);
            }
            const newInit = new Date(targetDate);
            newInit.setMonth(newInit.getMonth() + 1);
            newInitialDate = newInit.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } else if (isFirstMonth && isLastMonth) {
            monthsToDelete = [targetMonth];
        } else if (isFirstMonth) {
            monthsToDelete = [targetMonth];
            const newInit = new Date(targetDate);
            newInit.setMonth(newInit.getMonth() + 1);
            newInitialDate = newInit.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } else if (isLastMonth) {
            monthsToDelete = [targetMonth];
            const newEnd = new Date(targetDate);
            newEnd.setMonth(newEnd.getMonth() - 1);
            newEndDate = newEnd.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        }
        
        setDeleteData({
            monthDate,
            monthName: targetMonth,
            isFirstMonth,
            isLastMonth,
            isMiddleMonth,
            monthsToDelete,
            newInitialDate,
            newEndDate,
        });
        setShowDeleteModal(true);
    };

    const confirmDeleteMonth = () => {
        router.post(
            "/refunds/delete-month",
            {
                project_id: project.project_id,
                month_paid: deleteData.monthDate,
            },
            { 
                preserveScroll: true,
                onFinish: () => setShowDeleteModal(false),
            },
        );
    };

    // ── Status config ─────────────────────────────────────────────────────────
    const statusConfig = {
        paid: {
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            hover: "hover:border-emerald-300",
            iconBg: "bg-emerald-500",
            badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
            label: "Paid",
        },
        partial: {
            bg: "bg-amber-50",
            border: "border-amber-200",
            hover: "hover:border-amber-300",
            iconBg: "bg-amber-500",
            badge: "bg-amber-100 text-amber-700 border border-amber-200",
            label: "Partial",
        },
        restructured: {
            bg: "bg-sky-50",
            border: "border-sky-200",
            hover: "hover:border-sky-300",
            iconBg: "bg-sky-500",
            badge: "bg-sky-100 text-sky-700 border border-sky-200",
            label: "Restructured",
        },
        unpaid: {
            bg: "bg-red-50",
            border: "border-red-200",
            hover: "hover:border-red-300",
            iconBg: "bg-red-500",
            badge: "bg-red-100 text-red-700 border border-red-200",
            label: "Unpaid",
        },
    };
    const getStatusConfig = (s) => statusConfig[s] ?? statusConfig.unpaid;
    const getStatusIcon = (s) => {
        const cls = "w-3.5 h-3.5 text-white";
        if (s === "paid") return <CheckCircle2 className={cls} />;
        if (s === "partial") return <AlertCircle className={cls} />;
        if (s === "restructured") return <RefreshCw className={cls} />;
        return <Clock className={cls} />;
    };
    const hasPaymentDetails = (s) =>
        ["paid", "partial", "restructured"].includes(s);

    return (
        <main className="flex-1 p-3 md:p-5 overflow-y-auto w-full">
            <Head title={`Refund Details - ${project.project_title}`} />

            <UnpaidMonthsWarningModal
                isOpen={showWarningModal}
                onClose={() => setShowWarningModal(false)}
                unpaidMonths={warningData.unpaidMonths}
                message={warningData.message}
                action={warningData.action}
                projectTitle={warningData.projectTitle}
                refundInitial={warningData.refundInitial}
                refundEnd={warningData.refundEnd}
            />

            {/* Payment Deletion Warning Modal */}
            {showPaymentDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={() => setShowPaymentDeleteModal(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md">
                        <div className="px-4 py-3 border-b border-gray-200 bg-amber-50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <h3 className="text-sm font-semibold text-amber-900">
                                    Delete Payment Entry
                                </h3>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-700 mb-3">
                                Are you sure you want to delete this payment entry from{" "}
                                <strong>{paymentToDelete.month?.month}</strong>?
                            </p>
                            
                            {paymentToDelete.paymentDetails && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Payment Details
                                    </p>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Amount:</span>
                                            <span className="font-semibold text-gray-900">
                                                ₱{parseFloat(paymentToDelete.paymentDetails.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {paymentToDelete.paymentDetails.check_num && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Check Number:</span>
                                                <span className="font-medium text-gray-700">#{paymentToDelete.paymentDetails.check_num}</span>
                                            </div>
                                        )}
                                        {paymentToDelete.paymentDetails.bank_name && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Bank:</span>
                                                <span className="font-medium text-gray-700">{paymentToDelete.paymentDetails.bank_name}</span>
                                            </div>
                                        )}
                                        {paymentToDelete.paymentDetails.receipt_num && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">OR Number:</span>
                                                <span className="font-medium text-gray-700">#{paymentToDelete.paymentDetails.receipt_num}</span>
                                            </div>
                                        )}
                                        {paymentToDelete.paymentDetails.remarks && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Remarks:</span>
                                                <span className="font-medium text-gray-700">{paymentToDelete.paymentDetails.remarks}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <p className="text-[11px] text-red-500 font-medium">
                                This action cannot be undone. The payment amount will be removed from the total.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowPaymentDeleteModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemovePayment}
                                className="px-4 py-2 text-sm rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm transition-all"
                                type="button"
                            >
                                Delete Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}



            <FloatingBulkPanel
                isOpen={showBulkPanel}
                onClose={() => {
                    setShowBulkPanel(false);
                    setSelectedMonths([]);
                    setMonthPayments({});
                }}
                selectedMonths={selectedMonths}
                months={months}
                monthPayments={monthPayments}
                onUpdatePayment={updateBulkPayment}
                onAddPaymentRow={addBulkPaymentRow}
                onRemovePaymentRow={removeBulkPaymentRow}
                onUpdateAmountDue={updateBulkAmountDue} 
                onSubmit={handleBulkUpdate}
                isUpdating={isUpdating}
            />

            {/* Add Month Modal */}
            {showAddMonthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={() => setShowAddMonthModal(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Add Refund Months
                                </h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Add multiple months at once. Existing months will be skipped.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddMonthModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                type="button"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {/* Month Range */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                        From Month *
                                    </label>
                                    <input
                                        type="month"
                                        value={newMonthData.month_from}
                                        onChange={(e) => setNewMonthData(prev => ({ ...prev, month_from: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                        To Month *
                                    </label>
                                    <input
                                        type="month"
                                        value={newMonthData.month_to}
                                        onChange={(e) => setNewMonthData(prev => ({ ...prev, month_to: e.target.value }))}
                                        min={newMonthData.month_from}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Preview of months to be added */}
                            {newMonthData.month_from && newMonthData.month_to && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
                                        Months Preview
                                    </p>
                                    <div className="text-xs text-blue-800">
                                        {(() => {
                                            const start = new Date(newMonthData.month_from + "-01");
                                            const end = new Date(newMonthData.month_to + "-01");
                                            const monthsToAdd = [];
                                            const existingMonthsList = [];
                                            let current = new Date(start);
                                            
                                            while (current <= end) {
                                                const monthStr = current.toISOString().substring(0, 7);
                                                const monthDate = monthStr + "-01";
                                                const monthName = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                                                const exists = months.some(m => m.month_date === monthDate);
                                                
                                                if (exists) {
                                                    existingMonthsList.push(monthName);
                                                } else {
                                                    monthsToAdd.push({ name: monthName, date: monthDate });
                                                }
                                                current.setMonth(current.getMonth() + 1);
                                            }
                                            
                                            return (
                                                <div className="space-y-1">
                                                    {monthsToAdd.length > 0 ? (
                                                        <div>
                                                            <span className="font-medium text-green-700">
                                                                {monthsToAdd.length} new month(s):
                                                            </span>
                                                            <div className="ml-2 mt-0.5 text-green-600">
                                                                {monthsToAdd.slice(0, 5).map((m, i) => (
                                                                    <div key={i}>• {m.name}</div>
                                                                ))}
                                                                {monthsToAdd.length > 5 && (
                                                                    <div>... and {monthsToAdd.length - 5} more</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-red-600 font-medium">All months already exist</p>
                                                    )}
                                                    {existingMonthsList.length > 0 && (
                                                        <div className="mt-1">
                                                            <span className="font-medium text-amber-700">
                                                                {existingMonthsList.length} existing (will be skipped):
                                                            </span>
                                                            <div className="ml-2 mt-0.5 text-amber-600">
                                                                {existingMonthsList.slice(0, 3).map((name, i) => (
                                                                    <div key={i}>• {name}</div>
                                                                ))}
                                                                {existingMonthsList.length > 3 && (
                                                                    <div>... and {existingMonthsList.length - 3} more</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-3">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Default Settings for All New Months
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Status
                                </label>
                                <select
                                    value={newMonthData.status}
                                    onChange={(e) => setNewMonthData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="restructured">Restructured</option>
                                </select>
                            </div>

                            {/* Refund Amount (per month) */}
                            <div>
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Refund Amount (per month)
                                </label>
                                <p className="text-[10px] text-gray-400 mb-1">
                                    This is the expected refund amount for each month.
                                </p>
                                <div className="flex items-center gap-1">
                                    <PhilippinePeso className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="number"
                                        value={newMonthData.amount_due}
                                        onChange={(e) => setNewMonthData(prev => ({ ...prev, amount_due: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            {/* Payment Details - only for paid/partial */}
                            {(newMonthData.status === 'paid' || newMonthData.status === 'partial') && (
                                <>
                                    <div className="border-t border-gray-100 pt-3">
                                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            Payment Details (applied to all)
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                            Payment Amount
                                        </label>
                                        <p className="text-[10px] text-gray-400 mb-1">
                                            Actual amount paid for each month.
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <PhilippinePeso className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <input
                                                type="number"
                                                value={newMonthData.amount}
                                                onChange={(e) => setNewMonthData(prev => ({ ...prev, amount: e.target.value }))}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                                Bank Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newMonthData.bank_name}
                                                onChange={(e) => setNewMonthData(prev => ({ ...prev, bank_name: e.target.value }))}
                                                placeholder="Bank"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                                Check Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newMonthData.check_num}
                                                onChange={(e) => setNewMonthData(prev => ({ ...prev, check_num: e.target.value }))}
                                                placeholder="Check #"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                                Check Date
                                            </label>
                                            <input
                                                type="date"
                                                value={newMonthData.check_date}
                                                onChange={(e) => setNewMonthData(prev => ({ ...prev, check_date: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                                OR Number
                                            </label>
                                            <input
                                                type="text"
                                                value={newMonthData.receipt_num}
                                                onChange={(e) => setNewMonthData(prev => ({ ...prev, receipt_num: e.target.value }))}
                                                placeholder="OR #"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                                OR Date
                                            </label>
                                            <input
                                                type="date"
                                                value={newMonthData.receipt_date}
                                                onChange={(e) => setNewMonthData(prev => ({ ...prev, receipt_date: e.target.value }))}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                                Remarks
                                            </label>
                                            <RemarksField
                                                value={newMonthData.remarks}
                                                onChange={(value) => setNewMonthData(prev => ({ ...prev, remarks: value }))}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowAddMonthModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNewMonth}
                                disabled={!newMonthData.month_from || !newMonthData.month_to || isAddingMonth}
                                className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                                    !newMonthData.month_from || !newMonthData.month_to || isAddingMonth
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                }`}
                                type="button"
                            >
                                {isAddingMonth ? "Adding..." : "Add Months"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

                {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50"
                    onClick={() => setShowDeleteModal(false)}
                />
                <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md">
                    <div className="px-4 py-3 border-b border-gray-200 bg-red-50 rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="text-sm font-semibold text-red-900">
                                Confirm Deletion
                            </h3>
                        </div>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-700 mb-3">
                            {deleteData.isMiddleMonth ? (
                                <>
                                    Deleting <strong>{deleteData.monthName}</strong> will also delete all months before it.
                                </>
                            ) : deleteData.isFirstMonth && deleteData.isLastMonth ? (
                                <>
                                    This will delete <strong>{deleteData.monthName}</strong>, which is the only month in the range.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to delete <strong>{deleteData.monthName}</strong>?
                                </>
                            )}
                        </p>
                        
                        {deleteData.monthsToDelete.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider mb-1.5">
                                    {deleteData.monthsToDelete.length > 1 ? 'Months to be removed:' : 'Month to be removed:'}
                                </p>
                                <div className="text-xs text-red-800 space-y-0.5 max-h-32 overflow-y-auto">
                                    {deleteData.monthsToDelete.map((month, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                            <span>{month}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {deleteData.newInitialDate && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
                                    New Refund Initial
                                </p>
                                <p className="text-xs text-blue-800">{deleteData.newInitialDate}</p>
                            </div>
                        )}
                        
                        {deleteData.newEndDate && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
                                    New Refund End
                                </p>
                                <p className="text-xs text-blue-800">{deleteData.newEndDate}</p>
                            </div>
                        )}
                        
                        <p className="text-[11px] text-red-500 font-medium">
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteMonth}
                            className="px-4 py-2 text-sm rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm transition-all"
                            type="button"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}

            <div 
                className="max-w-6xl mx-auto space-y-3 md:space-y-4 transition-all duration-300"
                style={{ 
                    marginRight: showBulkPanel ? '400px' : '0',
                    paddingRight: showBulkPanel ? '20px' : '0'
                }}
            >
                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors group"
                    type="button"
                >
                    <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Back to Refund Management
                </button>

                {/* View-Only Banner */}
                {!isRPMO && (
                    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                        <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-800">
                            <span className="font-semibold">View Only — </span>
                            Only RPMU can update refund statuses and details.
                        </p>
                    </div>
                )}

                {/* Project Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-4 md:px-6 md:py-5 text-white">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-base md:text-xl font-bold leading-snug line-clamp-2">
                                    {project.project_title}
                                </h1>
                                <div className="flex items-center gap-1.5 text-blue-100 text-xs mt-1">
                                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">
                                        {project.proponent.company_name}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-blue-200 text-[10px] uppercase tracking-wider mb-0.5">
                                    Project ID
                                </div>
                                <div className="text-sm font-bold">
                                    {project.project_id}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
                        {[
                            {
                                icon: <PhilippinePeso className="w-4 h-4 text-blue-500" />,
                                label: "Project Cost",
                                value: formatCurrency(project.project_cost),
                                valueClass: "text-gray-900",
                                sub: null,
                            },
                            {
                                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                                label: "Total Paid",
                                value: formatCurrency(summary.total_paid),
                                valueClass: "text-emerald-600",
                                sub: summary.partial_count > 0
                                    ? `${summary.paid_count} paid · ${summary.partial_count} partial · ${summary.total_months} total`
                                    : `${summary.paid_count} / ${summary.total_months} months`,
                            },
                            {
                                icon: <XCircle className="w-4 h-4 text-red-500" />,
                                label: "Remaining",
                                value: formatCurrency(summary.total_unpaid),
                                valueClass: "text-red-600",
                                sub: `${summary.unpaid_count} unpaid month${summary.unpaid_count !== 1 ? "s" : ""}`,
                            },
                            {
                                icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
                                label: "Completion",
                                value: `${summary.completion_percentage}%`,
                                valueClass: "text-purple-600",
                                sub: null,
                                progress: summary.completion_percentage,
                            },
                        ].map((stat, i) => (
                            <div key={i} className="px-3 py-3 md:px-4 md:py-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {stat.icon}
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        {stat.label}
                                    </span>
                                </div>
                                <div className={`text-sm md:text-base font-bold truncate ${stat.valueClass}`}>
                                    {stat.value}
                                </div>
                                {stat.sub && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                        {stat.sub}
                                    </div>
                                )}
                                {stat.progress !== undefined && (
                                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                                        <div
                                            className="bg-purple-500 h-1 rounded-full transition-all duration-700"
                                            style={{ width: `${stat.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Refund Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 py-3 md:px-5 border-b border-gray-100">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                Monthly Refund Schedule
                            </h2>
                            {project.refund_initial && project.refund_end && (
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {new Date(project.refund_initial).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                    {" — "}
                                    {new Date(project.refund_end).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {isRPMO && (
                                <>
                                    <button
                                        onClick={handleAddMonth}
                                        className="text-xs px-2.5 py-1 rounded-md border transition-colors text-green-600 border-green-200 hover:bg-green-50 flex items-center gap-1"
                                        type="button"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Month
                                    </button>
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs px-2.5 py-1 rounded-md border transition-colors text-blue-600 border-blue-200 hover:bg-blue-50"
                                        type="button"
                                    >
                                        {selectedMonths.length === months.length && months.length > 0
                                            ? "Deselect All"
                                            : "Select All"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-3 md:p-4 space-y-2">
                        {months.length === 0 ? (
                            <div className="text-center py-10">
                                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    No refund schedule configured.
                                </p>
                            </div>
                        ) : (
                            months.map((month, index) => {
                                const cfg = getStatusConfig(month.status);
                                const isSelected = selectedMonths.includes(month.month_date);
                                const isEditing = editingMonth === month.month_date;
                                const payments = Array.isArray(month.payments) ? month.payments : [];
                                const hasPayments = payments.length > 0;

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-lg border-2 transition-all duration-150 ${
                                            isEditing
                                                ? "ring-2 ring-indigo-400 border-indigo-300 bg-white"
                                                : isSelected
                                                  ? "ring-2 ring-blue-400 border-blue-400 bg-blue-50/40"
                                                  : `${cfg.bg} ${cfg.border} ${cfg.hover}`
                                        }`}
                                    >
                                        {/* Main row */}
                                        <div className="flex items-center gap-2 px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectMonth(month.month_date)}
                                                disabled={!isRPMO || isEditing}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-1 focus:ring-blue-500 flex-shrink-0"
                                            />
                                            <div className={`flex-shrink-0 p-1 rounded-md ${cfg.iconBg}`}>
                                                {getStatusIcon(month.status)}
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                    {month.month}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${cfg.badge}`}>
                                                    {cfg.label.toUpperCase()}
                                                </span>
                                                {!month.is_past && month.status === "unpaid" && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                        UPCOMING
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-[10px] text-gray-400 mb-0.5">
                                                    Refund
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">
                                                    {month.status === "restructured"
                                                        ? formatCurrency(0)
                                                        : formatCurrency(month.refund_amount)}
                                                </div>
                                            </div>
                                            {isRPMO && (
                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        onClick={() => isEditing ? closeEdit() : openEdit(month)}
                                                        className={`p-1.5 rounded-md transition-colors ${
                                                            isEditing 
                                                                ? "bg-gray-100 text-gray-500 hover:bg-gray-200" 
                                                                : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                        }`}
                                                        title={isEditing ? "Cancel" : "Edit"}
                                                        type="button"
                                                    >
                                                        {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMonth(month.month_date)}
                                                        className="p-1.5 rounded-md transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                        title="Delete month"
                                                        type="button"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment chips (view mode) */}
                                        {!isEditing && hasPaymentDetails(month.status) && (
                                            <div className="px-3 pb-2.5">
                                                {month.status === "restructured" && !hasPayments ? (
                                                    <div className="flex items-center gap-1.5 ml-7 text-[11px] text-sky-600 bg-sky-50 border border-sky-100 rounded px-2 py-1 w-fit">
                                                        <RefreshCw className="w-3 h-3" />
                                                        Restructured — no payment required
                                                    </div>
                                                ) : hasPayments ? (
                                                    <div className="ml-7 flex flex-wrap gap-2">
                                                        {payments.map((payment, pIndex) => {
                                                            const remarks = payment.remarks || '';
                                                            const isValid = !remarks || remarks === 'Techno Transfer';
                                                            const isDAIF = remarks === 'DAIF';
                                                            
                                                            return (
                                                                <div
                                                                    key={pIndex}
                                                                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs shadow-sm border ${
                                                                        isDAIF 
                                                                            ? 'bg-red-50 border-red-200' 
                                                                            : !isValid 
                                                                                ? 'bg-yellow-50 border-yellow-200' 
                                                                                : 'bg-white border-gray-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-1">
                                                                        <PhilippinePeso className={`w-3 h-3 ${isValid ? 'text-emerald-500' : 'text-red-400'}`} />
                                                                        <span className={`font-semibold ${isValid ? 'text-emerald-700' : 'text-red-600'}`}>
                                                                            {parseFloat(payment.amount || 0).toLocaleString("en-PH", {
                                                                                minimumFractionDigits: 2,
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                    {payment.check_num && (
                                                                        <>
                                                                            <span className="text-gray-200">|</span>
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <CreditCard className="w-3 h-3 text-gray-400" />
                                                                                <span>Chk # {payment.check_num}</span>
                                                                                {payment.check_date && (
                                                                                    <span className="text-gray-400">({payment.check_date})</span>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {payment.receipt_num && (
                                                                        <>
                                                                            <span className="text-gray-200">|</span>
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <Receipt className="w-3 h-3 text-gray-400" />
                                                                                <span>OR # {payment.receipt_num}</span>
                                                                                {payment.receipt_date && (
                                                                                    <span className="text-gray-400">({payment.receipt_date})</span>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {payment.bank_name && (
                                                                        <>
                                                                            <span className="text-gray-200">|</span>
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                                                <span>{payment.bank_name}</span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {remarks && (
                                                                        <>
                                                                            <span className="text-gray-200">|</span>
                                                                            <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${
                                                                                isDAIF 
                                                                                    ? 'bg-red-100 text-red-700' 
                                                                                    : isValid 
                                                                                        ? 'bg-blue-100 text-blue-700'
                                                                                        : 'bg-yellow-100 text-yellow-700'
                                                                            }`}>
                                                                                {remarks}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    {!isValid && (
                                                                        <span className="text-[10px] text-red-500 ml-1" title="Not counted in total">
                                                                            (excluded)
                                                                        </span>
                                                                    )}
                                                                    {payments.length > 1 && (
                                                                        <span className="ml-0.5 text-[10px] text-gray-400">
                                                                            # {pIndex + 1}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    month.amount_due != null && (
                                                        <div className="ml-7 flex items-center gap-1.5 text-[11px] text-gray-500">
                                                            <span className="text-gray-400">Amount due:</span>
                                                            <span className="font-semibold text-gray-700">
                                                                {month.status === "restructured"
                                                                    ? "₱0.00"
                                                                    : `₱${parseFloat(month.amount_due || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Inline edit panel */}
                                        {isEditing && (
                                            <div className="mx-3 mb-3 border border-indigo-100 rounded-lg bg-indigo-50/30 overflow-hidden">
                                                {/* Status selector */}
                                                <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-100 bg-indigo-50/50">
                                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </span>
                                                    <select
                                                        value={editStatus}
                                                        onChange={(e) => setEditStatus(e.target.value)}
                                                        className="ml-1 px-2 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                    >
                                                        <option value="paid">Paid</option>
                                                        <option value="partial">Partial</option>
                                                        <option value="unpaid">Unpaid</option>
                                                        <option value="restructured">Restructured</option>
                                                    </select>
                                                    
                                                    {/* NEW: Editable Refund Amount */}
                                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider ml-3">
                                                        Refund Amount
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <PhilippinePeso className="w-3 h-3 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            value={editAmountDue}
                                                            onChange={(e) => setEditAmountDue(e.target.value)}
                                                            placeholder="Amount"
                                                            className="w-28 px-2 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>

                                                {editPayments.length > 0 && (
                                                    <div className="px-3 pt-2.5 pb-1 space-y-1.5">
                                                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                            Existing Payments
                                                        </p>
                                                        {editPayments.map((ep, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5"
                                                            >
                                                                <span className="text-[10px] text-gray-400 w-4 flex-shrink-0">
                                                                    #{idx + 1}
                                                                </span>
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <PhilippinePeso className="w-3 h-3 text-gray-400" />
                                                                    <input
                                                                        type="number"
                                                                        value={ep.amount}
                                                                        onChange={(e) => updateExistingPayment(idx, "amount", e.target.value)}
                                                                        placeholder="Amount"
                                                                        className="w-24 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={ep.bank_name || ""}
                                                                    onChange={(e) => updateExistingPayment(idx, "bank_name", e.target.value)}
                                                                    placeholder="Bank"
                                                                    className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={ep.check_num || ""}
                                                                    onChange={(e) => updateExistingPayment(idx, "check_num", e.target.value)}
                                                                    placeholder="Check #"
                                                                    className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                                <input
                                                                    type="date"
                                                                    value={ep.check_date || ""}
                                                                    onChange={(e) => updateExistingPayment(idx, "check_date", e.target.value)}
                                                                    className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={ep.receipt_num || ""}
                                                                    onChange={(e) => updateExistingPayment(idx, "receipt_num", e.target.value)}
                                                                    placeholder="OR #"
                                                                    className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                                <input
                                                                    type="date"
                                                                    value={ep.receipt_date || ""}
                                                                    onChange={(e) => updateExistingPayment(idx, "receipt_date", e.target.value)}
                                                                    className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                />
                                                                <div className="w-0 flex-1">
                                                                    <RemarksField
                                                                        value={ep.remarks}
                                                                        onChange={(value) => updateExistingPayment(idx, "remarks", value)}
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemovePaymentClick(month, idx)}
                                                                    className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Remove payment"
                                                                    type="button"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="px-3 pt-2 pb-2.5">
                                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                        <Plus className="w-3 h-3" /> Add Payment Entry
                                                    </p>
                                                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <PhilippinePeso className="w-3 h-3 text-gray-400" />
                                                            <input
                                                                type="number"
                                                                value={newPayment.amount}
                                                                onChange={(e) => setNewPayment((p) => ({ ...p, amount: e.target.value }))}
                                                                placeholder="Amount"
                                                                className="w-24 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={newPayment.bank_name}
                                                            onChange={(e) => setNewPayment((p) => ({ ...p, bank_name: e.target.value }))}
                                                            placeholder="Bank"
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={newPayment.check_num}
                                                            onChange={(e) => setNewPayment((p) => ({ ...p, check_num: e.target.value.slice(0, 10) }))}
                                                            placeholder="Check #"
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={newPayment.check_date}
                                                            onChange={(e) => setNewPayment((p) => ({ ...p, check_date: e.target.value }))}
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={newPayment.receipt_num}
                                                            onChange={(e) => setNewPayment((p) => ({ ...p, receipt_num: e.target.value.slice(0, 10) }))}
                                                            placeholder="OR #"
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={newPayment.receipt_date}
                                                            onChange={(e) => setNewPayment((p) => ({ ...p, receipt_date: e.target.value }))}
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <div className="w-0 flex-1">
                                                            <RemarksField
                                                                value={newPayment.remarks}
                                                                onChange={(value) => setNewPayment((p) => ({ ...p, remarks: value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-indigo-100 bg-indigo-50/50">
                                                    <button
                                                        onClick={closeEdit}
                                                        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                                                        type="button"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleSave(month)}
                                                        disabled={isSaving}
                                                        className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                                                            isSaving 
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                                        }`}
                                                        type="button"
                                                    >
                                                        <Save className="w-3 h-3" />
                                                        {isSaving ? "Saving…" : "Save"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Project Details Footer */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 md:px-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900">
                            Project Details
                        </h2>
                        {isAU && !isEditingProject && (
                            <button
                                onClick={handleProjectEdit}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                type="button"
                            >
                                <Pencil className="w-3 h-3" />
                                Edit
                            </button>
                        )}
                    </div>
                    <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Monthly Refund Amount
                            </label>
                            {isEditingProject ? (
                                <input
                                    type="number"
                                    value={editProjectData.refund_amount}
                                    onChange={(e) => setEditProjectData(prev => ({ ...prev, refund_amount: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-base font-bold text-gray-900">
                                    {formatCurrency(project.refund_amount)}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Last Month Refund
                            </label>
                            {isEditingProject ? (
                                <input
                                    type="number"
                                    value={editProjectData.last_refund}
                                    onChange={(e) => setEditProjectData(prev => ({ ...prev, last_refund: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-base font-bold text-gray-900">
                                    {formatCurrency(project.last_refund)}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Refund Initial
                            </label>
                            {isEditingProject ? (
                                <input
                                    type="date"
                                    value={editProjectData.refund_initial}
                                    onChange={(e) => setEditProjectData(prev => ({ ...prev, refund_initial: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-sm text-gray-700">
                                    {project.refund_initial || "Not set"}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Refund End
                            </label>
                            {isEditingProject ? (
                                <input
                                    type="date"
                                    value={editProjectData.refund_end}
                                    onChange={(e) => setEditProjectData(prev => ({ ...prev, refund_end: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-sm text-gray-700">
                                    {project.refund_end || "Not set"}
                                </p>
                            )}
                        </div>
                        {project.proponent.email && (
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                    Proponent Email
                                </label>
                                <p className="text-sm text-gray-700 break-all">
                                    {project.proponent.email}
                                </p>
                            </div>
                        )}
                        {isEditingProject && (
                            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => setIsEditingProject(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProjectSave}
                                    disabled={isSavingProject}
                                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                                        isSavingProject 
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    }`}
                                    type="button"
                                >
                                    {isSavingProject ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}