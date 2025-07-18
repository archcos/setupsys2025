import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Index({ companies }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this company?')) {
      router.delete(`/companies/${id}`);
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
              <h2 className="text-lg font-semibold">Companies</h2>
              <Link
                href="/companies/create"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                + Add Company
              </Link>
            </div>

            <table className="w-full text-sm table-auto border">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Owner Fname</th>
                  <th className="px-3 py-2">Mname</th>
                  <th className="px-3 py-2">Lname</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.company_id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{company.company_name}</td>
                    <td className="px-3 py-2">{company.owner_fname}</td>
                    <td className="px-3 py-2">{company.owner_mname}</td>
                    <td className="px-3 py-2">{company.owner_lname}</td>
                    <td className="px-3 py-2">{company.company_location}</td>
                    <td className="px-3 py-2 space-x-2">
                      <Link
                        href={`/companies/${company.company_id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(company.company_id)}
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
