import { useState, useEffect, useRef } from 'react';
import { useForm, Head, router, usePage } from '@inertiajs/react';
import { Save, Search, Filter, Calendar, Building2, CheckCircle, AlertCircle, X, Check } from 'lucide-react';

export default function Loan({ projects, selectedMonth, selectedYear, search, selectedStatus }) {
  const { flash } = usePage().props;
  const [savingProject, setSavingProject] = useState(null);
  const [savedProjects, setSavedProjects] = useState(new Set());
  const [searchInput, setSearchInput] = useState(search || '');
  const [statusFilter, setStatusFilter] = useState(selectedStatus || ''); 

  const { data, setData, post, processing } = useForm({
    project_id: '',
    refund_amount: '',
    status: 'unpaid',
  });

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const delaySearch = setTimeout(() => {
      handleFilterChange(selectedMonth, selectedYear, searchInput, statusFilter);
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchInput, statusFilter]);

  useEffect(() => {
    if (projects?.data) {
      const initialData = {};
      projects.data.forEach((p) => {
        const latestRefund = p.refunds?.[0];
        const refundAmount = latestRefund?.refund_amount ?? p.refund_amount ?? '';

        initialData[`refund_amount_${p.project_id}`] = refundAmount;
        initialData[`status_${p.project_id}`] = latestRefund?.status ?? 'unpaid';
        initialData[`amount_due_${p.project_id}`] = latestRefund?.amount_due ?? refundAmount;
      });
      setData((prev) => ({ ...prev, ...initialData }));
    }
  }, [projects]);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleFilterChange = (month, year, searchValue, statusValue = statusFilter) => {
    router.get('/refunds', { month, year, search: searchValue, status: statusValue }, { preserveScroll: true });
  };

  const handleSave = (projectId) => {
    const project = projects.data.find(p => p.project_id === projectId);
    const month = selectedMonth.toString().padStart(2, '0');
    const saveDate = `${selectedYear}-${month}-01`;

    setSavingProject(projectId);
    
    router.post('/refunds/save', {
      project_id: projectId,
      refund_amount: data[`refund_amount_${projectId}`] ?? project.refund_amount ?? 0,
      amount_due: data[`amount_due_${projectId}`] ?? project.amount_due ?? 0,
      check_num: data[`check_num_${projectId}`] ?? '',
      receipt_num: data[`receipt_num_${projectId}`] ?? '',
      status: data[`status_${projectId}`],
      save_date: saveDate,
    }, {
      preserveScroll: true,
      onFinish: () => {
        setSavingProject(null);
      },
      onSuccess: (page) => {
        // Add project to saved set and remove it after 3 seconds
        setSavedProjects(prev => new Set([...prev, projectId]));
        setTimeout(() => {
          setSavedProjects(prev => {
            const newSet = new Set(prev);
            newSet.delete(projectId);
            return newSet;
          });
        }, 3000);
      },
      onError: (errors) => {
        console.log('Request errors:', errors);
      },
    });
  };

  const getButtonState = (projectId) => {
    if (savingProject === projectId) return 'loading';
    if (savedProjects.has(projectId)) return 'success';
    return 'default';
  };

  const renderSaveButton = (projectId) => {
    const buttonState = getButtonState(projectId);
    
    const buttonConfig = {
      loading: {
        className: 'bg-gray-400 text-white cursor-not-allowed',
        content: <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>,
        disabled: true
      },
      success: {
        className: 'bg-green-500 text-white',
        content: <Check className="w-4 h-4" />,
        disabled: false
      },
      default: {
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-lg',
        content: <Save className="w-4 h-4" />,
        disabled: false
      }
    };

    const config = buttonConfig[buttonState];

    return (
      <button
        onClick={() => handleSave(projectId)}
        disabled={config.disabled}
        className={`p-2 rounded-lg font-medium transition-all duration-200 ${config.className}`}
        title={buttonState === 'success' ? 'Saved Successfully' : 'Save Changes'}
      >
        {config.content}
      </button>
    );
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="Refund Management" />
      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Refund Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage project refund amounts</p>
          </div>

          {/* Filters Section */}
          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Month Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleFilterChange(e.target.value, selectedYear, searchInput)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleFilterChange(selectedMonth, e.target.value, searchInput)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    handleFilterChange(selectedMonth, selectedYear, searchInput, e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 
                            focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                >
                  <option value="">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search Projects
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by company name or project title..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              {projects.data.length > 0 
                ? `Showing ${projects.data.length} projects for ${months.find(m => m.value == selectedMonth)?.label} ${selectedYear}`
                : 'No projects found for the selected period'
              }
            </div>

            {/* Flash Messages - Keep these as backup */}
            {flash.success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {flash.success}
              </div>
            )}
            {flash.error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                {flash.error}
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Project Details
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      Refund Amount
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Receipt No.
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.data.length > 0 ? (
                  projects.data.map((p, idx) => {
                    const latestRefund = p.refunds?.[0];
                    const currentStatus = data[`status_${p.project_id}`] ?? latestRefund?.status ?? 'unpaid';
                    
                    return (
                      <tr
                        key={p.project_id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                              {p.project_title}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {p.project_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {p.company.company_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                            <input
                              type="number"
                              value={data[`amount_due_${p.project_id}`] ?? ''}
                              onChange={(e) => setData(`amount_due_${p.project_id}`, e.target.value)}
                              className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="0.00"
                              disabled
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                            <input
                              type="number"
                              value={data[`refund_amount_${p.project_id}`] ?? ''}
                              onChange={(e) => setData(`refund_amount_${p.project_id}`, e.target.value)}
                              className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={data[`check_num_${p.project_id}`] ?? latestRefund?.check_num ?? ''}
                            onChange={(e) => setData(`check_num_${p.project_id}`, e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Check No."
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={data[`receipt_num_${p.project_id}`] ?? latestRefund?.receipt_num ?? ''}
                            onChange={(e) => setData(`receipt_num_${p.project_id}`, e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Receipt No."
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={currentStatus}
                            onChange={(e) => setData(`status_${p.project_id}`, e.target.value)}
                            className={`px-3 pr-6 py-1.5 text-xs font-medium rounded-lg focus:ring-1 transition-all duration-200
                              ${currentStatus === 'paid' 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-red-100 text-red-800 border border-red-300'}`}
                          >
                            <option value="paid" className="text-green-700">Paid</option>
                            <option value="unpaid" className="text-red-700">Unpaid</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {renderSaveButton(p.project_id)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                          <p className="text-gray-500 text-sm">
                            No projects found for {months.find(m => m.value == selectedMonth)?.label} {selectedYear}.
                            {searchInput && ` Try adjusting your search term "${searchInput}".`}
                          </p>
                        </div>
                        {searchInput && (
                          <button
                            onClick={() => setSearchInput('')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {projects.links && projects.links.length > 1 && (
            <div className="bg-gradient-to-r from-gray-50/50 to-white px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {projects.from || 1} to {projects.to || projects.data.length} of {projects.total || projects.data.length} results
                </div>
                <div className="flex gap-1">
                  {projects.links.map((link, index) => (
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
    </main>
  );
}