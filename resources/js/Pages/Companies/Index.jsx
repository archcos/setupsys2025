import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Index({ companies, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // NEW: Syncing state

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/companies', { search }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this company?')) {
      router.delete(`/companies/${id}`);
    }
  };

  const handleSync = () => {
    if (confirm('Sync companies from CSV?')) {
      setIsSyncing(true);
      router.post('/companies/sync', {}, {
        preserveScroll: true,
        onSuccess: () => {
          alert('CSV sync complete!');
          setIsSyncing(false);
        },
        onError: () => {
          alert('Failed to sync CSV.');
          setIsSyncing(false);
        },
      });
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
              <div className="flex items-center gap-2">
                <Link
                  href="/companies/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  + Add Company
                </Link>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`px-4 py-2 rounded text-sm text-white ${
                    isSyncing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSyncing ? '🔄 Syncing...' : '🔁 Sync from CSV'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by company or owner name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 border rounded w-full"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto border">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Industry</th>
                    <th className="px-3 py-2">Products</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.company_id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{company.company_name}</td>
                      <td className="px-3 py-2">{company.owner_name}</td>
                      <td className="px-3 py-2">{company.email}</td>
                      <td className="px-3 py-2">{company.contact_number}</td>
                      <td className="px-3 py-2">
                        {company.street}, {company.barangay}, {company.municipality}, {company.province}
                      </td>
                      <td className="px-3 py-2">{company.industry_type || company.setup_industry}</td>
                      <td className="px-3 py-2">{company.products}</td>
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

            {companies.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">No companies found.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
