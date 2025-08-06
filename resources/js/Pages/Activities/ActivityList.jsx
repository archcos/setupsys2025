import { router, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function ActivityList({ activities, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState([]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/activity-list', { search }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleProject = (projectId) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Group activities by project_id
  const grouped = activities.reduce((acc, activity) => {
    const projectId = activity.project?.project_id || 'Unassigned';
    if (!acc[projectId]) {
      acc[projectId] = {
        projectTitle: activity.project?.project_title || 'Unassigned Project',
        activities: [],
      };
    }
    acc[projectId].activities.push(activity);
    return acc;
  }, {});

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Activities" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activities by Project </h2>
            </div>

            {/* Grouped Activities */}
            {Object.entries(grouped).map(([projectId, group]) => (
              <div key={projectId} className="mb-4 border rounded">
                <button
                  onClick={() => toggleProject(projectId)}
                  className="w-full text-left bg-gray-200 px-4 py-2 font-semibold"
                >
                  {group.projectTitle}
                </button>
                {expandedProjectIds.includes(projectId) && (
                  <table className="w-full text-sm table-auto border-t">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="px-3 py-2">Activity</th>
                        <th className="px-3 py-2">Start - End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.activities.map((a) => (
                        <tr key={a.activity_id} className="border-t hover:bg-gray-50">
                          <td className="px-3 py-2">{a.activity_name}</td>
                          <td className="px-3 py-2">
                            {formatMonthYear(a.start_date)} – {formatMonthYear(a.end_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center text-gray-500 py-6">
                No activities found.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
