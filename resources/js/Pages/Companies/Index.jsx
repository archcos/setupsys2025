import { Link, router, Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
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
  ArrowUpDown,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

export default function Index({ companies, filters, allUsers = [], allOffices = [] }) {
  const [search, setSearch] = useState(filters.search || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [officeFilter, setOfficeFilter] = useState(filters.office || '');
  const [setupIndustryFilter, setSetupIndustryFilter] = useState(filters.setup_industry || '');
  const [industryTypeFilter, setIndustryTypeFilter] = useState(filters.industry_type_filter || '');
  const [filterOpen, setFilterOpen] = useState(false);

  const [openDropdownCompanyId, setOpenDropdownCompanyId] = useState(null);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  const { auth } = usePage().props;
  const role = auth?.user?.role;

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/companies', { 
        search,
        office: officeFilter,
        setup_industry: setupIndustryFilter,
        industry_type: industryTypeFilter,
        sort: filters.sort || 'company_name',
        direction: filters.direction || 'asc',
        perPage 
      }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search, officeFilter, setupIndustryFilter, industryTypeFilter]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleDeleteClick = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      router.delete(`/companies/${companyToDelete.company_id}`);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCompanyToDelete(null);
  };

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/companies', {
      search,
      perPage: newPerPage,
      office: officeFilter,
      setup_industry: setupIndustryFilter,
      industry_type: industryTypeFilter,
      sort: filters.sort || 'company_name',
      direction: filters.direction || 'asc',
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleSortToggle = () => {
    const newDirection = (filters.direction === 'asc') ? 'desc' : 'asc';
    router.get('/companies', {
      search,
      perPage,
      office: officeFilter,
      setup_industry: setupIndustryFilter,
      industry_type: industryTypeFilter,
      sort: 'company_name',
      direction: newDirection,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleOfficeChange = (e) => {
    setOfficeFilter(e.target.value);
  };

  const handleSetupIndustryChange = (e) => {
    setSetupIndustryFilter(e.target.value);
  };

  const handleIndustryTypeChange = (e) => {
    setIndustryTypeFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setSetupIndustryFilter('');
    setIndustryTypeFilter('');
    setFilterOpen(false);
    router.get('/companies', { perPage }, { preserveState: true });
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Companies" />
      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <Building className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gray-900">Companies</h2>
              </div>
              
              <Link
                href="/companies/create"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Company</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search Bar and Per Page - Mobile Stack */}
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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
                <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm">
                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-xs md:text-sm text-gray-700">items</span>
                </div>
              </div>

              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="md:hidden flex items-center justify-between px-3 py-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Filters</span>
                </div>
                {(officeFilter || setupIndustryFilter || industryTypeFilter) && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                    {(officeFilter ? 1 : 0) + (setupIndustryFilter ? 1 : 0) + (industryTypeFilter ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Filter Row - Responsive */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 ${filterOpen ? 'block' : 'hidden md:grid'}`}>
                {/* Office Filter */}
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 border border-gray-300 shadow-sm">
                  <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={officeFilter}
                    onChange={handleOfficeChange}
                    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 w-full"
                  >
                    <option value="">All Offices</option>
                    {allOffices.map((office) => (
                      <option key={office.office_id} value={office.office_id}>
                        {office.office_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry Type Filter */}
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 border border-gray-300 shadow-sm">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={industryTypeFilter}
                    onChange={handleIndustryTypeChange}
                    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 w-full"
                  >
                    <option value="">All Types</option>
                    <option value="MICRO">MICRO</option>
                    <option value="SMALL">SMALL</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>

                {/* Setup Industry Filter */}
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 border border-gray-300 shadow-sm">
                  <Factory className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={setupIndustryFilter}
                    onChange={handleSetupIndustryChange}
                    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 w-full"
                  >
                    <option value="">All Industries</option>
                    <optgroup label="Major Sectors">
                      <option value="Agriculture/Aquaculture/Forestry">Agriculture</option>
                      <option value="Creative Industry">Creative Industry</option>
                      <option value="Energy and Environment">Energy</option>
                      <option value="Food Processing">Food Processing</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Gifts, Decors, Handicrafts">Gifts & Handicrafts</option>
                      <option value="Health and Wellness">Health & Wellness</option>
                      <option value="Metals and Engineering">Metals & Engineering</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Active Filters and Clear Button */}
              {(search || officeFilter || setupIndustryFilter || industryTypeFilter) && (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-600">Active:</span>
                    {officeFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <Building className="w-3 h-3" />
                        <span className="hidden sm:inline">Office</span>
                      </span>
                    )}
                    {industryTypeFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        Type
                      </span>
                    )}
                    {setupIndustryFilter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium truncate">
                        <span className="truncate max-w-[100px]">{setupIndustryFilter.substring(0, 10)}...</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Section - Responsive */}
          <div>
            {companies.data.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <button
                            onClick={handleSortToggle}
                            className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                          >
                            <Building className="w-4 h-4" />
                            Company
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
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
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {companies.data.map((company) => (
                        <tr key={company.company_id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{company.company_name}</div>
                              <div className="text-xs text-gray-500">ID: {company.company_id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 font-medium">{company.owner_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-900">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {company.email}
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {company.contact_number}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>{company.street}, {company.barangay}</div>
                            <div className="text-gray-600">{company.municipality}, {company.province}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {company.setup_industry || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedCompany(company)}
                                className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
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
                                onClick={() => handleDeleteClick(company)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete Company"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Simple List View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {companies.data.map((company) => (
                    <div key={company.company_id} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{company.company_name}</h3>
                        <p className="text-xs text-gray-500 truncate mt-1">ID: {company.company_id}</p>
                      </div>

                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => setSelectedCompany(company)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/companies/${company.company_id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit Company"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteClick(company)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No companies found</h3>
                    <p className="text-xs md:text-sm text-gray-500">Get started by adding your first company</p>
                  </div>
                  <Link
                    href="/companies/create"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Company
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {companies.links && companies.links.length > 1 && (
            <div className="bg-gradient-to-r from-gray-50/50 to-white px-4 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {companies.from || 1} to {companies.to || companies.data.length} of {companies.total || companies.data.length} results
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {companies.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && companyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Delete Company
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  Are you sure you want to delete <span className="font-semibold">{companyToDelete.company_name}</span>?
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4 md:mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CompanyModal({ company, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-xl font-bold truncate">Company Details</h3>
                <p className="text-xs md:text-sm text-blue-100">Information & overview</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Company Info */}
            <div className="space-y-4 md:space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg md:rounded-xl p-4 md:p-5 border border-blue-200">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900">Company Info</h4>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Company Name</p>
                      <p className="text-sm md:text-base text-gray-900 font-semibold truncate">{company.company_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Email</p>
                      <p className="text-xs md:text-sm text-gray-900 truncate">{company.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-xs md:text-sm text-gray-900">{company.contact_number}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Address</p>
                      <p className="text-xs md:text-sm text-gray-900">
                        {company.street}, {company.barangay}<br />
                        {company.municipality}, {company.province}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Factory className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Industry Type</p>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        {company.industry_type || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Factory className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Setup Industry</p>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        {company.setup_industry || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Products/Services</p>
                      <p className="text-xs md:text-sm text-gray-900">{company.products || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner & Employee Info */}
            <div className="space-y-4 md:space-y-6">
              {/* Owner Info */}
              <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg md:rounded-xl p-4 md:p-5 border border-green-200">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900">Owner</h4>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Name</p>
                      <p className="text-sm md:text-base text-gray-900 font-semibold">{company.owner_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Gender</p>
                      <p className="text-xs md:text-sm text-gray-900">{company.sex || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">District</p>
                      <p className="text-xs md:text-sm text-gray-900">{company.district || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Stats */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg md:rounded-xl p-4 md:p-5 border border-purple-200">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900">Employees</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="text-center p-2 md:p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-lg md:text-2xl font-bold text-purple-600">{company.male || 0}</p>
                    <p className="text-xs text-gray-600">Indirect Male</p>
                  </div>
                  <div className="text-center p-2 md:p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-lg md:text-2xl font-bold text-purple-600">{company.female || 0}</p>
                    <p className="text-xs text-gray-600">Indirect Female</p>
                  </div>
                  <div className="text-center p-2 md:p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-lg md:text-2xl font-bold text-purple-600">{company.direct_male || 0}</p>
                    <p className="text-xs text-gray-600">Direct Male</p>
                  </div>
                  <div className="text-center p-2 md:p-3 bg-white rounded-lg border border-purple-100">
                    <p className="text-lg md:text-2xl font-bold text-purple-600">{company.direct_female || 0}</p>
                    <p className="text-xs text-gray-600">Direct Female</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-b-lg md:rounded-b-2xl border-t border-gray-200 sticky bottom-0">
          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium order-2 md:order-1"
            >
              Close
            </button>
            <Link
              href={`/companies/${company.company_id}/edit`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm order-1 md:order-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}