import React, { useState, useEffect } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import {
  Search,
  FileText,
  Download,
  Building2,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  X,
  ArrowUpDown
} from 'lucide-react';

export default function MOAIndex({ moas, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'created_at');
  const [sortOrder, setSortOrder] = useState(filters?.sortOrder || 'desc');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { auth } = usePage().props;
  const isStaff = auth?.user?.role === 'staff';

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get('/moa', { 
        search,
        sortBy,
        sortOrder,
        perPage
      }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get('/moa', {
      search,
      perPage: newPerPage,
      sortBy,
      sortOrder,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleSort = (column) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    router.get('/moa', {
      search,
      perPage,
      sortBy: column,
      sortOrder: newSortOrder,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const getStatusBadge = (progress) => {
    const isImplementation = progress === 'Implementation';
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
        isImplementation 
          ? 'bg-green-100 text-green-800' 
          : 'bg-amber-100 text-amber-800'
      }`}>
        {isImplementation ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        {progress || 'Draft MOA'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString()}`;
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUpDown className="w-3 h-3 text-purple-600" />
      : <ArrowUpDown className="w-3 h-3 text-purple-600 rotate-180" />;
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="MOA List" />

      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">MOA Management</h2>
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
                  placeholder="Search by company name or project title ..."
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
                    <button 
                      onClick={() => handleSort('project_cost')}
                      className="flex items-center gap-2 hover:text-purple-600 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Project
                      {getSortIcon('project_cost')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Rep
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Witness
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Project Director
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('created_at')}
                      className="flex items-center gap-2 hover:text-purple-600 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Date Created
                      {getSortIcon('created_at')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status & Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {moas.data.map((moa) => (
                  <tr key={moa.moa_id} className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-transparent transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {moa.project?.project_title}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cost: {formatCurrency(moa.project_cost)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {moa.owner_name || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {moa.witness}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900 font-medium">
                          {moa.pd_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {moa.pd_title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(moa.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Status Badge */}
                        <div className="mb-2">
                          {getStatusBadge(moa.project?.progress)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Acknowledgment Toggle */}
                          <label
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isStaff 
                                ? 'cursor-pointer hover:bg-gray-100' 
                                : 'cursor-not-allowed opacity-50'
                            }`}
                            title={!isStaff ? "Only PSTO staff can acknowledge this" : ""}
                          >
                            <input
                              type="checkbox"
                              checked={moa.project?.progress === 'Implementation'}
                              disabled={!isStaff}
                              onChange={(e) => {
                                const newProgress = e.target.checked ? 'Implementation' : 'Draft MOA';
                                router.put(`/projects/${moa.project?.project_id}/progress`, {
                                  progress: newProgress,
                                }, { preserveState: true });
                              }}
                              className={`w-3 h-3 rounded border transition-all ${
                                isStaff 
                                  ? 'border-gray-300 text-green-600 focus:ring-green-500' 
                                  : 'border-gray-200 cursor-not-allowed'
                              }`}
                            />
                            <span className={`${
                              moa.project?.progress === 'Implementation'
                                ? 'text-green-700'
                                : 'text-blue-600'
                            }`}>
                              {moa.project?.progress === 'Implementation' ? 'Ack.' : 'Mark'}
                            </span>
                          </label>

                          {/* Download Button */}
                          <a 
                            href={`/moa/${moa.moa_id}/docx`}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Download MOA"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {moas.data.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No MOAs found</h3>
                    <p className="text-gray-500 text-sm">
                      {search ? `No MOAs match your search "${search}"` : 'No MOAs have been generated yet'}
                    </p>
                  </div>
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {moas.links && moas.links.length > 1 && (
            <div className="bg-gradient-to-r from-gray-50/50 to-white px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {moas.from || 1} to {moas.to || moas.data.length} of {moas.total || moas.data.length} results
                </div>
                <div className="flex gap-1">
                  {moas.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                        link.active
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-transparent shadow-md'
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
    </main>
  );
}