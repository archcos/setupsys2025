import { Head, router } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Search } from "lucide-react";

export default function UserLoan({ projects, search }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchInput, setSearchInput] = useState(search || "");
    const isFirstRun = useRef(true);

    // Delay search to prevent firing on every keystroke
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        const delay = setTimeout(() => {
            router.get("/my-loans", { search: searchInput }, { preserveScroll: true });
        }, 400);
        return () => clearTimeout(delay);
    }, [searchInput]);

    return (
        <>
            <Head title="My Loans" />
            <div className="h-screen flex bg-gray-100 overflow-hidden">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title="My Loans" toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                    <main className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3 sticky top-0 z-10">
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
                        </div>

                        {/* Loans Table */}
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-left text-gray-700">
                                        <th className="p-3 border-b">Project Title</th>
                                        <th className="p-3 border-b">Company</th>
                                        <th className="p-3 border-b">Loan Amount</th>
                                        <th className="p-3 border-b">Month Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.data.length > 0 ? (
                                        projects.data.map((project, idx) =>
                                            project.loans.map((loan) => (
                                                <tr
                                                    key={loan.id}
                                                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                                >
                                                    <td className="p-3 border-b">{project.project_title}</td>
                                                    <td className="p-3 border-b">{project.company?.company_name}</td>
                                                    <td className="p-3 border-b">
                                                        {loan.amount?.toLocaleString() ?? "-"}
                                                    </td>
                                                    <td className="p-3 border-b">
                                                        {loan.month_paid
                                                            ? new Date(loan.month_paid).toLocaleDateString("en-US", {
                                                                  year: "numeric",
                                                                  month: "long",
                                                              })
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="p-6 text-center text-gray-500"
                                            >
                                                No loans found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {projects.links?.length > 0 && (
                            <div className="flex justify-center mt-4 flex-wrap gap-1">
                                {projects.links.map((link, index) => (
                                    <button
                                        key={index}
                                        disabled={!link.url}
                                        onClick={() => router.get(link.url)}
                                        className={`px-3 py-1.5 text-sm border rounded-md ${
                                            link.active
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white hover:bg-gray-50"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
