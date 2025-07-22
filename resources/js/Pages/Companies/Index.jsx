import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Index({ companies, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // 🔍 Debounced Dynamic Search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/companies', { search }, { preserveState: true, replace: true });
    }, 400); // delay in ms

    return () => clearTimeout(delaySearch);
  }, [search]);

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

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by company or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 border rounded w-full"
              />
            </div>

            <table className="w-full text-sm table-auto border">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-3 py-2">Company Name</th>
                  <th className="px-3 py-2">Owner First Name</th>
                  <th className="px-3 py-2">Middle Name</th>
                  <th className="px-3 py-2">Last Name</th>
                  <th className="px-3 py-2">Company Location</th>
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

            {companies.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">No companies found.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
