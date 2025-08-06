import { useEffect, useState } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function ImplementationIndex({ implementations, filters }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      router.get('/implementation', { search, perPage }, { preserveState: true, replace: true });
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search, perPage]);

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
  };

  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      replace: true,
      only: ['implementations'],
      data: {
        search,
        perPage,
      },
    });
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Checklist" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Implementation Checklists</h2>
            </div>

            <input
              type="text"
              placeholder="Search by title or company..."
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

            {implementations.data.length === 0 ? (
              <p className="text-gray-500">No implementations found.</p>
            ) : (
              <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-3">Project Title</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {implementations.data.map((impl) => (
                    <tr key={impl.implement_id} className="border-t">
                      <td className="p-3">{impl.project?.project_title ?? 'No Title'}</td>
                      <td className="p-3">{impl.project?.company?.company_name ?? 'N/A'}</td>
                      <td className="p-3">
                        <Link
                          href={`/implementation/checklist/${impl.implement_id}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          View Checklist
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            <div className="mt-6 flex justify-end space-x-2">
              {implementations.links.map((link, index) => (
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
