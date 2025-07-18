import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Index({ activities, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      router.get('/activities', { search }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      router.delete(`/activities/${id}`);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activities</h2>
              <Link href="/activities/create" className="bg-blue-600 text-white px-4 py-2 rounded">
                + Add Activity
              </Link>
            </div>

            <input
              type="text"
              placeholder="Search by activity or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded w-full mb-4"
            />

            <table className="w-full text-sm table-auto border">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.activity_id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{a.activity_name}</td>
                    <td className="px-3 py-2">
                      {new Date(a.activity_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </td>
                    <td className="px-3 py-2">{a.project?.project_title}</td>
                    <td className="px-3 py-2 space-x-2">
                      <Link href={`/activities/${a.activity_id}/edit`} className="text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(a.activity_id)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
