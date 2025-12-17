import { Head, router, Link } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { Calendar, TrendingUp, AlertCircle, CheckCircle, CreditCard, Building, FileText, Activity, Wallet, Eye } from 'lucide-react';

export default function UserLoan({ projects, search, years, selectedYear }) {
    const [searchInput, setSearchInput] = useState(search || "");
    const [yearFilter, setYearFilter] = useState(selectedYear || "");
    const [expandedSections, setExpandedSections] = useState({});
    const isFirstRun = useRef(true);

    // Delay search
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        const delay = setTimeout(() => {
            router.get("/my-refunds", { search: searchInput, year: yearFilter }, { preserveScroll: true });
        }, 400);
        return () => clearTimeout(delay);
    }, [searchInput, yearFilter]);

    const formatPeso = (amount) =>
        `₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    // Toggle section expansion
    const toggleSection = (projectId, section) => {
        const key = `${projectId}-${section}`;
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Calculate summary stats
    const totalProjects = projects.length;
    const totalProjectCost = projects.reduce((sum, p) => sum + (parseFloat(p.project_cost) || 0), 0);
    const totalOutstanding = projects.reduce((sum, p) => sum + (parseFloat(p.outstanding_balance) || 0), 0);
    const projectsWithBalance = projects.filter(p => parseFloat(p.outstanding_balance) > 0).length;

    return (
        <main className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 md:space-y-8 w-full">
            <Head title="My Refunds" />
            <div className="max-w-7xl mx-auto w-full">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    {/* Total Projects */}
                    <div className="bg-white rounded-lg md:rounded-xl shadow-sm p-3 md:p-6 border border-gray-100">
                        <div className="flex flex-col gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg w-fit">
                                <FileText className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Total Projects</p>
                                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{totalProjects}</p>
                            </div>
                        </div>
                    </div>

                    {/* Innovation Fund */}
                    <div className="bg-white rounded-lg md:rounded-xl shadow-sm p-3 md:p-6 border border-gray-100">
                        <div className="flex flex-col gap-2">
                            <div className="p-2 bg-green-100 rounded-lg w-fit">
                                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Innovation Fund</p>
                                <p className="text-sm md:text-xl font-bold text-gray-900 mt-1 line-clamp-1">{formatPeso(totalProjectCost)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Outstanding */}
                    <div className="bg-white rounded-lg md:rounded-xl shadow-sm p-3 md:p-6 border border-gray-100">
                        <div className="flex flex-col gap-2">
                            <div className="p-2 bg-red-100 rounded-lg w-fit">
                                <AlertCircle className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Outstanding</p>
                                <p className="text-sm md:text-xl font-bold text-gray-900 mt-1 line-clamp-1">{formatPeso(totalOutstanding)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Loans */}
                    <div className="bg-white rounded-lg md:rounded-xl shadow-sm p-3 md:p-6 border border-gray-100">
                        <div className="flex flex-col gap-2">
                            <div className="p-2 bg-orange-100 rounded-lg w-fit">
                                <Activity className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm font-medium text-gray-600">Active Refunds</p>
                                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{projectsWithBalance}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects List */}
                <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-3 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/30">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                    <Wallet className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Project Refunds</h2>
                                    <p className="text-xs md:text-sm text-gray-600">View detailed breakdown of your financing</p>
                                </div>
                            </div>

                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg md:rounded-xl pl-10 pr-3 md:pr-8 py-2 md:py-3 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                                >
                                    <option value="">All Years</option>
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {projects.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {projects.map((p, idx) => {
                                const paidMonths = p.months.filter(m => m.status === 'paid');
                                const unpaidMonths = p.months.filter(m => m.status === 'unpaid');
                                const showAllPaid = expandedSections[`${p.project_id}-paid`];
                                const showAllUnpaid = expandedSections[`${p.project_id}-unpaid`];

                                return (
                                    <Link
                                        key={p.project_id}
                                        href={`my-refunds/${p.project_id}`}
                                        className="block p-3 md:p-4 hover:bg-blue-50/50 transition-colors"
                                    >
                                        {/* Project Header */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base md:text-lg font-bold text-gray-900 line-clamp-2">{p.project_title}</h3>
                                                <div className="flex items-center gap-1.5 text-gray-600 mt-1">
                                                    <Building className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="text-xs md:text-sm truncate">{p.company}</span>
                                                </div>
                                            </div>
                                            <Eye className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        </div>

                                        {/* Compact Financial Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                            <div className="bg-green-50 p-2 md:p-2.5 rounded-lg border border-green-200">
                                                <div className="text-xs text-green-700 mb-0.5">Project Cost</div>
                                                <div className="text-xs md:text-sm font-bold text-green-800 truncate">{formatPeso(p.project_cost)}</div>
                                            </div>
                                            
                                            <div className="bg-blue-50 p-2 md:p-2.5 rounded-lg border border-blue-200">
                                                <div className="text-xs text-blue-700 mb-0.5">Total Repayment</div>
                                                <div className="text-xs md:text-sm font-bold text-blue-800 truncate">{formatPeso(p.total_refund)}</div>
                                            </div>
                                            
                                            <div className="bg-red-50 p-2 md:p-2.5 rounded-lg border border-red-200">
                                                <div className="text-xs text-red-700 mb-0.5">Outstanding</div>
                                                <div className="text-xs md:text-sm font-bold text-red-800 truncate">{formatPeso(p.outstanding_balance)}</div>
                                            </div>
                                            
                                            {p.next_payment > 0 && (
                                                <div className="bg-orange-50 p-2 md:p-2.5 rounded-lg border border-orange-200">
                                                    <div className="text-xs text-orange-700 mb-0.5">Next Payment</div>
                                                    <div className="text-xs md:text-sm font-bold text-orange-800 truncate">{formatPeso(p.next_payment)}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Compact Repayment Summary */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {/* Paid Summary */}
                                            {paidMonths.length > 0 && (
                                                <div className="bg-green-50 rounded-lg p-2 md:p-3 border border-green-200">
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                                        <span className="text-xs font-bold text-green-800">
                                                            PAID ({paidMonths.length})
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {paidMonths.slice(0, showAllPaid ? undefined : 3).map((m, i) => (
                                                            <div key={i} className="flex justify-between items-center text-xs bg-white rounded px-2 py-1">
                                                                <span className="text-gray-700 truncate">{m.month}</span>
                                                                <span className="font-semibold text-green-700 flex-shrink-0">{formatPeso(m.refund_amount)}</span>
                                                            </div>
                                                        ))}
                                                        {paidMonths.length > 3 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toggleSection(p.project_id, 'paid');
                                                                }}
                                                                className="text-xs text-green-600 hover:text-green-700 font-medium w-full text-center pt-1"
                                                            >
                                                                {showAllPaid ? 'Show less' : `+${paidMonths.length - 3} more`}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unpaid Summary */}
                                            {unpaidMonths.length > 0 && (
                                                <div className="bg-red-50 rounded-lg p-2 md:p-3 border border-red-200">
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                                        <span className="text-xs font-bold text-red-800">
                                                            UNPAID ({unpaidMonths.length})
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {unpaidMonths.slice(0, showAllUnpaid ? undefined : 3).map((m, i) => (
                                                            <div key={i} className="flex justify-between items-center text-xs bg-white rounded px-2 py-1">
                                                                <span className="text-gray-700 truncate">{m.month}</span>
                                                                <div className="text-right flex-shrink-0">
                                                                    <span className="font-semibold text-red-700">{formatPeso(m.refund_amount)}</span>
                                                                    {m.month === p.months[p.months.length - 1].month && (
                                                                        <div className="text-[10px] text-red-600 italic">Adj.</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {unpaidMonths.length > 3 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toggleSection(p.project_id, 'unpaid');
                                                                }}
                                                                className="text-xs text-red-600 hover:text-red-700 font-medium w-full text-center pt-1"
                                                            >
                                                                {showAllUnpaid ? 'Show less' : `+${unpaidMonths.length - 3} more`}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 md:p-12 text-center">
                            <div className="flex flex-col items-center gap-3 md:gap-4">
                                <div className="p-3 md:p-4 bg-gray-100 rounded-full">
                                    <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No Refund Found</h3>
                                    <p className="text-xs md:text-sm text-gray-500">No project refund match your current search criteria.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}