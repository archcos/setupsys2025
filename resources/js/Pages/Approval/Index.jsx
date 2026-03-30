import React, { useState, useEffect } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import { Search, X, Building2, ArrowUpDown, Award, Calendar } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_STATUSES = ['All', 'Approved', 'Implementation', 'Liquidation', 'Refund', 'Completed'];

const STATUS_STYLES = {
  Approved:       { tab: 'bg-blue-500 text-white',    badge: 'bg-blue-100 text-blue-700 border border-blue-200'       },
  Implementation: { tab: 'bg-yellow-500 text-white',  badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  Liquidation:    { tab: 'bg-purple-500 text-white',  badge: 'bg-purple-100 text-purple-700 border border-purple-200' },
  Refund:         { tab: 'bg-orange-500 text-white',  badge: 'bg-orange-100 text-orange-700 border border-orange-200' },
  Completed:      { tab: 'bg-green-500 text-white',   badge: 'bg-green-100 text-green-700 border border-green-200'    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBadge({ status }) {
  const styles = STATUS_STYLES[status];
  if (!styles) return <span className="text-xs text-gray-500">{status}</span>;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${styles.badge}`}>
      {status}
    </span>
  );
}

function StatusTabs({ statusTab, statusCounts, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {ALL_STATUSES.map((status) => {
        const isActive    = statusTab === status;
        const count       = statusCounts?.[status] ?? 0;
        const activeStyle = status === 'All'
          ? 'bg-gray-700 text-white'
          : (STATUS_STYLES[status]?.tab ?? 'bg-gray-500 text-white');

        return (
          <button
            key={status}
            onClick={() => onChange(status)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? `${activeStyle} shadow-sm`
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ${
              isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SortButton({ field, label, sortField, sortDirection, onSort }) {
  const isActive = sortField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors group"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 transition-colors ${
        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-400'
      }`} />
    </button>
  );
}

function DownloadButton({ onClick, disabled, fullWidth = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all ${
        fullWidth ? 'w-full py-2 mt-1' : ''
      }`}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </button>
  );
}

function EmptyState({ hasActiveFilters, mobile = false }) {
  return (
    <div className={`px-4 text-center ${mobile ? 'py-8' : 'py-12'}`}>
      <svg className={`mx-auto text-gray-400 mb-3 ${mobile ? 'h-10 w-10' : 'h-12 w-12'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="text-sm font-medium text-gray-900">No projects found</h3>
      <p className="mt-1 text-xs text-gray-500">
        {hasActiveFilters ? 'Try adjusting your filters or clearing the search.' : 'No projects match the selected status.'}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApprovedProjects({ projects, offices, filters, statusCounts, availableYears, error: serverError }) {
  const [search,        setSearch]        = useState(filters?.search        || '');
  const [perPage,       setPerPage]       = useState(filters?.perPage       || 10);
  const [officeFilter,  setOfficeFilter]  = useState(filters?.officeFilter  || '');
  const [yearFilter,    setYearFilter]    = useState(filters?.yearFilter    || '');
  const [sortField,     setSortField]     = useState(filters?.sortField     || '');
  const [sortDirection, setSortDirection] = useState(filters?.sortDirection || 'asc');
  const [statusTab,     setStatusTab]     = useState(filters?.statusTab     || 'All');
  const [selected,      setSelected]      = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [formData,      setFormData]      = useState({ owner_lastname: '', position: '' });
  const [errors,        setErrors]        = useState({});
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const { errors: pageErrors } = usePage().props;

  // Debounced push for search input only
  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(
        route('approvals.index'),
        { search, perPage, officeFilter, yearFilter, sortField, sortDirection, statusTab },
        { preserveState: true, replace: true }
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const pushRouter = (overrides = {}) =>
    router.get(
      route('approvals.index'),
      { search, perPage, officeFilter, yearFilter, sortField, sortDirection, statusTab, ...overrides },
      { preserveScroll: true, preserveState: true }
    );

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    pushRouter({ sortField: field, sortDirection: newDirection });
  };

  const handlePerPageChange = (e) => {
    const val = e.target.value;
    setPerPage(val);
    pushRouter({ perPage: val });
  };

  const handleOfficeChange = (e) => {
    const val = e.target.value;
    setOfficeFilter(val);
    pushRouter({ officeFilter: val });
  };

  const handleYearChange = (e) => {
    const val = e.target.value;
    setYearFilter(val);
    pushRouter({ yearFilter: val });
  };

  const handleStatusTab = (tab) => {
    setStatusTab(tab);
    pushRouter({ statusTab: tab });
  };

  const handleClearFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setYearFilter('');
    setSortField('');
    setSortDirection('asc');
    setStatusTab('All');
    router.get(route('approvals.index'), { perPage }, { preserveState: true });
  };

  const handleOpenModal = (projectId) => {
    setFormData({ owner_lastname: '', position: '' });
    setErrors({});
    setDownloadProgress('');
    setSelected(projectId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelected(null);
    setFormData({ owner_lastname: '', position: '' });
    setErrors({});
    setDownloadProgress('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.owner_lastname.trim())           newErrors.owner_lastname = 'Owner last name is required';
    else if (formData.owner_lastname.length > 255) newErrors.owner_lastname = 'Owner last name is too long';
    if (!formData.position.trim())                 newErrors.position = 'Position is required';
    else if (formData.position.length > 255)       newErrors.position = 'Position is too long';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownload = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setDownloadProgress('Generating document...');

    try {
      const xsrfToken = decodeURIComponent(
        document.cookie
          .split('; ')
          .find(row => row.startsWith('XSRF-TOKEN='))
          ?.split('=')[1] ?? ''
      );

      const generateResponse = await fetch(route('approvals.generate', { project_id: selected }), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrfToken },
        body: JSON.stringify({ owner_lastname: formData.owner_lastname, position: formData.position }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        setErrors({ form: errorData.error || 'Failed to generate document' });
        setIsSubmitting(false);
        setDownloadProgress('');
        return;
      }

      const data = await generateResponse.json();

      if (!data.success || !data.downloadUrl) {
        setErrors({ form: 'Invalid response from server' });
        setIsSubmitting(false);
        setDownloadProgress('');
        return;
      }

      setDownloadProgress('Downloading file...');
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.click();

      setTimeout(() => {
        setIsSubmitting(false);
        setDownloadProgress('');
        handleCloseModal();
      }, 500);

    } catch (error) {
      console.error('Download error:', error);
      setErrors({ form: 'An error occurred. Please try again.' });
      setIsSubmitting(false);
      setDownloadProgress('');
    }
  };

  const hasActiveFilters = !!(search || officeFilter || yearFilter || statusTab !== 'All');
  const data             = projects?.data || [];
  const paginationData   = projects?.data ? projects : null;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
        <Head title="Approved Projects" />
  
        <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Approved Projects</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">View and download approval documents</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {(serverError || pageErrors?.error) && (
            <div className="mx-3 md:mx-6 mt-3 md:mt-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg md:rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-xs md:text-sm text-red-800">{serverError || pageErrors?.error}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            <StatusTabs statusTab={statusTab} statusCounts={statusCounts} onChange={handleStatusTab} />

            {/* Search + per-page */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search project, proponent, or owner..."
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
              {offices && offices.length > 0 && (
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

              {availableYears && availableYears.length > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-1 md:flex-initial md:min-w-[160px]">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={yearFilter}
                    onChange={handleYearChange}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2"
                  >
                    <option value="">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
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
            {data.length === 0 ? (
              <EmptyState hasActiveFilters={hasActiveFilters} />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortButton
                        field="project_id"
                        label="PROJECT CODE"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortButton
                        field="project_title"
                        label="PROJECT"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proponent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortButton
                        field="project_cost"
                        label="COST"
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((project) => (
                    <tr key={project.project_id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono font-medium whitespace-nowrap">
                        {project.project_id ?? project.project_id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <span className="whitespace-normal break-words">{project.project_title}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{project.proponent?.company_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{project.proponent?.owner_name}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        ₱{Number(project.project_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <ProgressBadge status={project.progress} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DownloadButton onClick={() => handleOpenModal(project.project_id)} disabled={isSubmitting} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <EmptyState hasActiveFilters={hasActiveFilters} mobile />
            ) : (
              data.map((project) => (
                <div key={project.project_id} className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-gray-500 font-mono font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                          {project.project_id ?? project.project_id}
                        </span>
                        <ProgressBadge status={project.progress} />
                        {project.year_obligated && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {project.year_obligated}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{project.project_title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{project.proponent?.company_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500 block font-medium">Owner</span>
                      <p className="font-medium text-gray-900 mt-0.5 truncate">{project.proponent?.owner_name}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <span className="text-gray-500 block font-medium">Office</span>
                      <p className="font-medium text-gray-900 mt-0.5 truncate">{project.proponent?.office?.office_name}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 col-span-2">
                      <span className="text-gray-500 block font-medium">Cost</span>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        ₱{Number(project.project_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <DownloadButton onClick={() => handleOpenModal(project.project_id)} disabled={isSubmitting} fullWidth />
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {paginationData && paginationData.links && paginationData.links.length > 3 && (
            <div className="bg-gray-50/50 px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-medium">{paginationData.from || 0}</span>–
                  <span className="font-medium">{paginationData.to || 0}</span> of{' '}
                  <span className="font-medium">{paginationData.total || 0}</span> projects
                </p>
                <div className="flex gap-1 overflow-x-auto">
                  {paginationData.links.map((link, index) => {
                    const pageNum = link.url
                      ? new URL(link.url).searchParams.get('page')
                      : null;

                    return (
                      <button
                        key={index}
                        disabled={!link.url}
                        onClick={() => {
                          if (!pageNum) return;
                          router.get(
                            route('approvals.index'),
                            { search, perPage, officeFilter, yearFilter, sortField, sortDirection, statusTab, page: pageNum },
                            { preserveState: true, preserveScroll: false }
                          );
                        }}
                        className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg border transition-all flex-shrink-0 ${
                          link.active
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                            : link.url
                            ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Download Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg md:rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Download Document</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">Provide required information</p>
            </div>

            <div className="px-4 md:px-6 py-4 md:py-6 space-y-3 md:space-y-4">
              {errors.form && (
                <div className="p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs md:text-sm text-red-800">{errors.form}</p>
                </div>
              )}

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Owner Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.owner_lastname}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, owner_lastname: e.target.value }));
                    if (errors.owner_lastname) setErrors(prev => ({ ...prev, owner_lastname: '' }));
                  }}
                  placeholder="e.g., Dela Cruz"
                  className={`w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.owner_lastname ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                />
                {errors.owner_lastname && <p className="mt-1 text-xs text-red-600">{errors.owner_lastname}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, position: e.target.value }));
                    if (errors.position) setErrors(prev => ({ ...prev, position: '' }));
                  }}
                  placeholder="e.g., General Manager"
                  className={`w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.position ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position}</p>}
              </div>

              {downloadProgress && (
                <div className="flex items-center gap-2 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="animate-spin h-3 w-3 md:h-4 md:w-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs md:text-sm text-blue-800">{downloadProgress}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2 md:pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 text-gray-700 text-xs md:text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isSubmitting}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white text-xs md:text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-3 w-3 md:h-4 md:w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    'Download'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}