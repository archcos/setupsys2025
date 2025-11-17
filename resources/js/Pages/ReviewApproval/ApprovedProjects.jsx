import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, X, Building2, ArrowUpDown } from 'lucide-react';

export default function ApprovedProjects({ projects, offices, filters, error: serverError }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [officeFilter, setOfficeFilter] = useState(filters?.officeFilter || '');
  const [sortBy, setSortBy] = useState(filters?.sortBy || 'recent');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ owner_lastname: '', position: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const { errors: pageErrors } = usePage().props;

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      router.get(route('approvals.index'), { 
        search, 
        perPage,
        officeFilter,
        sortBy
      }, { 
        preserveState: true, 
        replace: true 
      });
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [search, officeFilter, sortBy]);

  const handlePerPageChange = (e) => {
    const newPerPage = e.target.value;
    setPerPage(newPerPage);
    router.get(route('approvals.index'), {
      search,
      perPage: newPerPage,
      officeFilter,
      sortBy
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    router.get(route('approvals.index'), {
      search,
      perPage,
      officeFilter,
      sortBy: newSort
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setOfficeFilter('');
    setSortBy('recent');
    router.get(route('approvals.index'), {
      perPage
    }, {
      preserveState: true,
    });
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
    
    if (!formData.owner_lastname.trim()) {
      newErrors.owner_lastname = 'Owner last name is required';
    } else if (formData.owner_lastname.length > 255) {
      newErrors.owner_lastname = 'Owner last name is too long';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    } else if (formData.position.length > 255) {
      newErrors.position = 'Position is too long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownload = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setDownloadProgress('Generating document...');

    try {
      // Step 1: Generate the document
      const generateResponse = await fetch(route('approvals.generate', { project_id: selected }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        },
        body: JSON.stringify({
          owner_lastname: formData.owner_lastname,
          position: formData.position,
        }),
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

      // Step 2: Trigger the download
      setDownloadProgress('Downloading file...');
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.click();

      // Small delay before closing
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

  const hasActiveFilters = search || officeFilter;
  const data = projects?.data || [];
  const paginationData = projects?.data ? projects : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Approved Projects</h1>
          <p className="text-sm text-gray-600 mt-1">Download approval documents for compliance-approved projects</p>
        </div>

        {/* Error Display */}
        {(serverError || pageErrors?.error) && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-800">{serverError || pageErrors?.error}</p>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by project title or company name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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

              <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-300 shadow-sm">
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

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex flex-col lg:flex-row gap-4 flex-1">
                {offices && offices.length > 0 && (
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-300 shadow-sm min-w-[200px]">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <select
                      value={officeFilter}
                      onChange={(e) => setOfficeFilter(e.target.value)}
                      className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2.5"
                    >
                      <option value="">All Offices</option>
                      {offices.map((office) => (
                        <option key={office.office_id} value={office.office_id}>
                          {office.office_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-300 shadow-sm min-w-[180px]">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2.5"
                  >
                    <option value="recent">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {data.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No approved projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'No projects with compliance approval status found'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Office</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((project, index) => (
                  <tr key={project.project_id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {paginationData ? paginationData.from + index : index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{project.project_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{project.company?.company_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{project.company?.owner_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{project.company?.office?.office_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      ₱{Number(project.project_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenModal(project.project_id)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {paginationData && paginationData.links && paginationData.links.length > 3 && (
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{paginationData.from || 0}</span> to{' '}
                <span className="font-medium">{paginationData.to || 0}</span> of{' '}
                <span className="font-medium">{paginationData.total || 0}</span> results
              </div>
              <div className="flex gap-1">
                {paginationData.links.map((link, index) => (
                  <button
                    key={index}
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                      link.active
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
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

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Download Approval Document</h2>
              <p className="text-sm text-gray-600 mt-1">Please provide the required information</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{errors.form}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.owner_lastname ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                />
                {errors.owner_lastname && (
                  <p className="mt-1 text-sm text-red-600">{errors.owner_lastname}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.position ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                )}
              </div>

              {downloadProgress && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm text-blue-800">{downloadProgress}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
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
    </div>
  );
}