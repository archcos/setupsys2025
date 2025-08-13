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

    // Delay search to prevent firing on every keystroke
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

    return (
        <>
            <Head title="My Loans" />
            <div className="h-screen flex bg-gray-100 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="My Loans" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                    <main className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Filters */}
                        <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-center gap-3 sticky top-0 z-10">
                            {/* Search Bar */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search projects or companies..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm w-full"
                                />
                            </div>

                            {/* Year Filter */}
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="">All Years</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Projects Table */}
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-left text-gray-700">
                                        <th className="p-3 border-b">Project Title</th>
                                        <th className="p-3 border-b">Company</th>
                                        <th className="p-3 border-b">Project Cost</th>
                                        <th className="p-3 border-b">Total Refund</th>
                                        <th className="p-3 border-b">Outstanding Balance</th>
                                        <th className="p-3 border-b">Refund Months</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.length > 0 ? (
                                        projects.map((p, idx) => (
                                            <tr key={p.project_id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="p-3 border-b">{p.project_title}</td>
                                                <td className="p-3 border-b">{p.company}</td>
                                                <td className="p-3 border-b">{"₱"+p.project_cost.toLocaleString()}</td>
                                                <td className="p-3 border-b">{"₱"+p.total_refund.toLocaleString()}</td>
                                                <td className="p-3 border-b">{"₱"+p.outstanding_balance.toLocaleString()}</td>
                                                <td className="p-3 border-b">
                                                    {p.months.map((m, i) => (
                                                        <div key={i} className="flex justify-between">
                                                            <span>{m.month}</span>
                                                            <span>{m.refund_amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-6 text-center text-gray-500">
                                                No projects found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
