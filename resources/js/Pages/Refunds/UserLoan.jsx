import { Head, router } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Search } from "lucide-react";

export default function UserLoan({ projects, search, years, selectedYear }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchInput, setSearchInput] = useState(search || "");
    const [yearFilter, setYearFilter] = useState(selectedYear || "");
    const isFirstRun = useRef(true);

    // Delay search
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        const delay = setTimeout(() => {
            router.get("/my-loans", { search: searchInput, year: yearFilter }, { preserveScroll: true });
        }, 400);
        return () => clearTimeout(delay);
    }, [searchInput, yearFilter]);

    const formatPeso = (amount) =>
        `₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    return (
        <>
            <Head title="My Loans" />
            <div className="h-screen flex bg-gray-100 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="My Loans" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                    <main className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Filters */}
                        <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-center gap-3 sticky top-0 z-10 border border-gray-200">
                            <div className="relative flex-1 min-w-[220px]">
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search projects or companies..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Years</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Projects List */}
                        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                            {projects.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {projects.map((p, idx) => (
                                        <div
                                            key={p.project_id}
                                            className={`flex flex-col md:flex-row gap-4 p-4 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}
                                        >
                                          {/* Left Column - Project Info */}
<div className="flex-1">
    <h3 className="text-lg font-semibold text-gray-800">
        <span className="font-medium">Project Title: </span> {p.project_title}
    </h3>
    <p className="text-gray-600 text-sm">
        <span className="font-medium">Company Name: </span> {p.company}
    </p>

    <div className="mt-2 space-y-1 text-sm">
        <div>
            <span className="font-medium">Project Cost:</span>{" "}
            <span className="text-green-700 font-semibold">{formatPeso(p.project_cost)}</span>
        </div>
        <div>
            <span className="font-medium">Total Repayment:</span>{" "}
            <span className="text-blue-700 font-semibold">{formatPeso(p.total_refund)}</span>
        </div>
        <div>
            <span className="font-medium">Outstanding Balance:</span>{" "}
            <span className="text-red-700 font-semibold">{formatPeso(p.outstanding_balance)}</span>
        </div>

        {/* Next Payment */}
        {p.months.find(m => m.refund_amount === 0) && (
            <div className="pt-1 border-t mt-2">
                <span className="font-medium">Next Payment:</span>{" "}
                <span className="text-purple-700 font-semibold">
                    {p.months.find(m => m.refund_amount === 0).month} - {formatPeso(p.refund_amount || p.months.find(m => m.refund_amount === 0).refund_amount)}
                </span>
            </div>
        )}
    </div>
</div>


                                            {/* Right Column - Refund Months */}
    <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-gray-200 pl-0 md:pl-4">
    <h4 className="font-medium text-gray-700 mb-3">Repayment History</h4>

    {/* Paid Months */}
    {p.months.filter(m => m.refund_amount > 0).length > 0 && (
        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <h5 className="text-green-700 font-semibold mb-2 text-sm">Paid</h5>
            <div className="space-y-1 text-sm">
                {p.months
                    .filter(m => m.refund_amount > 0)
                    .map((m, i) => (
                        <div key={i} className="flex justify-between">
                            <span className="text-gray-600">{m.month}</span>
                            <span className="font-medium text-green-700">{formatPeso(m.refund_amount)}</span>
                        </div>
                    ))}
            </div>
        </div>
    )}

    {/* Unpaid Months */}
    {p.months.filter(m => m.refund_amount === 0).length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <h5 className="text-red-700 font-semibold mb-2 text-sm">Unpaid</h5>
            <div className="space-y-1 text-sm">
                {p.months
                    .filter(m => m.refund_amount === 0)
                    .map((m, i) => (
                        <div key={i} className="flex justify-between">
                            <span className="text-gray-600">{m.month}</span>
                            <span className="font-medium text-red-700">{formatPeso(m.refund_amount)}</span>
                        </div>
                    ))}
            </div>
        </div>
    )}
</div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    No projects found.
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
