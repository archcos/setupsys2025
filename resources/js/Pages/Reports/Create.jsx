import { useForm, Link, Head } from "@inertiajs/react";
import { useState } from "react";
import {
    Package,
    Trash2,
    Info,
    BarChart3,
    Users,
    Store,
    FileText,
    AlertCircle,
    ChevronLeft,
    Save,
    Plus,
    FlaskConical,
    PhilippinePeso,
    Loader2,
    Send,
    ArrowRight,
    X,
} from "lucide-react";

export default function Create({
    project,
    objects,
    equipments,
    nonequipments,
    refunds,
    markets,
    auth, // Add auth prop to get user role
}) {
    // ── State ──────────────────────────────────────────────────────────────────
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ── Helpers ───────────────────────────────────────────────────────────────

    // Parse YYYY-MM-01, YYYY-MM-01T00:00:00.000000Z, etc → { year, month }
    const parseYearMonth = (dateStr) => {
        const s = dateStr ? String(dateStr).slice(0, 7) : null;
        if (!s) return null;
        const [y, m] = s.split("-").map(Number);
        return { year: y, month: m };
    };

    const toMonthKey = (year, month) =>
        `${year}-${String(month).padStart(2, "0")}-01`;

    // currentMonth as YYYY-MM-01 string for safe string comparison
    const now = new Date();
    const currentMonth = toMonthKey(now.getFullYear(), now.getMonth() + 1);

    // Pre-normalize all refund month_paid values once so every comparison
    // uses the same YYYY-MM-01 format regardless of DB serialization
    const normalizedRefunds = refunds.map((r) => ({
        ...r,
        _monthKey: r.month_paid ? r.month_paid.slice(0, 7) + "-01" : null,
    }));

    // ── Totals ────────────────────────────────────────────────────────────────

    const approvedItemsTotal = equipments
        .concat(nonequipments)
        .filter((item) => item.report === "approved")
        .reduce((sum, item) => sum + Number(item.item_cost || 0), 0);

    // ── SIMPLIFIED: Refund calculations ──────────────────────────────────────

    // Total Amount Release = Project Cost
    const totalAmountRelease = Number(project.project_cost || 0);

    // Total Amount Refunded = sum of all payment amounts from all refund records
    const totalAmountRefunded = normalizedRefunds.reduce((sum, r) => {
        return (
            sum +
            (r.payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0)
        );
    }, 0);

    // Total Unsettled = Total Amount Release - Total Amount Refunded
    const totalUnsettled = totalAmountRelease - totalAmountRefunded;

    // ── Unsettled months loop (pure integer arithmetic — no Date overflow) ────

    const start = parseYearMonth(project.refund_initial);
    const end = parseYearMonth(project.refund_end);

    const unpaidMonths = [];
    let refundDelayedSince = null;

    if (start && end) {
        let year = start.year;
        let month = start.month;

        while (toMonthKey(year, month) <= toMonthKey(end.year, end.month)) {
            const monthKey = toMonthKey(year, month);

            // paid + restructured = settled; unpaid + partial = unsettled
            const isSettled = normalizedRefunds.some(
                (r) =>
                    r._monthKey === monthKey &&
                    (r.status === "paid" || r.status === "restructured"),
            );

            if (!isSettled) {
                unpaidMonths.push(monthKey);
                // "Since" only tracks past-or-current overdue months
                if (!refundDelayedSince && monthKey <= currentMonth) {
                    refundDelayedSince = monthKey;
                }
            }

            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
        }
    }

    // ── Unsettled amount (for current month display) ──────────────────────────
    const currentMonthUnsettled = normalizedRefunds
        .filter(
            (r) =>
                (r.status === "unpaid" || r.status === "partial") &&
                r._monthKey !== null &&
                r._monthKey <= currentMonth,
        )
        .reduce((sum, r) => {
            const paid = (r.payments ?? []).reduce(
                (s, p) => s + Number(p.amount || 0),
                0,
            );
            return sum + Math.max(0, Number(r.amount_due || 0) - paid);
        }, 0);

    const { data, setData, post, processing, errors } = useForm({
        project_id: project.project_id,
        actual_accom: objects.map(() => ""),
        actual_remarks: objects.map(() => ""),
        util_remarks: "",
        new_male: 0,
        new_female: 0,
        new_ifmale: 0,
        new_iffemale: 0,
        new_ibmale: 0,
        new_ibfemale: 0,
        problems: "",
        actions: "",
        promotional: "",
        products: [
            { product_name: "", volume: "", quarter: 1, gross_sales: "" },
        ],
        markets_new: [],
        equipments_actual: equipments.map((item) => ({
            item_name: item.item_name,
            specifications: item.specifications,
            quantity: item.quantity,
            item_cost: item.item_cost,
            acknowledge: "Yes",
            remarks: "",
        })),
        nonequipments_actual: nonequipments.map((item) => ({
            item_name: item.item_name,
            specifications: item.specifications,
            quantity: item.quantity,
            item_cost: item.item_cost,
            acknowledge: "Yes",
            remarks: "",
        })),
    });

    const isStaff = auth?.user?.role === 'staff';

    const handleSubmitClick = (e) => {
        e.preventDefault();
        
        if (isStaff) {
            // Show confirmation modal for staff
            setShowConfirmModal(true);
        } else {
            // Direct submit for non-staff
            submitForm();
        }
    };

    const submitForm = () => {
        setIsSaving(true);
        setShowConfirmModal(false);
        
        post(route("reports.store"), {
            onFinish: () => {
                setIsSaving(false);
            },
            onError: () => {
                setIsSaving(false);
            },
        });
    };

    const handleEquipChange = (index, field, value, type) => {
        const updated = [...data[type]];
        if (!updated[index]) {
            updated[index] = {};
        }
        updated[index] = { ...updated[index], [field]: value };
        setData(type, updated);
    };

    const addProduct = () => {
        setData("products", [
            ...data.products,
            { product_name: "", volume: 0, quarter: 1, gross_sales: 0 },
        ]);
    };

    const removeProduct = (index) => {
        const updated = [...data.products];
        updated.splice(index, 1);
        setData("products", updated);
    };

    const updateProduct = (index, field, value) => {
        const updated = [...data.products];
        updated[index] = { ...updated[index], [field]: value };
        setData("products", updated);
    };

    const addNewMarket = () => {
        setData("markets_new", [
            ...data.markets_new,
            { place_name: "", effective_date: "" },
        ]);
    };

    const removeNewMarket = (index) => {
        const updated = [...data.markets_new];
        updated.splice(index, 1);
        setData("markets_new", updated);
    };

    const updateNewMarket = (index, field, value) => {
        const updated = [...data.markets_new];
        updated[index] = { ...updated[index], [field]: value };
        setData("markets_new", updated);
    };

    // Calculate employment totals
    const newEmploymentTotal =
        Number(data.new_male || 0) + Number(data.new_female || 0);
    const newIndirectMaleTotal =
        Number(data.new_ifmale || 0) + Number(data.new_iffemale || 0);
    const newIndirectFemaleTotal =
        Number(data.new_ibmale || 0) + Number(data.new_ibfemale || 0);
    const overallTotal =
        newEmploymentTotal + newIndirectMaleTotal + newIndirectFemaleTotal;

    return (
        <>
            <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
                <Head title="Create Report" />
                <div className="max-w-6xl mx-auto">
                    {/* Back & Title */}
                    <div className="mb-6 md:mb-8">
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
                        >
                            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to Reports
                        </button>
                        <div className="flex items-start gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
                                <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl md:text-xl font-bold line-clamp-2">
                                    {project.project_title}
                                </h1>
                                <p className="text-xs md:text-base mt-1">
                                    Complete the project report details
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmitClick}
                        className="space-y-4 md:space-y-8"
                    >
                        {/* 1. Project Accomplishment */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                    <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    Expected vs Actual Accomplishment
                                </h2>
                            </div>

                            <div className="space-y-3 md:space-y-4">
                                {objects.map((obj, index) => (
                                    <div
                                        key={obj.objective_id ?? index}
                                        className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg md:rounded-xl border border-gray-200"
                                    >
                                        <div className="text-gray-700 font-medium">
                                            <label className="text-xs md:text-sm text-gray-500 block mb-1">
                                                Expected Output
                                            </label>
                                            <p className="text-xs md:text-sm">
                                                {obj.details}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs md:text-sm text-gray-500 block mb-1">
                                                Actual Accomplishment
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                                                placeholder="Enter actual accomplishment"
                                                value={
                                                    data.actual_accom[index] || ""
                                                }
                                                onChange={(e) => {
                                                    const updated = [
                                                        ...data.actual_accom,
                                                    ];
                                                    updated[index] = e.target.value;
                                                    setData(
                                                        "actual_accom",
                                                        updated,
                                                    );
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs md:text-sm text-gray-500 block mb-1">
                                                Remarks
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                                                placeholder="Enter remarks"
                                                value={
                                                    data.actual_remarks[index] || ""
                                                }
                                                onChange={(e) => {
                                                    const updated = [
                                                        ...data.actual_remarks,
                                                    ];
                                                    updated[index] = e.target.value;
                                                    setData(
                                                        "actual_remarks",
                                                        updated,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Equipment */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-green-200 rounded-lg flex-shrink-0">
                                    <Package className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    List of Equipment
                                </h2>
                            </div>

                            <div className="space-y-3 md:space-y-4">
                                {equipments.filter(
                                    (item) => item.report === "approved",
                                ).length === 0 ? (
                                    <p className="text-gray-500 italic text-sm">
                                        No existing equipment found
                                    </p>
                                ) : (
                                    equipments
                                        .filter(
                                            (item) => item.report === "approved",
                                        )
                                        .map((item, index) => (
                                            <div
                                                key={item.item_id}
                                                className="p-3 md:p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg md:rounded-xl border border-gray-200"
                                            >
                                                <h3 className="font-semibold text-gray-700 mb-2 text-sm md:text-base">
                                                    Approved Equipment:
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm font-medium text-gray-700 mb-3 md:mb-4">
                                                    <span>
                                                        <span className="block text-xs text-gray-500">
                                                            Item Name
                                                        </span>
                                                        {item.item_name} <br />{" "}
                                                        <span className="text-xs">
                                                            Specs:{" "}
                                                            {item.specifications}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        <span className="block text-xs text-gray-500">
                                                            Quantity
                                                        </span>
                                                        {item.quantity}
                                                    </span>
                                                    <span>
                                                        <span className="block text-xs text-gray-500">
                                                            Cost
                                                        </span>
                                                        ₱
                                                        {Number(
                                                            item.item_cost || 0,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="my-3 md:my-6 h-[1px] bg-gray-300 rounded-full"></div>

                                                <h4 className="font-medium text-gray-600 mb-2 md:mb-3 text-sm">
                                                    Actual Equipment:
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Item Name
                                                        </label>
                                                        <input
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                            placeholder="Item name"
                                                            value={
                                                                data
                                                                    .equipments_actual[
                                                                    index
                                                                ]?.item_name ||
                                                                item.item_name
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "item_name",
                                                                    e.target.value,
                                                                    "equipments_actual",
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Quantity
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                            placeholder="Quantity"
                                                            value={
                                                                data
                                                                    .equipments_actual[
                                                                    index
                                                                ]?.quantity ||
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "quantity",
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                    "equipments_actual",
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Item Cost
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                            placeholder="Cost"
                                                            value={
                                                                data
                                                                    .equipments_actual[
                                                                    index
                                                                ]?.item_cost ||
                                                                item.item_cost
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "item_cost",
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                    "equipments_actual",
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Acknowledge
                                                        </label>
                                                        <select
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                            value={
                                                                data
                                                                    .equipments_actual[
                                                                    index
                                                                ]?.acknowledge ||
                                                                "Yes"
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "acknowledge",
                                                                    e.target.value,
                                                                    "equipments_actual",
                                                                )
                                                            }
                                                        >
                                                            <option value="Yes">
                                                                Yes
                                                            </option>
                                                            <option value="No">
                                                                No
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="mt-2 md:mt-3">
                                                    <label className="text-xs text-gray-500 block mb-1">
                                                        Specifications
                                                    </label>
                                                    <textarea
                                                        rows="2"
                                                        className="w-full px-2 md:px-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                        placeholder="Specifications"
                                                        value={
                                                            data.equipments_actual[
                                                                index
                                                            ]?.specifications || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleEquipChange(
                                                                index,
                                                                "specifications",
                                                                e.target.value,
                                                                "equipments_actual",
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-2 md:mt-3">
                                                    <label className="text-xs text-gray-500 block mb-1">
                                                        Remarks
                                                    </label>
                                                    <textarea
                                                        rows="2"
                                                        className="w-full px-2 md:px-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                        placeholder="Additional remarks"
                                                        value={
                                                            data.equipments_actual[
                                                                index
                                                            ]?.remarks || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleEquipChange(
                                                                index,
                                                                "remarks",
                                                                e.target.value,
                                                                "equipments_actual",
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* 3. Non-Equipment */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                    <FlaskConical className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    List of Non-Equipment
                                </h2>
                            </div>

                            <div className="space-y-3 md:space-y-4">
                                {nonequipments.filter(
                                    (item) => item.report === "approved",
                                ).length === 0 ? (
                                    <p className="text-gray-500 italic text-sm">
                                        No existing non-equipment found
                                    </p>
                                ) : (
                                    nonequipments
                                        .filter(
                                            (item) => item.report === "approved",
                                        )
                                        .map((item, index) => (
                                            <div
                                                key={item.item_id}
                                                className="p-3 md:p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg md:rounded-xl border border-gray-200"
                                            >
                                                <h3 className="font-semibold text-gray-700 mb-2 text-sm md:text-base">
                                                    Approved Non-Equipment:
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm font-medium text-gray-700 mb-3 md:mb-4">
                                                    <span>
                                                        <span className="block text-xs text-gray-500">
                                                            Item Name
                                                        </span>
                                                        {item.item_name} <br />{" "}
                                                        <span className="text-xs">
                                                            Specs:{" "}
                                                            {item.specifications}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        <span className="block text-xs text-gray-500">
                                                            Quantity
                                                        </span>
                                                        {item.quantity}
                                                    </span>
                                                    <span>
                                                        <span className="block text-xs text-gray-500">
                                                            Cost
                                                        </span>
                                                        ₱
                                                        {Number(
                                                            item.item_cost || 0,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="my-3 md:my-6 h-[1px] bg-gray-300 rounded-full"></div>

                                                <h4 className="font-medium text-gray-600 mb-2 md:mb-3 text-sm">
                                                    Actual Non-Equipment:
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Item Name
                                                        </label>
                                                        <input
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                                                            placeholder="Item name"
                                                            value={
                                                                data
                                                                    .nonequipments_actual[
                                                                    index
                                                                ]?.item_name ||
                                                                item.item_name
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "item_name",
                                                                    e.target.value,
                                                                    "nonequipments_actual",
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Quantity
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Quantity"
                                                            value={
                                                                data
                                                                    .nonequipments_actual[
                                                                    index
                                                                ]?.quantity ||
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "quantity",
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                    "nonequipments_actual",
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Item Cost
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Cost"
                                                            value={
                                                                data
                                                                    .nonequipments_actual[
                                                                    index
                                                                ]?.item_cost ||
                                                                item.item_cost
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "item_cost",
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                    "nonequipments_actual",
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Acknowledge
                                                        </label>
                                                        <select
                                                            className="w-full px-2 md:px-4 py-2 md:py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            value={
                                                                data
                                                                    .nonequipments_actual[
                                                                    index
                                                                ]?.acknowledge ||
                                                                "Yes"
                                                            }
                                                            onChange={(e) =>
                                                                handleEquipChange(
                                                                    index,
                                                                    "acknowledge",
                                                                    e.target.value,
                                                                    "nonequipments_actual",
                                                                )
                                                            }
                                                        >
                                                            <option value="Yes">
                                                                Yes
                                                            </option>
                                                            <option value="No">
                                                                No
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="mt-2 md:mt-3">
                                                    <label className="text-xs text-gray-500 block mb-1">
                                                        Specifications
                                                    </label>
                                                    <textarea
                                                        rows="2"
                                                        className="w-full px-2 md:px-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Specifications"
                                                        value={
                                                            data
                                                                .nonequipments_actual[
                                                                index
                                                            ]?.specifications || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleEquipChange(
                                                                index,
                                                                "specifications",
                                                                e.target.value,
                                                                "nonequipments_actual",
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-2 md:mt-3">
                                                    <label className="text-xs text-gray-500 block mb-1">
                                                        Remarks
                                                    </label>
                                                    <textarea
                                                        rows="2"
                                                        className="w-full px-2 md:px-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Additional remarks"
                                                        value={
                                                            data
                                                                .nonequipments_actual[
                                                                index
                                                            ]?.remarks || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleEquipChange(
                                                                index,
                                                                "remarks",
                                                                e.target.value,
                                                                "nonequipments_actual",
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* 4. Fund Utilization */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    Status of Fund Utilization
                                </h2>
                            </div>

                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 md:p-6 rounded-lg md:rounded-xl mb-4">
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Project Cost
                                        </p>
                                        <p className="text-base md:text-2xl font-bold text-gray-900">
                                            ₱
                                            {Number(
                                                project.project_cost || 0,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Approved Items Total
                                        </p>
                                        <p className="text-base md:text-2xl font-bold text-purple-600">
                                            ₱{approvedItemsTotal.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                                    Utilization Remarks
                                </label>
                                <textarea
                                    className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
                                    rows="3"
                                    placeholder="Enter fund utilization remarks"
                                    value={data.util_remarks || ""}
                                    onChange={(e) =>
                                        setData("util_remarks", e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* 5. Refund Status - SIMPLIFIED */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                                    <PhilippinePeso className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    Status of Refund
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                {/* Total Amount Release */}
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                                    <p className="text-xs md:text-sm text-gray-600">
                                        Total Amount Release
                                    </p>
                                    <p className="text-base md:text-xl font-bold text-blue-600">
                                        ₱{totalAmountRelease.toLocaleString()}
                                    </p>
                                </div>

                                {/* Total Amount Refunded */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                                    <p className="text-xs md:text-sm text-gray-600">
                                        Total Amount Refunded
                                    </p>
                                    <p className="text-base md:text-xl font-bold text-green-600">
                                        ₱{totalAmountRefunded.toLocaleString()}
                                    </p>
                                </div>

                                {/* Total Unsettled */}
                                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                                    <p className="text-xs md:text-sm text-gray-600">
                                        Total Unsettled
                                    </p>
                                    <p className="text-base md:text-xl font-bold text-red-600">
                                        ₱{totalUnsettled.toLocaleString()}
                                    </p>
                                </div>

                                {/* Refund Schedule & Status */}
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                                    <p className="text-xs md:text-sm text-gray-600">
                                        Refund Schedule
                                    </p>
                                    <p className="text-xs md:text-sm font-medium text-yellow-600">
                                        {new Date(
                                            project.refund_initial,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            year: "numeric",
                                        })}{" "}
                                        -{" "}
                                        {new Date(
                                            project.refund_end,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                    {refundDelayedSince && (
                                        <div className="mt-2 pt-2 border-t border-yellow-200">
                                            <p className="text-xs font-semibold text-red-500">
                                                {unpaidMonths.length} month(s)
                                                unsettled
                                            </p>
                                            <p className="text-xs text-red-400 mt-1">
                                                Since:{" "}
                                                {new Date(
                                                    refundDelayedSince,
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional detail: Current month unsettled amount */}
                            {currentMonthUnsettled > 0 && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs md:text-sm text-red-700">
                                        <span className="font-semibold">
                                            Current Month Unsettled:
                                        </span>{" "}
                                        ₱{currentMonthUnsettled.toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 6. Volume of Products */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center justify-between gap-2 md:gap-3 mb-4 md:mb-6 flex-wrap">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                                        <Package className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                                    </div>
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                        Volume of Products
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addProduct}
                                    className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs md:text-sm"
                                >
                                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="hidden md:inline">
                                        Add Product
                                    </span>
                                    <span className="md:hidden">Add</span>
                                </button>
                            </div>

                            <div className="space-y-2 md:space-y-4">
                                {data.products.map((product, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 p-2 md:p-4 bg-orange-50 rounded-lg md:rounded-xl"
                                    >
                                        <div className="col-span-2 md:col-span-1 flex flex-col">
                                            <label className="text-xs font-medium text-gray-600 mb-1">
                                                Product Name
                                            </label>
                                            <input
                                                className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                                                value={product.product_name || ""}
                                                onChange={(e) =>
                                                    updateProduct(
                                                        index,
                                                        "product_name",
                                                        e.target.value,
                                                    )
                                                }
                                                required={index === 0}
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-gray-600 mb-1">
                                                Volume
                                            </label>
                                            <input
                                                type="number"
                                                className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                                value={product.volume || ""}
                                                onChange={(e) =>
                                                    updateProduct(
                                                        index,
                                                        "volume",
                                                        Number(e.target.value),
                                                    )
                                                }
                                                required={index === 0}
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-gray-600 mb-1">
                                                Quarter
                                            </label>
                                            <select
                                                className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                                value={product.quarter || 1}
                                                onChange={(e) =>
                                                    updateProduct(
                                                        index,
                                                        "quarter",
                                                        Number(e.target.value),
                                                    )
                                                }
                                                required={index === 0}
                                            >
                                                <option value={1}>Q1</option>
                                                <option value={2}>Q2</option>
                                                <option value={3}>Q3</option>
                                                <option value={4}>Q4</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-gray-600 mb-1">
                                                Gross Sales (₱)
                                            </label>
                                            <input
                                                type="number"
                                                className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                                value={product.gross_sales || ""}
                                                onChange={(e) =>
                                                    updateProduct(
                                                        index,
                                                        "gross_sales",
                                                        Number(e.target.value),
                                                    )
                                                }
                                                required={index === 0}
                                            />
                                        </div>

                                        <div className="flex items-end justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(index)}
                                                className="flex items-center justify-center gap-1 text-red-600 hover:text-red-800 text-xs md:text-sm p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition"
                                                disabled={index === 0}
                                            >
                                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                                <span className="hidden md:inline">
                                                    Delete
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 7. Employment */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg flex-shrink-0">
                                    <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    New Employment
                                </h2>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                {/* Direct Employment */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2 md:mb-3 text-sm md:text-base">
                                        New Direct Employment:
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                                Male
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="New Male"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
                                                value={data.new_male}
                                                onChange={(e) =>
                                                    setData(
                                                        "new_male",
                                                        e.target.value === ""
                                                            ? 0
                                                            : Number(
                                                                  e.target.value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                                Female
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="New Female"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
                                                value={data.new_female}
                                                onChange={(e) =>
                                                    setData(
                                                        "new_female",
                                                        e.target.value === ""
                                                            ? 0
                                                            : Number(
                                                                  e.target.value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="px-2 md:px-4 py-2 md:py-3 bg-green-100 rounded-lg md:rounded-xl text-center font-semibold text-green-700 text-sm">
                                            Total: {newEmploymentTotal}
                                        </div>
                                    </div>
                                </div>

                                {/* Indirect Employment - Forward */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2 md:mb-3 text-sm md:text-base">
                                        New Indirect Employment (Forward):
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                                Male
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="New IF Male"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
                                                value={data.new_ifmale}
                                                onChange={(e) =>
                                                    setData(
                                                        "new_ifmale",
                                                        e.target.value === ""
                                                            ? 0
                                                            : Number(
                                                                  e.target.value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                                Female
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="New IF Female"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
                                                value={data.new_iffemale}
                                                onChange={(e) =>
                                                    setData(
                                                        "new_iffemale",
                                                        e.target.value === ""
                                                            ? 0
                                                            : Number(
                                                                  e.target.value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="px-2 md:px-4 py-2 md:py-3 bg-blue-100 rounded-lg md:rounded-xl text-center font-semibold text-blue-700 text-sm">
                                            Total: {newIndirectMaleTotal}
                                        </div>
                                    </div>
                                </div>

                                {/* Indirect Employment - Backward */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2 md:mb-3 text-sm md:text-base">
                                        New Indirect Employment (Backward):
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                                        <div className="flex flex-col">
                                            <label className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                                Male
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="New IB Male"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
                                                value={data.new_ibmale}
                                                onChange={(e) =>
                                                    setData(
                                                        "new_ibmale",
                                                        e.target.value === ""
                                                            ? 0
                                                            : Number(
                                                                  e.target.value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                                                Female
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="New IB Female"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
                                                value={data.new_ibfemale}
                                                onChange={(e) =>
                                                    setData(
                                                        "new_ibfemale",
                                                        e.target.value === ""
                                                            ? 0
                                                            : Number(
                                                                  e.target.value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="px-2 md:px-4 py-2 md:py-3 bg-indigo-100 rounded-lg md:rounded-xl text-center font-semibold text-indigo-700 text-sm">
                                            Total: {newIndirectFemaleTotal}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 8. Markets */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                                    <Store className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    List of Market Penetrated
                                </h2>
                            </div>

                            {/* Existing Markets */}
                            <div className="mb-4 md:mb-6">
                                <h3 className="font-semibold text-gray-700 mb-2 md:mb-3 text-sm md:text-base">
                                    Existing:
                                </h3>
                                <div className="bg-indigo-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                                    {markets.filter((m) => m.type === "existing")
                                        .length > 0 ? (
                                        <div className="space-y-1.5 md:space-y-2">
                                            {markets
                                                .filter(
                                                    (m) => m.type === "existing",
                                                )
                                                .map((market) => (
                                                    <div
                                                        key={market.market_id}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                                                        <span className="text-xs md:text-sm text-gray-700">
                                                            {market.place_name}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic text-xs md:text-sm">
                                            No existing markets found
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* New Markets */}
                            <div>
                                <div className="flex items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
                                    <h3 className="font-semibold text-gray-700 text-sm md:text-base">
                                        New Market:
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addNewMarket}
                                        className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-xs md:text-sm"
                                    >
                                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                        <span className="hidden md:inline">
                                            Add New Market
                                        </span>
                                        <span className="md:hidden">Add</span>
                                    </button>
                                </div>

                                <div className="space-y-2 md:space-y-3">
                                    {data.markets_new.map((market, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 p-2 md:p-4 bg-indigo-50 rounded-lg md:rounded-xl"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Market Place Name"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                                                value={market.place_name || ""}
                                                onChange={(e) =>
                                                    updateNewMarket(
                                                        index,
                                                        "place_name",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <input
                                                type="date"
                                                placeholder="Effective Date"
                                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                                                value={market.effective_date || ""}
                                                onChange={(e) =>
                                                    updateNewMarket(
                                                        index,
                                                        "effective_date",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewMarket(index)
                                                }
                                                className="flex items-center justify-center gap-1 text-red-600 hover:text-red-800 text-xs md:text-sm p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                                <span className="hidden md:inline">
                                                    Remove
                                                </span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 9. Problems, Actions & Promotional */}
                        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-red-100 rounded-lg flex-shrink-0">
                                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                                </div>
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                    Problems, Actions & Promotions
                                </h2>
                            </div>

                            <div className="space-y-3 md:space-y-6">
                                <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                        Problems Encountered
                                    </label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
                                        placeholder="Problems met & actions taken during project implementation"
                                        value={data.problems || ""}
                                        onChange={(e) =>
                                            setData("problems", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                        Actions Taken
                                    </label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
                                        placeholder="Action/plan for the improvement of project's operation"
                                        value={data.actions || ""}
                                        onChange={(e) =>
                                            setData("actions", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                        Promotional/Linkages Plan
                                    </label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
                                        placeholder="Describe promotional or linkages plan"
                                        value={data.promotional || ""}
                                        onChange={(e) =>
                                            setData("promotional", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-4 pb-4 md:pb-8">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                disabled={processing || isSaving}
                                className="order-2 md:order-1 px-4 md:px-6 py-2 md:py-3 bg-gray-500 text-white rounded-lg md:rounded-xl shadow hover:bg-gray-600 transition-colors duration-200 text-sm md:text-base text-center disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || isSaving}
                                className="order-1 md:order-2 inline-flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing || isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving Report...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Report
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Saving Overlay - Prevents navigation during save */}
            {(processing || isSaving) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Send className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Saving Your Report
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please wait while we save your report. Do not close or navigate away from this page.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                Generating your report...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Send className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                                    Important Reminder
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Before submitting, please read the following:
                                </p>
                            </div>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-4 mb-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800 mb-1">
                                            Action Required After Submission
                                        </p>
                                        <p className="text-sm text-amber-700">
                                            As a <span className="font-semibold">PSTO Staff</span> user, after saving this report, you must go to the{" "}
                                            <span className="font-semibold">Review Reports</span> page and click{" "}
                                            <span className="font-semibold">"Recommend"</span> to forward this report for RPMO review.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm font-semibold text-blue-800 mb-2">
                                    Steps to follow after saving:
                                </p>
                                <ol className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-blue-700">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                        Save this report
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-blue-700">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                        Navigate to <span className="font-semibold">Review Reports</span> page
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-blue-700">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                        Find this report and click <span className="font-semibold">"Recommend"</span>
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={submitForm}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                I Understand, Save Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}