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
} from "lucide-react";
import UnpaidMonthsWarningModal from "./components/UnpaidMonthsWarningModal";

const EMPTY_PAYMENT = {
    amount: "",
    check_num: "",
    check_date: "",
    receipt_num: "",
    receipt_date: "",
};

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
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}

export default function Details({ project, months, summary }) {
    const { userRole, flash } = usePage().props;

    // ── Bulk select state ─────────────────────────────────────────────────────
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [bulkStatus, setBulkStatus] = useState("");
    // monthPayments: { [monthDate]: [ {amount, check_num, ...}, ... ] }
    // All rows — existing and newly added — live here as editable entries.
    const [monthPayments, setMonthPayments] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);

    // ── Per-month inline edit state ───────────────────────────────────────────
    const [editingMonth, setEditingMonth] = useState(null);
    const [editStatus, setEditStatus] = useState("");
    const [editPayments, setEditPayments] = useState([]);
    const [newPayment, setNewPayment] = useState({ ...EMPTY_PAYMENT });
    const [isSaving, setIsSaving] = useState(false);

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

    const isRPMO = ["rpmo", "au"].includes(userRole);

    useEffect(() => {
        if (flash?.warning) {
            setWarningData({
                unpaidMonths: flash.warning.unpaid_months || [],
                projectTitle: flash.warning.project_title || "",
                refundInitial: flash.warning.refund_initial || "",
                refundEnd: flash.warning.refund_end || "",
                message:
                    flash.warning.message || "Cannot update project status.",
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

    // Seed editable rows from a month's existing payments.
    // Always starts with at least one blank row so there's something to fill.
    const buildMonthPayments = (month) => {
        const existing = Array.isArray(month.payments) ? month.payments : [];
        return existing.length > 0
            ? existing.map((p) => ({ ...EMPTY_PAYMENT, ...p }))
            : [{ ...EMPTY_PAYMENT }];
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
                return prev.filter((m) => m !== monthDate);
            } else {
                const month = months.find((m) => m.month_date === monthDate);
                setMonthPayments((mp) => ({
                    ...mp,
                    [monthDate]: buildMonthPayments(month),
                }));
                return [...prev, monthDate];
            }
        });
    };

    const handleSelectAll = () => {
        if (!isRPMO) return;
        if (selectedMonths.length === months.length) {
            setSelectedMonths([]);
            setMonthPayments({});
        } else {
            const all = months.map((m) => m.month_date);
            setSelectedMonths(all);
            const mp = {};
            months.forEach((m) => {
                mp[m.month_date] = buildMonthPayments(m);
            });
            setMonthPayments(mp);
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
            [monthDate]: [...(mp[monthDate] || []), { ...EMPTY_PAYMENT }],
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

    const handleBulkUpdate = () => {
        if (!isRPMO || !bulkStatus || selectedMonths.length === 0) return;
        setIsUpdating(true);

        // Send only rows that have an amount > 0
        const monthDetails = {};
        Object.entries(monthPayments).forEach(([date, rows]) => {
            monthDetails[date] = rows.filter((r) => parseFloat(r.amount) > 0);
        });

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
                    setBulkStatus("");
                    setMonthPayments({});
                },
                onFinish: () => setIsUpdating(false),
            },
        );
    };

    // ── Per-month inline edit handlers ────────────────────────────────────────
    const openEdit = (month) => {
        setEditingMonth(month.month_date);
        setEditStatus(month.status);
        const existing = Array.isArray(month.payments) ? month.payments : [];
        setEditPayments(existing.map((p) => ({ ...p })));
        setNewPayment({ ...EMPTY_PAYMENT });
    };

    const closeEdit = () => {
        setEditingMonth(null);
        setEditStatus("");
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
        const hasNewAmount = parseFloat(newPayment.amount) > 0;

        router.post(
            "/refunds/save",
            {
                project_id: project.project_id,
                save_date: month.month_date,
                status: editStatus,
                amount_due: month.amount_due,

                // ── new payment row ──────────────────────────────────────
                amount: hasNewAmount ? newPayment.amount : null,
                check_num: hasNewAmount ? newPayment.check_num || null : null,
                check_date: hasNewAmount ? newPayment.check_date || null : null, // ← was sent but now guaranteed
                receipt_num: hasNewAmount
                    ? newPayment.receipt_num || null
                    : null,
                receipt_date: hasNewAmount
                    ? newPayment.receipt_date || null
                    : null, // ← was sent but now guaranteed

                // ── existing payments (edited in-place) ──────────────────
                // This is what was missing — edits to existing rows were
                // never sent to the server before.
                existing_payments: editPayments.map((ep) => ({
                    amount: ep.amount || null,
                    check_num: ep.check_num || null,
                    check_date: ep.check_date || null, // ← the core fix
                    receipt_num: ep.receipt_num || null,
                    receipt_date: ep.receipt_date || null, // ← the core fix
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => closeEdit(),
                onFinish: () => setIsSaving(false),
            },
        );
    };

    const handleRemovePayment = (month, paymentIndex) => {
        if (!isRPMO) return;
        router.post(
            "/refunds/remove-payment",
            {
                project_id: project.project_id,
                month_paid: month.month_date,
                payment_index: paymentIndex,
            },
            { preserveScroll: true },
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

            <div className="max-w-6xl mx-auto space-y-3 md:space-y-4">
                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors group"
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
                                icon: (
                                    <PhilippinePeso className="w-4 h-4 text-blue-500" />
                                ),
                                label: "Project Cost",
                                value: formatCurrency(project.project_cost),
                                valueClass: "text-gray-900",
                                sub: null,
                            },
                            {
                                icon: (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ),
                                label: "Total Paid",
                                value: formatCurrency(summary.total_paid),
                                valueClass: "text-emerald-600",
                                sub:
                                    summary.partial_count > 0
                                        ? `${summary.paid_count} paid · ${summary.partial_count} partial · ${summary.total_months} total`
                                        : `${summary.paid_count} / ${summary.total_months} months`,
                            },
                            {
                                icon: (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                ),
                                label: "Remaining",
                                value: formatCurrency(summary.total_unpaid),
                                valueClass: "text-red-600",
                                sub: `${summary.unpaid_count} unpaid month${summary.unpaid_count !== 1 ? "s" : ""}`,
                            },
                            {
                                icon: (
                                    <TrendingUp className="w-4 h-4 text-purple-500" />
                                ),
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
                                <div
                                    className={`text-sm md:text-base font-bold truncate ${stat.valueClass}`}
                                >
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
                                            style={{
                                                width: `${stat.progress}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bulk Update Panel ── */}
                {isRPMO && selectedMonths.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 md:p-4">
                        {/* Top controls */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                            <p className="text-sm font-semibold text-gray-700 flex-1">
                                {selectedMonths.length} month
                                {selectedMonths.length !== 1 ? "s" : ""}{" "}
                                selected
                            </p>
                            <select
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value)}
                                className="w-full md:w-40 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                            >
                                <option value="">Set Status…</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="restructured">
                                    Restructured
                                </option>
                            </select>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkUpdate}
                                    disabled={!bulkStatus || isUpdating}
                                    className={`flex-1 md:flex-none px-4 py-1.5 text-sm rounded-lg font-medium transition-all ${!bulkStatus || isUpdating ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}
                                >
                                    {isUpdating ? "Updating…" : "Apply"}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedMonths([]);
                                        setBulkStatus("");
                                        setMonthPayments({});
                                    }}
                                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Per-month editable payment rows */}
                        {bulkStatus && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Payment Details (optional)
                                </p>
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {selectedMonths.map((monthDate) => {
                                        const month = months.find(
                                            (m) => m.month_date === monthDate,
                                        );
                                        const rows =
                                            monthPayments[monthDate] || [];

                                        return (
                                            <div
                                                key={monthDate}
                                                className="p-2 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5"
                                            >
                                                {/* Month name + add entry */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {month?.month}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            addBulkPaymentRow(
                                                                monthDate,
                                                            )
                                                        }
                                                        className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" />
                                                        Add entry
                                                    </button>
                                                </div>

                                                {/* All payment rows — editable */}
                                                {rows.map((row, pIdx) => (
                                                    <PaymentRow
                                                        key={pIdx}
                                                        index={pIdx}
                                                        payment={row}
                                                        showIndex={
                                                            rows.length > 1
                                                        }
                                                        onChange={(
                                                            field,
                                                            value,
                                                        ) =>
                                                            updateBulkPayment(
                                                                monthDate,
                                                                pIdx,
                                                                field,
                                                                value,
                                                            )
                                                        }
                                                        onRemove={
                                                            rows.length > 1
                                                                ? () =>
                                                                      removeBulkPaymentRow(
                                                                          monthDate,
                                                                          pIdx,
                                                                      )
                                                                : null
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                    {new Date(
                                        project.refund_initial,
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                    {" — "}
                                    {new Date(
                                        project.refund_end,
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleSelectAll}
                            disabled={!isRPMO}
                            className={`self-start md:self-auto text-xs px-2.5 py-1 rounded-md border transition-colors ${isRPMO ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-gray-300 border-gray-100 cursor-not-allowed"}`}
                        >
                            {selectedMonths.length === months.length
                                ? "Deselect All"
                                : "Select All"}
                        </button>
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
                                const isSelected = selectedMonths.includes(
                                    month.month_date,
                                );
                                const isEditing =
                                    editingMonth === month.month_date;
                                const payments = Array.isArray(month.payments)
                                    ? month.payments
                                    : [];
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
                                        {/* ── Main row ── */}
                                        <div className="flex items-center gap-2 px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    handleSelectMonth(
                                                        month.month_date,
                                                    )
                                                }
                                                disabled={!isRPMO || isEditing}
                                                className={`w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-1 focus:ring-blue-500 flex-shrink-0 ${!isRPMO ? "cursor-not-allowed opacity-40" : ""}`}
                                            />
                                            <div
                                                className={`flex-shrink-0 p-1 rounded-md ${cfg.iconBg}`}
                                            >
                                                {getStatusIcon(month.status)}
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                    {month.month}
                                                </span>
                                                <span
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${cfg.badge}`}
                                                >
                                                    {cfg.label.toUpperCase()}
                                                </span>
                                                {!month.is_past &&
                                                    month.status ===
                                                        "unpaid" && (
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
                                                    {month.status ===
                                                    "restructured"
                                                        ? formatCurrency(0)
                                                        : formatCurrency(
                                                              month.refund_amount,
                                                          )}
                                                </div>
                                            </div>
                                            {isRPMO && (
                                                <button
                                                    onClick={() =>
                                                        isEditing
                                                            ? closeEdit()
                                                            : openEdit(month)
                                                    }
                                                    className={`ml-1 flex-shrink-0 p-1.5 rounded-md transition-colors ${isEditing ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                                                    title={
                                                        isEditing
                                                            ? "Cancel"
                                                            : "Edit"
                                                    }
                                                >
                                                    {isEditing ? (
                                                        <X className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* ── Payment chips (view mode) ── */}
                                        {!isEditing &&
                                            hasPaymentDetails(month.status) && (
                                                <div className="px-3 pb-2.5">
                                                    {month.status ===
                                                        "restructured" &&
                                                    !hasPayments ? (
                                                        <div className="flex items-center gap-1.5 ml-7 text-[11px] text-sky-600 bg-sky-50 border border-sky-100 rounded px-2 py-1 w-fit">
                                                            <RefreshCw className="w-3 h-3" />
                                                            Restructured — no
                                                            payment required
                                                        </div>
                                                    ) : hasPayments ? (
                                                        <div className="ml-7 flex flex-wrap gap-2">
                                                            {payments.map(
                                                                (
                                                                    payment,
                                                                    pIndex,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            pIndex
                                                                        }
                                                                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs shadow-sm"
                                                                    >
                                                                        <div className="flex items-center gap-1">
                                                                            <PhilippinePeso className="w-3 h-3 text-emerald-500" />
                                                                            <span className="font-semibold text-emerald-700">
                                                                                {parseFloat(
                                                                                    payment.amount ||
                                                                                        0,
                                                                                ).toLocaleString(
                                                                                    "en-PH",
                                                                                    {
                                                                                        minimumFractionDigits: 2,
                                                                                    },
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        {payment.check_num && (
                                                                            <>
                                                                                <span className="text-gray-200">
                                                                                    |
                                                                                </span>
                                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                                    <CreditCard className="w-3 h-3 text-gray-400" />
                                                                                    <span>
                                                                                        Chk
                                                                                        #{" "}
                                                                                        {
                                                                                            payment.check_num
                                                                                        }
                                                                                    </span>
                                                                                    {payment.check_date && (
                                                                                        <span className="text-gray-400">
                                                                                            (
                                                                                            {
                                                                                                payment.check_date
                                                                                            }

                                                                                            )
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                        {payment.receipt_num && (
                                                                            <>
                                                                                <span className="text-gray-200">
                                                                                    |
                                                                                </span>
                                                                                <div className="flex items-center gap-1 text-gray-600">
                                                                                    <Receipt className="w-3 h-3 text-gray-400" />
                                                                                    <span>
                                                                                        OR
                                                                                        #{" "}
                                                                                        {
                                                                                            payment.receipt_num
                                                                                        }
                                                                                    </span>
                                                                                    {payment.receipt_date && (
                                                                                        <span className="text-gray-400">
                                                                                            (
                                                                                            {
                                                                                                payment.receipt_date
                                                                                            }

                                                                                            )
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                        {payments.length >
                                                                            1 && (
                                                                            <span className="ml-0.5 text-[10px] text-gray-400">
                                                                                #{" "}
                                                                                {pIndex +
                                                                                    1}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        month.amount_due !=
                                                            null && (
                                                            <div className="ml-7 flex items-center gap-1.5 text-[11px] text-gray-500">
                                                                <span className="text-gray-400">
                                                                    Amount due:
                                                                </span>
                                                                <span className="font-semibold text-gray-700">
                                                                    {month.status ===
                                                                    "restructured"
                                                                        ? "₱0.00"
                                                                        : `₱${parseFloat(month.amount_due || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                        {/* ── Inline edit panel ── */}
                                        {isEditing && (
                                            <div className="mx-3 mb-3 border border-indigo-100 rounded-lg bg-indigo-50/30 overflow-hidden">
                                                {/* Status selector */}
                                                <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-100 bg-indigo-50/50">
                                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </span>
                                                    <select
                                                        value={editStatus}
                                                        onChange={(e) =>
                                                            setEditStatus(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="ml-1 px-2 py-0.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                    >
                                                        <option value="paid">
                                                            Paid
                                                        </option>
                                                        <option value="partial">
                                                            Partial
                                                        </option>
                                                        <option value="unpaid">
                                                            Unpaid
                                                        </option>
                                                        <option value="restructured">
                                                            Restructured
                                                        </option>
                                                    </select>
                                                </div>

                                                {/* Existing payment entries */}
                                                {editPayments.length > 0 && (
                                                    <div className="px-3 pt-2.5 pb-1 space-y-1.5">
                                                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                            Existing Payments
                                                        </p>
                                                        {editPayments.map(
                                                            (ep, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5"
                                                                >
                                                                    <span className="text-[10px] text-gray-400 w-4 flex-shrink-0">
                                                                        #
                                                                        {idx +
                                                                            1}
                                                                    </span>
                                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                                        <PhilippinePeso className="w-3 h-3 text-gray-400" />
                                                                        <input
                                                                            type="number"
                                                                            value={
                                                                                ep.amount
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateExistingPayment(
                                                                                    idx,
                                                                                    "amount",
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            placeholder="Amount"
                                                                            className="w-24 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            ep.check_num ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateExistingPayment(
                                                                                idx,
                                                                                "check_num",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="Check #"
                                                                        className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                    <input
                                                                        type="date"
                                                                        value={
                                                                            ep.check_date ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateExistingPayment(
                                                                                idx,
                                                                                "check_date",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            ep.receipt_num ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateExistingPayment(
                                                                                idx,
                                                                                "receipt_num",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="OR #"
                                                                        className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                    <input
                                                                        type="date"
                                                                        value={
                                                                            ep.receipt_date ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateExistingPayment(
                                                                                idx,
                                                                                "receipt_date",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                                    />
                                                                    <button
                                                                        onClick={() =>
                                                                            handleRemovePayment(
                                                                                month,
                                                                                idx,
                                                                            )
                                                                        }
                                                                        className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                        title="Remove payment"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                {/* New payment entry row */}
                                                <div className="px-3 pt-2 pb-2.5">
                                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                        <Plus className="w-3 h-3" />{" "}
                                                        Add Payment Entry
                                                    </p>
                                                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <PhilippinePeso className="w-3 h-3 text-gray-400" />
                                                            <input
                                                                type="number"
                                                                value={
                                                                    newPayment.amount
                                                                }
                                                                onChange={(e) =>
                                                                    setNewPayment(
                                                                        (
                                                                            p,
                                                                        ) => ({
                                                                            ...p,
                                                                            amount: e
                                                                                .target
                                                                                .value,
                                                                        }),
                                                                    )
                                                                }
                                                                placeholder="Amount"
                                                                className="w-24 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={
                                                                newPayment.check_num
                                                            }
                                                            onChange={(e) =>
                                                                setNewPayment(
                                                                    (p) => ({
                                                                        ...p,
                                                                        check_num:
                                                                            e.target.value.slice(
                                                                                0,
                                                                                10,
                                                                            ),
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="Check #"
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={
                                                                newPayment.check_date
                                                            }
                                                            onChange={(e) =>
                                                                setNewPayment(
                                                                    (p) => ({
                                                                        ...p,
                                                                        check_date:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={
                                                                newPayment.receipt_num
                                                            }
                                                            onChange={(e) =>
                                                                setNewPayment(
                                                                    (p) => ({
                                                                        ...p,
                                                                        receipt_num:
                                                                            e.target.value.slice(
                                                                                0,
                                                                                10,
                                                                            ),
                                                                    }),
                                                                )
                                                            }
                                                            placeholder="OR #"
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={
                                                                newPayment.receipt_date
                                                            }
                                                            onChange={(e) =>
                                                                setNewPayment(
                                                                    (p) => ({
                                                                        ...p,
                                                                        receipt_date:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            className="w-0 flex-1 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Save / Cancel */}
                                                <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-indigo-100 bg-indigo-50/50">
                                                    <button
                                                        onClick={closeEdit}
                                                        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleSave(month)
                                                        }
                                                        disabled={isSaving}
                                                        className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${isSaving ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"}`}
                                                    >
                                                        <Save className="w-3 h-3" />
                                                        {isSaving
                                                            ? "Saving…"
                                                            : "Save"}
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
                    <div className="px-4 py-3 md:px-5 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900">
                            Project Details
                        </h2>
                    </div>
                    <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Monthly Refund Amount
                            </label>
                            <p className="text-base font-bold text-gray-900">
                                {formatCurrency(project.refund_amount)}
                            </p>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Last Month Refund
                            </label>
                            <p className="text-base font-bold text-gray-900">
                                {formatCurrency(project.last_refund)}
                            </p>
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
                    </div>
                </div>
            </div>
        </main>
    );
}
