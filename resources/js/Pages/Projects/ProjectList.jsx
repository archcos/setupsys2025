import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function ProjectList({ projects, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get('/project-list', { search }, { preserveState: true, replace: true });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Project List</h2>

            <input
              type="text"
              placeholder="Search by title, company, cost..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded mb-4 w-full"
            />

            <table className="w-full text-sm table-auto border">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Phase 1</th>
                  <th className="px-3 py-2">Phase 2</th>
                  <th className="px-3 py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const isOpen = openDropdowns[project.project_id] || false;

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
                      <td className="px-3 py-2">{project.company?.company_name}</td>
                      <td className="px-3 py-2">{project.phase_one}</td>
                      <td className="px-3 py-2">{project.phase_two}</td>
                      <td className="px-3 py-2">{project.project_cost}</td>
                    </tr>,

                    isOpen && (
                      <tr key={`details-${project.project_id}`} className="bg-gray-50 border-b">
                        <td colSpan="5" className="px-3 py-2">
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
          </div>
        </main>
      </div>
    </div>
  );
}
