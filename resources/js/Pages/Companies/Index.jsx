import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Index({ companies, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // NEW: Syncing state
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [selectedCompany, setSelectedCompany] = useState(null);

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

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/companies', {
      search,
      perPage: newPerPage,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Show</label>
                <select
                  value={perPage}
                  onChange={handlePerPageChange}
                  className="block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
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
                  {companies.data.map((company) => (
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
                    <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCompany(company)}
                        className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 transition"
                      >
                        View
                      </button>

                      <Link
                        href={`/companies/${company.company_id}/edit`}
                        className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(company.company_id)}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>


                    </tr>
                  ))}
                </tbody>
              </table>
              {companies.links.length > 1 && (
  <div className="mt-6 flex justify-end space-x-2">
    {companies.links.map((link, index) => (
      <button
        key={index}
        disabled={!link.url}
        onClick={() => link.url && router.visit(link.url)}
        className={`px-3 py-1 text-sm rounded border ${
          link.active
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        dangerouslySetInnerHTML={{ __html: link.label }}
      />
    ))}
  </div>
)}
            </div>

            {companies.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">No companies found.</p>
            )}
          </div>
          {selectedCompany && (
            <CompanyModal
              company={selectedCompany}
              isOpen={!!selectedCompany}
              onClose={() => setSelectedCompany(null)}
            />
          )}

        </main>
      </div>
    </div>
  );
}
function CompanyModal({ company, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>
        <h3 className="text-xl font-semibold mb-4">Company & Owner Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Company Name:</strong> {company.company_name}</p>
            <p><strong>Email:</strong> {company.email}</p>
            <p><strong>Contact:</strong> {company.contact_number}</p>
            <p><strong>Location:</strong><br />
              {company.street}, {company.barangay},<br />
              {company.municipality}, {company.province}
            </p>
            <p><strong>Industry:</strong> {company.industry_type || company.setup_industry}</p>
            <p><strong>Products:</strong> {company.products}</p>
          </div>
          <div>
            <p><strong>Owner Name:</strong> {company.owner_name}</p>
            <p><strong>Sex:</strong> {company.sex}</p>
            <p><strong>Male Employees:</strong> {company.male}</p>
            <p><strong>Female Employees:</strong> {company.female}</p>
            <p><strong>Direct Male:</strong> {company.direct_male}</p>
            <p><strong>Direct Female:</strong> {company.direct_female}</p>
            <p><strong>District:</strong> {company.district}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
