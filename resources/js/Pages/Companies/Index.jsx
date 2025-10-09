import { Link, router, Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Factory,
  Package,
  Users,
  X,
  Filter,
  ArrowUpDown
} from 'lucide-react';

export default function Index({ companies, filters, allUsers = [] }) {
  const [search, setSearch] = useState(filters.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [openDropdownCompanyId, setOpenDropdownCompanyId] = useState(null);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");
  const { auth } = usePage().props;
  const role = auth?.user?.role;

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
        
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Companies" />
          <div className="max-w-7xl mx-auto">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Company Management</h2>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link
                      href="/companies/create"
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Company
                    </Link>
                    
                    <button
                      onClick={handleSync}
                      disabled={isSyncing}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                        isSyncing 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync CSV'}
                    </button>
                  </div>
                </div>
              </div>

                           {/* Filters Section */}
              <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search ..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Per Page Selector */}
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-500 shadow-sm">
                    <select
                      value={perPage}
                      onChange={handlePerPageChange}
                      className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-700">entries</span>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Company
                          {/* <ArrowUpDown className="w-3 h-3 text-gray-400" /> */}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Owner
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Factory className="w-4 h-4" />
                          Industry
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Products
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {companies.data.map((company) => (
                      <tr key={company.company_id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">

                            <div>
                              <div className="text-sm font-semibold text-gray-900">{company.company_name}</div>
                              <div className="text-xs text-gray-500">ID: {company.company_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900 font-medium">{company.owner_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {company.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {company.contact_number}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <div className="text-sm text-gray-900">
                              <div>{company.street}, {company.barangay}</div>
                              <div className="text-gray-600">{company.municipality}, {company.province}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {company.industry_type || company.setup_industry}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900 truncate max-w-32" title={company.products}>
                              {company.products}
                            </span>
                          </div>
                        </td>
<td className="px-6 py-4">
  <div className="flex flex-col items-center gap-2">
    {role === "admin" && (
      <div className="relative w-full">
        {/* Toggle Dropdown Button */}
        <button
          onClick={() =>
            setOpenDropdownCompanyId(
              openDropdownCompanyId === company.company_id ? null : company.company_id
            )
          }
          className="border rounded-lg px-2 py-1 text-sm w-full text-left bg-white hover:bg-gray-50"
        >
          {company.added_by
            ? allUsers.find((u) => u.user_id === company.added_by)?.first_name +
              " " +
              allUsers.find((u) => u.user_id === company.added_by)?.last_name
            : "Select user..."}
        </button>

        {/* Dropdown Panel */}
        {openDropdownCompanyId === company.company_id && (
          <div className="absolute mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
            {/* Row-specific search */}
            <input
              type="text"
              placeholder="Search user..."
              value={dropdownSearchTerm}
              onChange={(e) => setDropdownSearchTerm(e.target.value.toLowerCase())}
              className="w-full border-b px-2 py-1 text-sm focus:outline-none"
            />
            <div className="max-h-40 overflow-y-auto">
              {allUsers
                .filter(
                  (user) =>
                    user.first_name.toLowerCase().includes(dropdownSearchTerm) ||
                    user.last_name.toLowerCase().includes(dropdownSearchTerm)
                )
                .map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => {
                      router.put(`/companies/${company.company_id}/update-added-by`, {
                        added_by: user.user_id,
                      });
                      setOpenDropdownCompanyId(null); // close dropdown
                      setDropdownSearchTerm(""); // reset search
                    }}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    {user.first_name} {user.last_name}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Action Buttons */}
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => setSelectedCompany(company)} // now only for modal
        className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200 group"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>

      <Link
        href={`/companies/${company.company_id}/edit`}
        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
        title="Edit Company"
      >
        <Edit3 className="w-4 h-4" />
      </Link>

      <button
        onClick={() => handleDelete(company.company_id)}
        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
        title="Delete Company"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
</td>



                      </tr>
                    ))}
                  </tbody>
                </table>

                {companies.data.length === 0 && (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Building className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No companies found</h3>
                        <p className="text-gray-500 text-sm">Get started by adding your first company</p>
                      </div>
                      <Link
                        href="/companies/create"
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Company
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {companies.links && companies.links.length > 1 && (
                <div className="bg-gradient-to-r from-gray-50/50 to-white px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {companies.from || 1} to {companies.to || companies.data.length} of {companies.total || companies.data.length} results
                    </div>
                    <div className="flex gap-1">
                      {companies.links.map((link, index) => (
                        <button
                          key={index}
                          disabled={!link.url}
                          onClick={() => link.url && router.visit(link.url)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                            link.active
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent shadow-md'
                              : link.url
                              ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company Modal */}
          {selectedCompany && (
            <CompanyModal
              company={selectedCompany}
              isOpen={!!selectedCompany}
              onClose={() => setSelectedCompany(null)}
            />
          )}
        </main>
  );
}

function CompanyModal({ company, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Company Details</h3>
                <p className="text-blue-100 text-sm">Complete company and owner information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Company Information</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Company Name</p>
                      <p className="text-gray-900 font-semibold">{company.company_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email Address</p>
                      <p className="text-gray-900">{company.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Contact Number</p>
                      <p className="text-gray-900">{company.contact_number}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Address</p>
                      <p className="text-gray-900">
                        {company.street}, {company.barangay}<br />
                        {company.municipality}, {company.province}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Factory className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Industry Type</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-1">
                        {company.industry_type || company.setup_industry}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Products/Services</p>
                      <p className="text-gray-900">{company.products}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner & Employee Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Owner Information</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Owner Name</p>
                      <p className="text-gray-900 font-semibold">{company.owner_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gender</p>
                      <p className="text-gray-900">{company.sex}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">District</p>
                      <p className="text-gray-900">{company.district}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Employee Statistics</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-2xl font-bold text-purple-600">{company.male}</p>
                    <p className="text-xs text-gray-600">Indirect Male Employees</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-2xl font-bold text-purple-600">{company.female}</p>
                    <p className="text-xs text-gray-600">Indirect Female Employees</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-2xl font-bold text-purple-600">{company.direct_male}</p>
                    <p className="text-xs text-gray-600">Direct Male Employees</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-2xl font-bold text-purple-600">{company.direct_female}</p>
                    <p className="text-xs text-gray-600">Direct Female Employees</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
            <Link
              href={`/companies/${company.company_id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit Company
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}