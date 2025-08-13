import { Link, router, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// Helper to format date string to "MMM YYYY"
function formatMonthYear(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return d.toLocaleString('default', { month: 'short', year: 'numeric' });
}

export default function Index({ projects, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [perPage, setPerPage] = useState(filters.perPage || 10);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get('/projects', { search, perPage }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, perPage]);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(`/projects/${id}`);
    }
  };

  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      replace: true,
      only: ['projects'],
      data: {
        search,
        perPage,
      },
    });
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
  };



  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Projects" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Projects</h2>
              <Link
                href="/projects/create"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                + Add Project
              </Link>
            </div>

            <input
              type="text"
              placeholder="Search by title, company, cost..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded mb-4 w-full"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Show</label>
                <select
                  value={perPage}
                  onChange={handlePerPageChange}
                  className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
            </div>

             <table className="w-full text-sm table-auto border">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Phase One</th> {/* combined release dates */}
                  <th className="px-3 py-2">Phase Two</th> {/* combined refund dates */}
                  <th className="px-3 py-2">Cost</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.data.map((project) => {
                  const isOpen = openDropdowns[project.project_id] || false;

                  // Format dates or fallback to '-'
                  const phaseOneInitial = formatMonthYear(project.release_initial);
                  const phaseOneEnd = formatMonthYear(project.release_end);
                  const phaseTwoInitial = formatMonthYear(project.refund_initial);
                  const phaseTwoEnd = formatMonthYear(project.refund_end);

                  const phaseOneDisplay = phaseOneInitial && phaseOneEnd ? `${phaseOneInitial} - ${phaseOneEnd}` : '-';
                  const phaseTwoDisplay = phaseTwoInitial && phaseTwoEnd ? `${phaseTwoInitial} - ${phaseTwoEnd}` : '-';

                  return [
                    <tr
                      key={`main-${project.project_id}`}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        setOpenDropdowns((prev) => ({
                          ...prev,
                          [project.project_id]: !prev[project.project_id],
                        }))
                      }
                    >
                      <td className="px-3 py-2">{project.project_title}</td>
                      <td className="px-3 py-2">{project.company?.company_name || '-'}</td>
                      <td className="px-3 py-2">{phaseOneDisplay}</td>
                      <td className="px-3 py-2">{phaseTwoDisplay}</td>
                      <td className="px-3 py-2">{project.project_cost ?? '-'}</td>
                      <td className="px-3 py-2 space-x-2">
                        <Link
                          href={`/projects/${project.project_id}/edit`}
                          className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>,

                    isOpen && (
                      <tr key={`details-${project.project_id}`} className="bg-gray-50 border-b">
                        <td colSpan="6" className="px-3 py-2">
                          <div className="pl-4">
                            <strong>Items:</strong>
                            {project.items && project.items.length > 0 ? (
                              <ul className="list-disc ml-6 mt-2 text-sm">
                                {project.items.map((item) => (
                                  <li key={item.item_id}>
                                    {item.item_name} — Qty: {item.quantity}, Cost: ₱{item.item_cost}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 mt-1">No items for this project.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end space-x-2">
              {projects.links.map((link, index) => (
                <button
                  key={index}
                  disabled={!link.url}
                  onClick={() => link.url && handlePageChange(link.url)}
                  className={`px-3 py-1 rounded text-sm ${
                    link.active
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
