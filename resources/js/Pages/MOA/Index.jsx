import React, { useState, useEffect, useRef } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import { Search, FileText, Download, Building2, User, Calendar, Users, X, ArrowUpDown, Upload, FileCheck, AlertCircle, Eye, Hash, ClipboardList, Building, Files } from 'lucide-react';
import { cleanParams } from '@/utils/cleanParams';
import PaginationLinks from '@/components/PaginationLinks';

// ─── File Preview Modal ───────────────────────────────────────────────────────

function FilePreviewModal({ preview, onClose }) {
  if (!preview.show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <h3 className="text-sm md:text-base font-semibold text-slate-900 truncate">{preview.label}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {preview.downloadHref && (
              <a
                href={preview.downloadHref}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-auto bg-slate-50 p-2 md:p-4">
          <iframe
            src={preview.url}
            className="w-full h-[72vh] rounded-lg border border-slate-200 bg-white"
            title={preview.label}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Index({ moas, filters, years, offices }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'created_at');
  const [sortOrder, setSortOrder] = useState(filters?.sortOrder || 'desc');
  const [officeFilter, setOfficeFilter] = useState(filters?.officeFilter || '');
  const [yearFilter, setYearFilter] = useState(filters?.yearFilter || '');
  const [uploadingMoaId, setUploadingMoaId] = useState(null);
  const isFirstRender = useRef(true);
  const debounceTimer = useRef(null);

  // ── Preview modal state ──
  const [preview, setPreview] = useState({ show: false, url: null, label: null, downloadHref: null });

  const openPreview = (moaId, label, downloadHref) => {
    const url = `/moa/${moaId}/view-approved`;
    setPreview({ show: true, url, label, downloadHref });
  };
  const closePreview = () => setPreview({ show: false, url: null, label: null, downloadHref: null });

  const { auth, flash } = usePage().props;
  const canUpload = auth?.user?.role === 'staff' || auth?.user?.role === 'rpmo';

  const pushRouter = (overrides = {}) =>
    router.get('/moa',
      cleanParams(
        { search, perPage, sortBy, sortOrder, officeFilter, yearFilter, ...overrides },
        { perPage: 10, sortBy: 'created_at', sortOrder: 'desc' }
      ),
      { preserveState: true, preserveScroll: true, replace: true }
    );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => pushRouter(), 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    pushRouter({ perPage: newPerPage, page: 1 });
  };

  const handleSort = (column) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    pushRouter({ sortBy: column, sortOrder: newSortOrder });
  };

  const handleOfficeChange = (e) => {
    const val = e.target.value;
    setOfficeFilter(val);
    pushRouter({ officeFilter: val, page: 1 });
  };

  const handleYearChange = (e) => {
    const val = e.target.value;
    setYearFilter(val);
    pushRouter({ yearFilter: val, page: 1 });
  };

  const handleClear = () => {
    setSearch('');
    setOfficeFilter('');
    setYearFilter('');
    setPerPage(10);
    router.get('/moa', {}, { preserveState: true, replace: true });
  };

  const handleFileUpload = (moaId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed'); e.target.value = ''; return; }
    const formData = new FormData();
    formData.append('approved_file', file);
    setUploadingMoaId(moaId);
    router.post(`/moa/${moaId}/upload-approved`, formData, {
      preserveScroll: true,
      onSuccess: () => { e.target.value = ''; setUploadingMoaId(null); },
      onError:   () => setUploadingMoaId(null),
      onFinish:  () => setUploadingMoaId(null),
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => `₱${parseFloat(amount).toLocaleString()}`;

  const getSortIcon = (column) => (
    <ArrowUpDown className={`w-3 h-3 ${sortBy === column ? '' : 'text-gray-400'}`} />
  );

  
  const hasFilters = !!(search || officeFilter || yearFilter);

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen">
      <Head title="MOA List" />
      <div className="max-w-8xl mx-auto">

        {/* Flash Messages */}
        {flash?.success && (
          <div className="mb-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-xs md:text-sm">
            <FileCheck className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />{flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-xs md:text-sm">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />{flash.error}
          </div>
        )}

        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-start md:items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">MOA Management</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Upload approved PDF files for MOA records</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            {/* Search + Per Page */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by project id, proponent name, project title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-8 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm w-fit">
                <select
                  value={perPage}
                  onChange={handlePerPageChange}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2"
                >
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>
            </div>

            {/* Office + Year + Clear */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-wrap">
              {offices && offices.length > 1 && (
                <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-1 md:flex-initial md:min-w-[200px]">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={officeFilter}
                    onChange={handleOfficeChange}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2"
                  >
                    <option value="">All Offices</option>
                    {offices.map((office) => (
                      <option key={office.office_id} value={office.office_id}>{office.office_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {years && years.length > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-1 md:flex-initial md:min-w-[160px]">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={yearFilter}
                    onChange={handleYearChange}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2"
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasFilters && (
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Hash className="w-4 h-4" /> PROJECT CODE</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button onClick={() => handleSort('project_cost')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                      <ClipboardList className="w-4 h-4" /> PROJECT {getSortIcon('project_cost')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Building className="w-4 h-4" /> Proponent Representative</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Witness</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /> Project Director</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button onClick={() => handleSort('created_at')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                      <Calendar className="w-4 h-4" /> DATE CREATED {getSortIcon('created_at')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2"><FileText className="w-4 h-4" />Files</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {moas.data.map((moa) => (
                  <tr key={moa.moa_id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200">
                    <td className="px-6 py-4 text-sm justify-center text-gray-900 text-center">{moa.project?.project_id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 mb-1">{moa.project?.project_title}</div>
                      <div className="text-xs text-gray-500">Cost: {formatCurrency(moa.project_cost)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{moa.owner_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{moa.witness}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{moa.pd_name}</div>
                      <div className="text-xs text-gray-500">{moa.pd_title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(moa.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                        {/* Draft */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
                          <span className="text-xs text-gray-600 font-medium">Draft:</span>
                          <a href={`/moa/${moa.moa_id}/docx`}
                            className="flex items-center gap-1 p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                            title="Download Draft MOA">
                            <Download className="w-4 h-4" />
                            <span className="text-xs font-medium">Download</span>
                          </a>
                        </div>
                        {/* Signed PDF */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600 font-medium">Signed PDF:</span>
                            {moa.approved_file_path && <FileCheck className="w-3 h-3 text-green-600" />}
                          </div>
                          <div className="flex items-center gap-1">
                            {moa.approved_file_path && (
                              <button
                                onClick={() => openPreview(
                                  moa.moa_id,
                                  `Signed PDF — ${moa.project?.project_title || moa.project?.project_id}`,
                                  `/moa/${moa.moa_id}/download-approved`
                                )}
                                className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-all"
                                title="View Approved PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {moa.approved_file_path && (
                              <a href={`/moa/${moa.moa_id}/download-approved`}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all"
                                title="Download Approved PDF">
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            {canUpload && (
                              <label
                                className={`flex items-center gap-1 p-1.5 rounded transition-all ${
                                  uploadingMoaId === moa.moa_id
                                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer'
                                }`}
                                title={uploadingMoaId === moa.moa_id ? 'Uploading...' : moa.approved_file_path ? 'Reupload Approved PDF' : 'Upload Approved PDF'}
                              >
                                {uploadingMoaId === moa.moa_id
                                  ? <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                  : <Upload className="w-4 h-4" />}
                                <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(moa.moa_id, e)}
                                  disabled={uploadingMoaId === moa.moa_id} className="hidden" />
                              </label>
                            )}
                          </div>
                        </div>
                        {moa.approved_file_path && (
                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                            <div>Uploaded: {formatDate(moa.approved_file_uploaded_at)}</div>
                            {moa.approved_by_user && <div>By: {moa.approved_by_user.name}</div>}
                          </div>
                        )}
                        {canUpload && !moa.approved_file_path && (
                          <div className="text-xs text-blue-600 pt-2 border-t border-gray-200 flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>Upload approved PDF when ready</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {moas.data.map((moa) => (
              <div key={moa.moa_id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                    {moa.project?.project_id}
                  </span>
                </div>
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{moa.project?.project_title}</h3>
                  <p className="text-xs text-gray-500">Cost: {formatCurrency(moa.project_cost)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-xs font-medium text-blue-900">Draft</span>
                    <a href={`/moa/${moa.moa_id}/docx`}
                      className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-all text-xs font-medium">
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-medium text-blue-900 whitespace-nowrap">Signed PDF</span>
                      {moa.approved_file_path && <FileCheck className="w-3 h-3 text-green-600 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {moa.approved_file_path && (
                        <button
                          onClick={() => openPreview(
                            moa.moa_id,
                            `Signed PDF — ${moa.project?.project_title || moa.project?.project_id}`,
                            `/moa/${moa.moa_id}/download-approved`
                          )}
                          className="p-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded transition-all"
                          title="View Approved PDF"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                      {moa.approved_file_path && (
                        <a href={`/moa/${moa.moa_id}/download-approved`}
                          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-all">
                          <Download className="w-3 h-3" />
                        </a>
                      )}
                      {canUpload && (
                        <label className={`flex items-center p-1 rounded transition-all ${
                          uploadingMoaId === moa.moa_id ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer'
                        }`}>
                          {uploadingMoaId === moa.moa_id
                            ? <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                            : <Upload className="w-3 h-3" />}
                          <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(moa.moa_id, e)}
                            disabled={uploadingMoaId === moa.moa_id} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                  {moa.approved_file_path && (
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                      <div>Uploaded: {formatDate(moa.approved_file_uploaded_at)}</div>
                      {moa.approved_by_user && <div>By: {moa.approved_by_user.name}</div>}
                    </div>
                  )}
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
                {hasFilters && (
                  <button onClick={handleClear}
                    className="px-3 md:px-4 py-2 bg-blue-500 text-white text-xs md:text-sm rounded-lg hover:bg-blue-600 transition-colors">
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {moas.links && moas.links.length > 1 && (
            <PaginationLinks
              links={moas.links}
              from={moas.from}
              to={moas.to}
              total={moas.total}
            />
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal preview={preview} onClose={closePreview} />
    </main>
  );
}