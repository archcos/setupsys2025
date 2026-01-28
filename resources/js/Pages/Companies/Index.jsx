import { Link, router, Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Eye, Edit3, Trash2, Building, User, Mail, Phone, MapPin, Factory, Package, X, Filter, ArrowUpDown, AlertCircle } from 'lucide-react';


export default function Index({ companies, filters, allUsers = [], allOffices = [], canEditAddedBy = false }) {
  const [search, setSearch] = useState(filters.search || '');
  const [perPage, setPerPage] = useState(filters.perPage || 10);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [officeFilter, setOfficeFilter] = useState(filters.office || '');
  const [setupIndustryFilter, setSetupIndustryFilter] = useState(filters.setup_industry || '');
  const [industryTypeFilter, setIndustryTypeFilter] = useState(filters.industry_type_filter || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [editingAddedBy, setEditingAddedBy] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const filterTimeoutRef = useRef(null);
  const isInitialRenderRef = useRef(true);
  const dropdownRef = useRef(null);

    useEffect(() => {
    // Skip on initial render
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = setTimeout(() => {
      router.get('/proponents', { 
        search,
        office: officeFilter,
        setup_industry: setupIndustryFilter,
        industry_type: industryTypeFilter,
        sort: filters.sort || 'company_name',
        direction: filters.direction || 'asc',
        perPage,
        page: 1  // Reset to page 1 when filters change
      }, { preserveState: true, replace: true, preserveScroll: true, only: ['proponents'] });
    }, 400);

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [search, officeFilter, setupIndustryFilter, industryTypeFilter]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
        setEditingAddedBy(null);
        setShowUserDropdown(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown]);
  
  const handleDeleteClick = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      router.delete(`/proponents/${companyToDelete.company_id}`);
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
    router.get('/proponents', {
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
    router.get('/proponents', {
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
    router.get('/proponents', { perPage }, { preserveState: true });
  };

  const handleUpdateAddedBy = (companyId, userId) => {
    router.post(`/proponents/${companyId}/update-added-by`, { added_by: userId }, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingAddedBy(null);
        setUserSearch('');
        setShowUserDropdown(false);
      }
    });
  };

  const filteredUsers = allUsers ? allUsers.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(userSearch.toLowerCase())
  ) : [];

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Proponents" />
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
                <h2 className="text-base md:text-xl font-semibold text-gray-900">Proponents</h2>
              </div>
              <button
                onClick={() => router.post('/proponents/sync')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
                title="Sync from CSV"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Sync CSV</span>
                <span className="sm:hidden">Sync</span>
              </button>
              <Link
                href="/proponents/create"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Proponent</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

        {/* Filters Section */}
        <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Search Bar and Per Page */}
            <div className="flex flex-col gap-2 md:gap-4 md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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
              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm w-fit">
                <select
                  value={perPage}
                  onChange={handlePerPageChange}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">items</span>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center flex-wrap">
              {/* Office Filter */}
              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={officeFilter}
                  onChange={handleOfficeChange}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
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
              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={industryTypeFilter}
                  onChange={handleIndustryTypeChange}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
                >
                  <option value="">All Types</option>
                  <option value="MICRO">MICRO</option>
                  <option value="SMALL">SMALL</option>
                  <option value="MEDIUM">MEDIUM</option>
                </select>
              </div>

     {/* Setup Industry Filter */}
      <div className="flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-3 md:px-4 border border-gray-300 shadow-sm">
        <Factory className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <select
          value={setupIndustryFilter}
          onChange={handleSetupIndustryChange}
          className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2 md:py-2.5"
        >
          <option value="">All Industries</option>
          <optgroup label="Major Industry Sectors">
            <option value="Agriculture/Aquaculture/Forestry">Agriculture / Aquaculture / Forestry</option>
            <option value="Creative Industry">Creative Industry</option>
            <option value="Energy and Environment">Energy and Environment</option>
            <option value="Food Processing">Food Processing</option>
            <option value="Furniture">Furniture</option>
            <option value="Gifts, Decors, Handicrafts">Gifts, Decors, Handicrafts</option>
            <option value="Health and Wellness">Health and Wellness</option>
            <option value="Metals and Engineering">Metals and Engineering</option>
            <option value="Other Regional Priority Sectors">Other Regional Priority Sectors</option>
          </optgroup>
          <optgroup label="Sub-Industries / Manufacturing">
            <option value="Crop and animal production, hunting, and related service activities">Crop & Animal Production</option>
            <option value="Forestry and Logging">Forestry & Logging</option>
            <option value="Fishing and aquaculture">Fishing & Aquaculture</option>
            <option value="Food processing">Food Processing</option>
            <option value="Beverage manufacturing">Beverage Manufacturing</option>
            <option value="Textile manufacturing">Textile Manufacturing</option>
            <option value="Wearing apparel manufacturing">Wearing Apparel</option>
            <option value="Leather and related products manufacturing">Leather Products</option>
            <option value="Wood and products of wood and cork manufacturing">Wood & Cork Products</option>
            <option value="Paper and paper products manufacturing">Paper & Paper Products</option>
            <option value="Chemicals and chemical products manufacturing">Chemicals & Chemical Products</option>
            <option value="Basic pharmaceutical products and pharmaceutical preparations manufacturing">Pharmaceutical Products</option>
            <option value="Rubber and plastic products manufacturing">Rubber & Plastic Products</option>
            <option value="Non-metallic mineral products manufacturing">Non-metallic Minerals</option>
            <option value="Fabricated metal products manufacturing">Fabricated Metal Products</option>
            <option value="Machinery and equipment, Not Elsewhere Classified (NEC) manufacturing">Machinery & Equipment (NEC)</option>
            <option value="Other transport equipment manufacturing">Transport Equipment</option>
            <option value="Furniture manufacturing">Furniture Manufacturing</option>
            <option value="Information and Communication">Information & Communication</option>
            <option value="Other regional priority industries approved by the Regional Development Council">Regional Priority Industries</option>
          </optgroup>
        </select>
      </div>

              {/* Clear Filters Button */}
              {(search || officeFilter || setupIndustryFilter || industryTypeFilter) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors shadow-sm text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden md:inline">Clear Filters</span>
                </button>
              )}
            </div>
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
                        {canEditAddedBy && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              User
                            </div>
                          </th>
                        )}
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
                          <td className="px-6 py-4 max-w-[200px]">
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-900 overflow-hidden">
                                <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{company.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600 overflow-hidden">
                                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{company.contact_number}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>{company.street}, {company.barangay}</div>
                            <div className="text-gray-600">{company.municipality}, {company.province}</div>
                          </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-[120px]" title={company.setup_industry || 'N/A'}>
                            {company.setup_industry || 'N/A'}
                          </span>
                        </td>
                          {canEditAddedBy && (
                            <td className="px-6 py-4">
                              {editingAddedBy === company.company_id ? (
                                <div ref={dropdownRef} className="relative">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Search users..."
                                      value={userSearch}
                                      onChange={(e) => setUserSearch(e.target.value)}
                                      onFocus={() => setShowUserDropdown(true)}
                                      className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      autoFocus
                                    />
                                  </div>
                                  {showUserDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                                      {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                          <button
                                            key={user.user_id}
                                            onClick={() => {
                                              handleUpdateAddedBy(company.company_id, user.user_id);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                          >
                                            {user.first_name} {user.last_name}
                                          </button>
                                        ))
                                      ) : (
                                        <div className="px-3 py-2 text-xs text-gray-500">No users found</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingAddedBy(company.company_id);
                                    setUserSearch('');
                                    setShowUserDropdown(true);
                                  }}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                                >
                                  {company.added_by_user?.name || 'Unassigned'}
                                </button>
                              )}
                            </td>
                          )}
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
                                href={`/proponents/${company.company_id}/edit`}
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
                        {canEditAddedBy && (
                          <p className="text-xs text-amber-600 font-medium mt-1">Added by: {company.added_by_user?.name || 'Unassigned'}</p>
                        )}
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
                          href={`/proponents/${company.company_id}/edit`}
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
                    href="/proponents/create"
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

            {/* Owner Info */}
            <div className="space-y-4 md:space-y-6">
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
                    <Mail className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
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
              href={`/proponents/${company.company_id}/edit`}
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