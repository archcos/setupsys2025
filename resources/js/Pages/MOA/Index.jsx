import React, { useState, useEffect } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import {
  Search,
  FileText,
  Download,
  Building2,
  User,
  Calendar,
  Users,
  X,
  ArrowUpDown,
  Upload,
  FileCheck,
  AlertCircle,
  Eye
} from 'lucide-react';

export default function MOAIndex({ moas, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'created_at');
  const [sortOrder, setSortOrder] = useState(filters?.sortOrder || 'desc');
  const [uploadingMoaId, setUploadingMoaId] = useState(null);

  const { auth, flash } = usePage().props;
  const canUpload = auth?.user?.role === 'staff' || auth?.user?.role === 'rpmo';

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

  const handleFileUpload = (moaId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('approved_file', file);

    setUploadingMoaId(moaId);

    router.post(`/moa/${moaId}/upload-approved`, formData, {
      preserveScroll: true,
      onSuccess: () => {
        e.target.value = '';
        setUploadingMoaId(null);
      },
      onError: () => {
        setUploadingMoaId(null);
      },
      onFinish: () => {
        setUploadingMoaId(null);
      },
    });
  };

  const handleViewPDF = (moaId) => {
    window.open(`/moa/${moaId}/view-approved`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Flash Messages */}
        {flash?.success && (
          <div className="mb-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-xs md:text-sm">
            <FileCheck className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-xs md:text-sm">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            {flash.error}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-start md:items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">MOA Management</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Upload approved PDF files for MOA records
                </p>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-2 md:gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                <input
                  type="text"
                  placeholder="Search by company or project ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
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
                <span className="text-xs md:text-sm text-gray-700 whitespace-nowrap">entries</span>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
                    Files
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {moas.data.map((moa) => (
                  <tr key={moa.moa_id} className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-transparent transition-all duration-200">
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
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                          {/* Draft File Actions */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
                            <span className="text-xs text-gray-600 font-medium">Draft:</span>
                            <a 
                              href={`/moa/${moa.moa_id}/docx`}
                              className="flex items-center gap-1 p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                              title="Download Draft MOA"
                            >
                              <Download className="w-4 h-4" />
                              <span className="text-xs font-medium">Download</span>
                            </a>
                          </div>

                          {/* Approved File Section */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600 font-medium">Signed PDF:</span>
                              {moa.approved_file_path && (
                                <FileCheck className="w-3 h-3 text-green-600" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {/* View PDF Button */}
                              {moa.approved_file_path && (
                                <button
                                  onClick={() => handleViewPDF(moa.moa_id)}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-all"
                                  title="View Approved PDF"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}

                              {/* Download Approved File */}
                              {moa.approved_file_path && (
                                <a 
                                  href={`/moa/${moa.moa_id}/download-approved`}
                                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all"
                                  title="Download Approved PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}

                              {/* Upload/Reupload Button (Staff & RPMO) */}
                              {canUpload && (
                                <label
                                  className={`flex items-center gap-1 p-1.5 rounded transition-all ${
                                    uploadingMoaId === moa.moa_id
                                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                      : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 cursor-pointer'
                                  }`}
                                  title={
                                    uploadingMoaId === moa.moa_id
                                      ? "Uploading..."
                                      : moa.approved_file_path 
                                      ? "Reupload Approved PDF" 
                                      : "Upload Approved PDF"
                                  }
                                >
                                  {uploadingMoaId === moa.moa_id ? (
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4" />
                                  )}

                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handleFileUpload(moa.moa_id, e)}
                                    disabled={uploadingMoaId === moa.moa_id}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Approved File Info */}
                          {moa.approved_file_path && (
                            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                              <div>Uploaded: {formatDate(moa.approved_file_uploaded_at)}</div>
                              {moa.approved_by_user && (
                                <div>By: {moa.approved_by_user.name}</div>
                              )}
                            </div>
                          )}

                          {/* Help Text */}
                          {canUpload && !moa.approved_file_path && (
                            <div className="text-xs text-blue-600 pt-2 border-t border-gray-200 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>Upload approved PDF when ready</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {moas.data.map((moa) => (
              <div key={moa.moa_id} className="p-3 hover:bg-gray-50 transition-colors">
                {/* Project Header */}
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                    {moa.project?.project_title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cost: {formatCurrency(moa.project_cost)}
                  </p>
                </div>

                {/* Files Section */}
                <div className="space-y-2">
                  {/* Draft File */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-xs font-medium text-blue-900">Draft</span>
                    <a 
                      href={`/moa/${moa.moa_id}/docx`}
                      className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-all text-xs font-medium"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  </div>

                  {/* Approved File */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-medium text-purple-900 whitespace-nowrap">Signed PDF</span>
                      {moa.approved_file_path && (
                        <FileCheck className="w-3 h-3 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {moa.approved_file_path && (
                        <button
                          onClick={() => handleViewPDF(moa.moa_id)}
                          className="p-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded transition-all"
                          title="View PDF"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}

                      {moa.approved_file_path && (
                        <a 
                          href={`/moa/${moa.moa_id}/download-approved`}
                          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-all"
                          title="Download PDF"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      )}

                      {canUpload && (
                        <label
                          className={`flex items-center p-1 rounded transition-all ${
                            uploadingMoaId === moa.moa_id
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-purple-600 hover:text-purple-700 hover:bg-purple-100 cursor-pointer'
                          }`}
                          title={uploadingMoaId === moa.moa_id ? "Uploading..." : "Upload PDF"}
                        >
                          {uploadingMoaId === moa.moa_id ? (
                            <div className="w-3 h-3 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}

                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(moa.moa_id, e)}
                            disabled={uploadingMoaId === moa.moa_id}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* File Info */}
                  {moa.approved_file_path && (
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                      <div>Uploaded: {formatDate(moa.approved_file_uploaded_at)}</div>
                      {moa.approved_by_user && (
                        <div>By: {moa.approved_by_user.name}</div>
                      )}
                    </div>
                  )}

                  {/* Help Text */}
                  {canUpload && !moa.approved_file_path && (
                    <div className="text-xs text-blue-600 p-2 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>Upload approved PDF when ready</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {moas.data.length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No MOAs found</h3>
                  <p className="text-xs md:text-sm text-gray-500">
                    {search ? `No MOAs match your search "${search}"` : 'No MOAs have been generated yet'}
                  </p>
                </div>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-3 md:px-4 py-2 bg-purple-500 text-white text-xs md:text-sm rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {moas.links && moas.links.length > 1 && (
            <div className="bg-gradient-to-r from-gray-50/50 to-white px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {moas.from || 1} to {moas.to || moas.data.length} of {moas.total || moas.data.length}
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {moas.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
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