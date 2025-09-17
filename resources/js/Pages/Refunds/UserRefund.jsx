import { Head, router } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { 
    Calendar, 
    TrendingUp, 
    AlertCircle,
    CheckCircle,
    Clock,
    CreditCard,
    Building,
    Target,
    FileText,
    Activity,
    Wallet,
    ChevronDown,
    ChevronUp,
    BanknoteArrowUp,
    Banknote
} from "lucide-react";

export default function UserLoan({ projects, search, years, selectedYear }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
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
   
        
                    <main className="flex-1 overflow-y-auto p-6 space-y-8">
                         <Head title="My Refunds" />
                        <div className="max-w-7xl mx-auto">
                            {/* Header Section */}
                            

                            {/* Stats Cards */}
{/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
  {/* Total Projects */}
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Total Projects</p>
        <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
      </div>
      <div className="p-3 bg-blue-100 rounded-lg">
        <FileText className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>

  {/* Innovation Fund */}
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Innovation Fund</p>
        <p className="text-xl font-bold text-gray-900">{formatPeso(totalProjectCost)}</p>
      </div>
      <div className="p-3 bg-green-100 rounded-lg">
        <BanknoteArrowUp className="w-6 h-6 text-green-600" />
      </div>
    </div>
  </div>

  {/* Outstanding */}
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Outstanding</p>
        <p className="text-xl font-bold text-gray-900">{formatPeso(totalOutstanding)}</p>
      </div>
      <div className="p-3 bg-red-100 rounded-lg">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
    </div>
  </div>

  {/* Active Loans */}
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Active Refunds</p>
        <p className="text-2xl font-bold text-gray-900">{projectsWithBalance}</p>
      </div>
      <div className="p-3 bg-orange-100 rounded-lg">
        <Activity className="w-6 h-6 text-orange-600" />
      </div>
    </div>
  </div>
</div>


                           
                            {/* Projects List */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Wallet className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Project Refunds</h2>
                                            <p className="text-gray-600 text-sm">View detailed breakdown of your financing</p>
                                        </div>

                                           <div className="relative">
                                        <Calendar className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                                        <select
                                            value={yearFilter}
                                            onChange={(e) => setYearFilter(e.target.value)}
                                            className="border border-gray-200 rounded-xl pl-10 pr-8 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
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
                                            const paidExpanded = expandedSections[`${p.project_id}-paid`];
                                            const unpaidExpanded = expandedSections[`${p.project_id}-unpaid`];

                                            return (
                                                <div
                                                    key={p.project_id}
                                                    className="p-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200"
                                                >
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        {/* Left Column - Project Info */}
                                                        <div className="space-y-4">
                                                            <div className="bg-gradient-to-r from-gray-50 to-gray-50/30 rounded-xl p-6 border border-gray-200">
                                                                <div className="flex items-start gap-3 mb-4">
                                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                                        <Target className="w-5 h-5 text-blue-600" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{p.project_title}</h3>
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            <Building className="w-4 h-4" />
                                                                            <span className="text-sm font-medium">{p.company}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Financial Stats Grid */}
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Banknote className="w-4 h-4 text-green-600" />
                                                                            <span className="text-xs font-semibold text-green-800">PROJECT COST</span>
                                                                        </div>
                                                                        <span className="text-lg font-bold text-green-700">{formatPeso(p.project_cost)}</span>
                                                                    </div>
                                                                    
                                                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <TrendingUp className="w-4 h-4 text-blue-600" />
                                                                            <span className="text-xs font-semibold text-blue-800">TOTAL REPAYMENT</span>
                                                                        </div>
                                                                        <span className="text-lg font-bold text-blue-700">{formatPeso(p.total_refund)}</span>
                                                                    </div>
                                                                    
                                                                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                                                            <span className="text-xs font-semibold text-red-800">OUTSTANDING</span>
                                                                        </div>
                                                                        <span className="text-lg font-bold text-red-700">{formatPeso(p.outstanding_balance)}</span>
                                                                    </div>
                                                                    
                                                                    {p.next_payment > 0 && (
                                                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Clock className="w-4 h-4 text-orange-600" />
                                                                                <span className="text-xs font-semibold text-orange-800">NEXT PAYMENT</span>
                                                                            </div>
                                                                            <span className="text-lg font-bold text-orange-700">{formatPeso(p.next_payment)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right Column - Repayment History */}
                                                        <div className="space-y-4">
                                                            <div className="bg-gradient-to-r from-gray-50 to-gray-50/30 rounded-xl p-6 border border-gray-200">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                                        <Calendar className="w-5 h-5 text-purple-600" />
                                                                    </div>
                                                                    <h4 className="font-bold text-gray-900">Repayment History</h4>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    {/* Paid Months */}
                                                                    {paidMonths.length > 0 && (
                                                                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                                                            <button
                                                                                onClick={() => toggleSection(p.project_id, 'paid')}
                                                                                className="flex items-center justify-between w-full mb-3 group"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                                                    <h5 className="text-green-800 font-bold text-sm">
                                                                                        PAID MONTHS ({paidMonths.length})
                                                                                    </h5>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    {paidExpanded ? (
                                                                                        <ChevronUp className="w-4 h-4 text-green-600 group-hover:text-green-700 transition-colors" />
                                                                                    ) : (
                                                                                        <ChevronDown className="w-4 h-4 text-green-600 group-hover:text-green-700 transition-colors" />
                                                                                    )}
                                                                                </div>
                                                                            </button>
                                                                            
                                                                            <div className={`transition-all duration-300 overflow-hidden ${
                                                                                paidExpanded ? 'max-h-96 opacity-100' : 'max-h-20 opacity-70'
                                                                            }`}>
                                                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                                                    {paidMonths.map((m, i) => (
                                                                                        <div key={i} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-green-100">
                                                                                            <span className="text-sm font-medium text-gray-700">{m.month}</span>
                                                                                            <span className="font-bold text-green-700">
                                                                                                {formatPeso(m.refund_amount)}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {!paidExpanded && paidMonths.length > 3 && (
                                                                                <div className="text-center mt-2">
                                                                                    <span className="text-xs text-green-600 bg-white px-2 py-1 rounded-full border border-green-200">
                                                                                        {paidMonths.length - 3} more months...
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Unpaid Months */}
                                                                    {unpaidMonths.length > 0 && (
                                                                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                                                            <button
                                                                                onClick={() => toggleSection(p.project_id, 'unpaid')}
                                                                                className="flex items-center justify-between w-full mb-3 group"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                                                                    <h5 className="text-red-800 font-bold text-sm">
                                                                                        UNPAID MONTHS ({unpaidMonths.length})
                                                                                    </h5>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    {unpaidExpanded ? (
                                                                                        <ChevronUp className="w-4 h-4 text-red-600 group-hover:text-red-700 transition-colors" />
                                                                                    ) : (
                                                                                        <ChevronDown className="w-4 h-4 text-red-600 group-hover:text-red-700 transition-colors" />
                                                                                    )}
                                                                                </div>
                                                                            </button>
                                                                            
                                                                            <div className={`transition-all duration-300 overflow-hidden ${
                                                                                unpaidExpanded ? 'max-h-96 opacity-100' : 'max-h-20 opacity-70'
                                                                            }`}>
                                                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                                                    {unpaidMonths.map((m, i, arr) => (
                                                                                        <div key={i} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-red-100">
                                                                                            <span className="text-sm font-medium text-gray-700">{m.month}</span>
                                                                                            <div className="text-right">
                                                                                                <span className="font-bold text-red-700">
                                                                                            {formatPeso(m.refund_amount)}
                                                                                            </span>

                                                                                            {/* mark the overall final month (refund_end) — compare to last entry in p.months */}
                                                                                            {m.month === p.months[p.months.length - 1].month && (
                                                                                            <div className="text-xs text-red-600 italic">
                                                                                                Subject to Adjustment
                                                                                            </div>
                                                                                            )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                        {!unpaidExpanded && unpaidMonths.length > 3 && (
                                                                        <div className="text-center mt-2">
                                                                            <button
                                                                            onClick={() => toggleSection(p.project_id, "unpaid")}
                                                                            className="text-xs text-red-600 bg-white px-2 py-1 rounded-full border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                                                                            >
                                                                            {unpaidMonths.length - 3} more months...
                                                                            </button>
                                                                        </div>
                                                                        )}

                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-gray-100 rounded-full">
                                                <CreditCard className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Refund Found</h3>
                                                <p className="text-gray-500">No project refund match your current search criteria.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
    );
}