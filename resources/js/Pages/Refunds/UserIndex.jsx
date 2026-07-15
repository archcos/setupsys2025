import { Head, router } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { Calendar, TrendingUp, AlertCircle, CheckCircle, CreditCard, Building, FileText, Wallet, ChevronDown, ChevronUp, Search, X, Receipt, Banknote, Info } from 'lucide-react';
import { cleanParams } from '@/utils/cleanParams';

export default function UserIndex({ projects, search, years, selectedYear }) {
    const [searchInput, setSearchInput] = useState(search || "");
    const [yearFilter, setYearFilter] = useState(selectedYear || "");
    const [expandedProjects, setExpandedProjects] = useState({});
    const [selectedMonth, setSelectedMonth] = useState(null);
    const detailsRefs = useRef({});
    const headerRefs = useRef({});
    const modalRef = useRef(null);
    const isFirstRun = useRef(true);

    // Delay search with clean params
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        const delay = setTimeout(() => {
            const params = cleanParams(
                { search: searchInput, year: yearFilter },
                { search: '', year: '' }
            );
            router.get("/my-refunds", params, { preserveState: true, preserveScroll: true });
        }, 400);
        return () => clearTimeout(delay);
    }, [searchInput, yearFilter]);

    // Close expanded project when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Don't close anything if clicking inside the modal
            if (modalRef.current && modalRef.current.contains(event.target)) {
                return;
            }

            Object.entries(detailsRefs.current).forEach(([projectId, ref]) => {
                if (ref && expandedProjects[projectId]) {
                    const headerBtn = headerRefs.current[projectId];
                    const isInsideCard = ref.contains(event.target);
                    const isHeaderBtn = headerBtn && headerBtn.contains(event.target);
                    
                    if (!isInsideCard && !isHeaderBtn) {
                        setExpandedProjects(prev => ({
                            ...prev,
                            [projectId]: false
                        }));
                    }
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expandedProjects]);

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setSelectedMonth(null);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const formatPeso = (amount) =>
        `₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const closeProject = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: false
        }));
    };

    const openMonthDetails = (month) => {
        setSelectedMonth(month);
    };

    const closeModal = () => {
        setSelectedMonth(null);
    };

    // Clear search
    const clearSearch = () => {
        setSearchInput('');
    };

    // Calculate summary stats
    const totalProjects = projects?.length || 0;
    const totalProjectCost = projects?.reduce((sum, p) => sum + (parseFloat(p.project_cost) || 0), 0) || 0;
    const totalPaid = projects?.reduce((sum, p) => sum + (parseFloat(p.total_refund) || 0), 0) || 0;
    const totalOutstanding = projects?.reduce((sum, p) => sum + (parseFloat(p.outstanding_balance) || 0), 0) || 0;

    const getStatusStyle = (status, isPast) => {
        switch (status) {
            case 'paid': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
            case 'partial': return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
            case 'restructured': return 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100';
            case 'unpaid': return isPast ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-500';
            case 'partial': return 'bg-yellow-500';
            case 'restructured': return 'bg-gray-400';
            case 'unpaid': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <main className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 w-full">
            <Head title="My Refunds" />
            <div className="max-w-7xl mx-auto w-full">
                {/* Compact Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Projects</p>
                                <p className="text-base md:text-lg font-bold text-gray-900">{totalProjects}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Total Fund</p>
                                <p className="text-sm md:text-base font-bold text-gray-900 truncate">{formatPeso(totalProjectCost)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Total Repaid</p>
                                <p className="text-sm md:text-base font-bold text-emerald-700 truncate">{formatPeso(totalPaid)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Outstanding</p>
                                <p className="text-sm md:text-base font-bold text-red-700 truncate">{formatPeso(totalOutstanding)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white rounded-lg shadow-sm p-2.5 md:p-3 border border-gray-100 mb-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                            />
                            {searchInput && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="relative w-32 md:w-40">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg pl-8 pr-7 py-2 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white appearance-none"
                            >
                                <option value="">All Years</option>
                                {years && years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Projects List */}
                {projects && projects.length > 0 ? (
                    <div className="space-y-2 md:space-y-3">
                        {projects.map((p) => {
                            const paidMonths = p.months?.filter(m => m.status === 'paid') || [];
                            const unpaidMonths = p.months?.filter(m => m.status === 'unpaid') || [];
                            const partialMonths = p.months?.filter(m => m.status === 'partial') || [];
                            const restructuredMonths = p.months?.filter(m => m.status === 'restructured') || [];
                            const isExpanded = expandedProjects[p.project_id];
                            const overdueCount = unpaidMonths.filter(m => m.is_past).length;
                            const totalMonths = p.months?.length || 0;
                            const progressPercent = totalMonths > 0 ? Math.round((paidMonths.length / totalMonths) * 100) : 0;

                            return (
                                <div
                                    key={p.project_id}
                                    ref={el => detailsRefs.current[p.project_id] = el}
                                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                                >
                                    {/* Project Header */}
                                    <button
                                        ref={el => headerRefs.current[p.project_id] = el}
                                        onClick={() => toggleProject(p.project_id)}
                                        className="w-full text-left p-3 md:p-4 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="relative w-10 h-10 md:w-11 md:h-11 flex-shrink-0">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                    <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                                    <circle
                                                        cx="18" cy="18" r="15" fill="none"
                                                        stroke={progressPercent === 100 ? '#10B981' : progressPercent > 50 ? '#3B82F6' : '#F59E0B'}
                                                        strokeWidth="3"
                                                        strokeDasharray={`${progressPercent * 0.942} 94.2`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-[11px] font-bold text-gray-700">
                                                    {progressPercent}%
                                                </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-1">{p.project_title}</h3>
                                                    {overdueCount > 0 && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 flex-shrink-0">
                                                            {overdueCount} late
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Building className="w-3 h-3 flex-shrink-0" />
                                                    <span className="text-xs truncate">{p.proponent}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-[10px] text-gray-500">Outstanding</div>
                                                    <div className="text-sm font-bold text-red-600">{formatPeso(p.outstanding_balance)}</div>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-2 sm:hidden">
                                            <div className="text-center bg-gray-50 rounded p-1.5">
                                                <div className="text-[10px] text-gray-500">Cost</div>
                                                <div className="text-xs font-semibold text-gray-700">{formatPeso(p.project_cost)}</div>
                                            </div>
                                            <div className="text-center bg-green-50 rounded p-1.5">
                                                <div className="text-[10px] text-gray-500">Repaid</div>
                                                <div className="text-xs font-semibold text-green-700">{formatPeso(p.total_refund)}</div>
                                            </div>
                                            <div className="text-center bg-orange-50 rounded p-1.5">
                                                <div className="text-[10px] text-gray-500">Next</div>
                                                <div className="text-xs font-semibold text-orange-700">
                                                    {p.next_payment > 0 ? formatPeso(p.next_payment) : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expandable Details */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100">
                                            <div className="flex text-xs border-b border-gray-100 overflow-x-auto">
                                                <div className="flex items-center gap-1.5 px-3 py-2 text-green-700 border-b-2 border-green-500 whitespace-nowrap">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="font-medium">{paidMonths.length} Paid</span>
                                                </div>
                                                {partialMonths.length > 0 && (
                                                    <div className="flex items-center gap-1.5 px-3 py-2 text-yellow-700 whitespace-nowrap">
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                        <span className="font-medium">{partialMonths.length} Partial</span>
                                                    </div>
                                                )}
                                                {unpaidMonths.length > 0 && (
                                                    <div className="flex items-center gap-1.5 px-3 py-2 text-red-700 whitespace-nowrap">
                                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                        <span className="font-medium">{unpaidMonths.length} Unpaid</span>
                                                    </div>
                                                )}
                                                {restructuredMonths.length > 0 && (
                                                    <div className="flex items-center gap-1.5 px-3 py-2 text-gray-500 whitespace-nowrap">
                                                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                        <span className="font-medium">{restructuredMonths.length} Restructured</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Months Grid */}
                                            <div className="max-h-52 md:max-h-64 overflow-y-auto p-2">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                                                    {p.months?.map((m, i) => {
                                                        const hasPayments = m.payments && m.payments.length > 0;
                                                        const hasRemarks = m.payments?.some(p => p.remarks);
                                                        
                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => hasPayments && openMonthDetails(m)}
                                                                className={`flex items-center justify-between px-2 py-1.5 rounded border text-xs transition-colors ${
                                                                    getStatusStyle(m.status, m.is_past)
                                                                } ${hasPayments ? 'cursor-pointer' : 'cursor-default'}`}
                                                                title={hasPayments ? 'Click for payment details' : `${m.month}: ${m.status}`}
                                                            >
                                                                <div className="flex items-center gap-1 min-w-0">
                                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(m.status)}`}></div>
                                                                    <span className="truncate text-[11px]">
                                                                        {m.month.split(' ')[0].substring(0, 3)} {m.month.split(' ')[1]}
                                                                    </span>
                                                                    {hasRemarks && (
                                                                        <Info className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-semibold flex-shrink-0 text-[10px]">
                                                                        {formatPeso(m.refund_amount)}
                                                                    </span>
                                                                    {hasPayments && (
                                                                        <ChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 flex justify-between items-center text-[11px]">
                                                <span className="text-gray-500">
                                                    {totalMonths} months • Click paid months for details
                                                </span>
                                                <button
                                                    onClick={() => closeProject(p.project_id)}
                                                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    <ChevronUp className="w-3 h-3" />
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-10 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-gray-100 rounded-full">
                                <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-sm md:text-base font-medium text-gray-900 mb-1">No Refunds Found</h3>
                                <p className="text-xs md:text-sm text-gray-500">
                                    {searchInput || yearFilter
                                        ? 'Try adjusting your search or filters.'
                                        : 'No project refunds available.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Details Modal */}
            {selectedMonth && (
                <div 
                    ref={modalRef}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={closeModal}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{selectedMonth.month}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${getStatusDot(selectedMonth.status)}`}></div>
                                    <span className="text-xs font-medium capitalize text-gray-600">{selectedMonth.status}</span>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Amount Due</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatPeso(selectedMonth.amount_due)}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-[10px] text-blue-600 uppercase tracking-wide">Total Paid</p>
                                    <p className="text-sm font-bold text-blue-700 mt-0.5">{formatPeso(selectedMonth.amount_paid)}</p>
                                </div>
                            </div>

                            {selectedMonth.payments && selectedMonth.payments.length > 0 ? (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5" />
                                        Payment Details
                                    </h4>
                                    {selectedMonth.payments.map((payment, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Payment {idx + 1}</span>
                                                <span className="text-sm font-bold text-green-700">{formatPeso(payment.amount)}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {payment.bank_name && (
                                                    <div>
                                                        <p className="text-gray-400 text-[10px]">Bank</p>
                                                        <p className="font-medium text-gray-700">{payment.bank_name}</p>
                                                    </div>
                                                )}
                                                {payment.check_num && (
                                                    <div>
                                                        <p className="text-gray-400 text-[10px]">Check No.</p>
                                                        <p className="font-medium text-gray-700">{payment.check_num}</p>
                                                    </div>
                                                )}
                                                {payment.check_date && (
                                                    <div>
                                                        <p className="text-gray-400 text-[10px]">Check Date</p>
                                                        <p className="font-medium text-gray-700">{formatDate(payment.check_date)}</p>
                                                    </div>
                                                )}
                                                {payment.receipt_num && (
                                                    <div>
                                                        <p className="text-gray-400 text-[10px]">OR No.</p>
                                                        <p className="font-medium text-gray-700">{payment.receipt_num}</p>
                                                    </div>
                                                )}
                                                {payment.receipt_date && (
                                                    <div>
                                                        <p className="text-gray-400 text-[10px]">OR Date</p>
                                                        <p className="font-medium text-gray-700">{formatDate(payment.receipt_date)}</p>
                                                    </div>
                                                )}
                                                {payment.remarks && (
                                                    <div className="col-span-2">
                                                        <p className="text-gray-400 text-[10px]">Remarks</p>
                                                        <p className="font-medium text-gray-700">{payment.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Banknote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No payment records for this month</p>
                                </div>
                            )}

                            {selectedMonth.status === 'partial' && (
                                <div className="mt-4 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-yellow-700 font-medium">Remaining Balance</span>
                                        <span className="text-sm font-bold text-yellow-800">
                                            {formatPeso(Math.max(0, (selectedMonth.amount_due || 0) - (selectedMonth.amount_paid || 0)))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 p-3 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}