import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function ProjectsIndex() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { projects, companies } = usePage().props;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(`/projects/${id}`);
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
              <h1 className="text-xl font-semibold">Projects</h1>
              <Link
                href="/projects/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                + Add Project
              </Link>
            </div>

            <table className="table-auto w-full text-sm border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Project Name</th>
                  <th className="px-3 py-2">Start Date</th>
                  <th className="px-3 py-2">End Date</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.project_id} className="border-t">
                    <td className="px-3 py-2">{project.project_id}</td>
                    <td className="px-3 py-2">
                      {companies.find(c => c.company_id === project.company_id)?.company_name || '—'}
                    </td>
                    <td className="px-3 py-2">{project.project_name}</td>
                    <td className="px-3 py-2">{project.start_date}</td>
                    <td className="px-3 py-2">{project.end_date}</td>
                    <td className="px-3 py-2 space-x-2">
                      <Link
                        href={`/projects/${project.project_id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(project.project_id)}
                        className="text-red-600 hover:underline"
                      >
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
