import { Link, router, Head, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
  Search,
  PlusCircle,
  Building2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function handleDelete(reportId) {
  if (confirm("Are you sure you want to delete this report?")) {
    router.delete(route("reports.destroy", reportId));
  }
}

function formatReportDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);

  const options = { year: "numeric", month: "long", day: "numeric" };
  const formatted = date.toLocaleDateString("en-US", options);

  const month = date.getMonth() + 1; // 1-based
  let quarter = "Q1";
  if (month >= 4 && month <= 6) quarter = "Q2";
  else if (month >= 7 && month <= 9) quarter = "Q3";
  else if (month >= 10 && month <= 12) quarter = "Q4";

  return `Submitted @ ${formatted} - ${quarter}`;
}

export default function Index({ projects, filters }) {
  const [search, setSearch] = useState(filters.search || "");
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null); // track open project
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { auth } = usePage().props;
  const role = auth?.user?.role;

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(route("reports.index"), { search, perPage }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search, perPage]);

  return (
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Reports" />
          <div className="max-w-7xl mx-auto">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gray-50 p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
                </div>
              </div>

              {/* Filters */}
              <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search company name or project title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Per Page */}
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-500 shadow-sm">
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(e.target.value)}
                      className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-700">entries</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Title</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Reports</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {projects.data.map((project) => (
                      <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                        {/* Project clickable */}
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === project.project_id ? null : project.project_id)}
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            {project.project_title}
                            {openDropdown === project.project_id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {/* Dropdown reports */}
                          {openDropdown === project.project_id && (
<div className="mt-2 ml-4 bg-gray-50 border border-gray-200 rounded-lg shadow p-3 space-y-2">
  {project.reports && project.reports.length > 0 ? (
    project.reports.map((report) => (
      <div
        key={report.report_id}
        className="flex items-center justify-between text-xs text-gray-700"
      >
        <span>{formatReportDate(report.created_at)}</span>

        <div className="flex gap-2">
          {/* Download */}
          <a
            href={route("reports.download", report.report_id)}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-[10px]"
          >
            Download
          </a>

          {/* Delete */}
          <button
            onClick={() => handleDelete(report.report_id)}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-[10px]"
          >
            Delete
          </button>
        </div>
      </div>
    ))
  ) : (
    <p className="text-xs text-gray-500">No reports submitted yet</p>
  )}
</div>

                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {project.company?.company_name || "No company"}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {project.reports?.length || 0}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <Link
                            href={route("reports.create", project.project_id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-medium shadow"
                          >
                            <PlusCircle className="w-4 h-4" />
                            Create Report
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {projects.data.length === 0 && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                    <p className="text-gray-500 text-sm">Nothing to display, try adjusting your filters</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {projects.links && projects.links.length > 1 && (
                <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {projects.from || 1} to {projects.to || projects.data.length} of{" "}
                      {projects.total || projects.data.length} results
                    </div>
                    <div className="flex gap-1">
                      {projects.links.map((link, index) => (
                        <button
                          key={index}
                          disabled={!link.url}
                          onClick={() => link.url && router.visit(link.url)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                            link.active
                              ? "bg-blue-500 text-white border-transparent shadow-md"
                              : link.url
                              ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          }`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
  );
}
