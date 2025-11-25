import { useState, useEffect, useRef } from 'react';
import { useForm, Head, router, usePage, Link } from '@inertiajs/react';
import { Save, Search, Filter, Calendar, Building2, CheckCircle, AlertCircle, X, Check, Eye } from 'lucide-react';

export default function Refund({ projects, selectedMonth, selectedYear, search, selectedStatus }) {
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

  // Handle status change
  const handleStatusChange = (projectId, newStatus) => {
    setData(`status_${projectId}`, newStatus);
    
    // If restructured is selected, set amounts to 0
    if (newStatus === 'restructured') {
      setData(`refund_amount_${projectId}`, 0);
      setData(`amount_due_${projectId}`, 0);
    } else if (newStatus === 'paid' || newStatus === 'unpaid') {
      // If changing from restructured to paid/unpaid, restore the original amounts
      const project = projects.data.find(p => p.project_id === projectId);
      const latestRefund = project?.refunds?.[0];
      const refundAmount = latestRefund?.refund_amount ?? project?.refund_amount ?? 0;
      
      // Only restore if current values are 0 (meaning it was previously restructured)
      if (data[`refund_amount_${projectId}`] == 0) {
        setData(`refund_amount_${projectId}`, refundAmount);
        setData(`amount_due_${projectId}`, refundAmount);
      }
    }
  };

  const handleSave = (projectId) => {
    const project = projects.data.find(p => p.project_id === projectId);
    const month = selectedMonth.toString().padStart(2, '0');
    const saveDate = `${selectedYear}-${month}-01`;
    const currentStatus = data[`status_${projectId}`];

    setSavingProject(projectId);
    
    // Ensure amounts are 0 if status is restructured
    const refundAmount = currentStatus === 'restructured' ? 0 : (data[`refund_amount_${projectId}`] ?? project.refund_amount ?? 0);
    const amountDue = currentStatus === 'restructured' ? 0 : (data[`amount_due_${projectId}`] ?? project.amount_due ?? 0);
    
    router.post('/refunds/save', {
      project_id: projectId,
      refund_amount: refundAmount,
      amount_due: amountDue,
      check_num: data[`check_num_${projectId}`] ?? '',
      receipt_num: data[`receipt_num_${projectId}`] ?? '',
      status: currentStatus,
      save_date: saveDate,
    }, {
      preserveScroll: true,
      onFinish: () => {
        setSavingProject(null);
      },
      onSuccess: (page) => {
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
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Refund Management" />
      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Refund Management</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Manage project refund amounts</p>
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              
              {/* Month Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleFilterChange(e.target.value, selectedYear, searchInput)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm"
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
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm"
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
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 
                            focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm"
                >
                  <option value="">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="restructured">Restructured</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="lg:col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Company or project..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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
            <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600">
              {projects.data.length > 0 
                ? `Showing ${projects.data.length} projects for ${months.find(m => m.value == selectedMonth)?.label} ${selectedYear}`
                : 'No projects found for the selected period'
              }
            </div>

            {/* Flash Messages */}
            {flash.success && (
              <div className="mt-3 md:mt-4 bg-green-50 border border-green-200 text-green-800 px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                {flash.success}
              </div>
            )}
            {flash.error && (
              <div className="mt-3 md:mt-4 bg-red-50 border border-red-200 text-red-800 px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
                {flash.error}
              </div>
            )}
          </div>

          {/* Table Section - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Project & Company
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Refund Amount
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check No.
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Receipt No.
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.data.length > 0 ? (
                  projects.data.map((p, idx) => {
                    const latestRefund = p.refunds?.[0];
                    const currentStatus = data[`status_${p.project_id}`] ?? latestRefund?.status ?? 'unpaid';
                    const isRestructured = currentStatus === 'restructured';
                    
                    return (
                      <tr
                        key={p.project_id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 group"
                      >
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                              {p.project_title}
                            </div>
                            <div className="text-xs text-gray-600 font-medium mb-0.5">
                              {p.company.company_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {p.project_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
                            <input
                              type="number"
                              value={data[`amount_due_${p.project_id}`] ?? ''}
                              onChange={(e) => setData(`amount_due_${p.project_id}`, e.target.value)}
                              className={`w-full pl-6 pr-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                isRestructured ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                              placeholder="0.00"
                              disabled
                            />
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
                            <input
                              type="number"
                              value={data[`refund_amount_${p.project_id}`] ?? ''}
                              onChange={(e) => {
                                let val = e.target.value;

                                if (val.length > 10) return; // block extra digits
                                setData(`refund_amount_${p.project_id}`, val);
                              }}
                              className={`w-full pl-6 pr-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                isRestructured ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                              placeholder="0.00"
                              maxLength="10"
                              disabled={isRestructured}
                            />
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <input
                            type="text"
                            value={data[`check_num_${p.project_id}`] ?? latestRefund?.check_num ?? ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setData(`check_num_${p.project_id}`, value);
                            }}
                            className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Check No."
                            maxLength="10"
                            pattern="\d{10}"
                          />
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <input
                            type="text"
                            value={data[`receipt_num_${p.project_id}`] ?? latestRefund?.receipt_num ?? ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setData(`receipt_num_${p.project_id}`, value);
                            }}
                            className="w-full px-2 py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Receipt No."
                            maxLength="10"
                            pattern="\d{10}"
                          />
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(p.project_id, e.target.value)}
                            className={`px-2 pr-4 py-1 text-xs font-medium rounded-lg focus:ring-1 transition-all duration-200 w-full
                              ${currentStatus === 'paid' 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : currentStatus === 'restructured'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-red-100 text-red-800 border border-red-300'}`}
                          >
                            <option value="paid" className="text-green-700">Paid</option>
                            <option value="unpaid" className="text-red-700">Unpaid</option>
                            <option value="restructured" className="text-blue-700">Restructured</option>
                          </select>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/refunds/project/${p.project_id}`}
                              className="p-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-sm hover:shadow-lg"
                              title="View Full Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {renderSaveButton(p.project_id)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
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
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
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

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {projects.data.length > 0 ? (
              projects.data.map((p) => {
                const latestRefund = p.refunds?.[0];
                const currentStatus = data[`status_${p.project_id}`] ?? latestRefund?.status ?? 'unpaid';
                const isRestructured = currentStatus === 'restructured';

                return (
                  <div key={p.project_id} className="p-4 space-y-3">
                    {/* Project Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{p.project_title}</h3>
                      <p className="text-xs text-gray-600 mb-0.5">{p.company.company_name}</p>
                      <p className="text-xs text-gray-500">ID: {p.project_id}</p>
                    </div>

                    {/* Amount Due and Refund Amount */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">Amount Due</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
                          <input
                            type="number"
                            value={data[`amount_due_${p.project_id}`] ?? ''}
                            onChange={(e) => setData(`amount_due_${p.project_id}`, e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            disabled
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">Refund Amt.</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
                          <input
                            type="number"
                            value={data[`refund_amount_${p.project_id}`] ?? ''}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length > 10) return;
                              setData(`refund_amount_${p.project_id}`, val);
                            }}
                            className={`w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              isRestructured ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="0.00"
                            maxLength="10"
                            disabled={isRestructured}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Check and Receipt Numbers */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">Check No.</label>
                        <input
                          type="text"
                          value={data[`check_num_${p.project_id}`] ?? latestRefund?.check_num ?? ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setData(`check_num_${p.project_id}`, value);
                          }}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Check No."
                          maxLength="10"
                        />
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <label className="text-xs text-gray-600 font-medium block mb-1">Receipt No.</label>
                        <input
                          type="text"
                          value={data[`receipt_num_${p.project_id}`] ?? latestRefund?.receipt_num ?? ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setData(`receipt_num_${p.project_id}`, value);
                          }}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Receipt No."
                          maxLength="10"
                        />
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex gap-2">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(p.project_id, e.target.value)}
                        className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg focus:ring-1 transition-all duration-200
                          ${currentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : currentStatus === 'restructured'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-red-100 text-red-800 border border-red-300'}`}
                      >
                        <option value="paid" className="text-green-700">Paid</option>
                        <option value="unpaid" className="text-red-700">Unpaid</option>
                        <option value="restructured" className="text-blue-700">Restructured</option>
                      </select>

                      <Link
                        href={`/refunds/project/${p.project_id}`}
                        className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {renderSaveButton(p.project_id)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <h3 className="text-base font-medium text-gray-900 mb-1">No projects found</h3>
                  <p className="text-gray-500 text-xs">
                    No projects found for {months.find(m => m.value == selectedMonth)?.label} {selectedYear}.
                    {searchInput && ` Try adjusting your search term.`}
                  </p>
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput('')}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs mt-2"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {projects.links && projects.links.length > 1 && (
            <div className="bg-gradient-to-r from-gray-50/50 to-white px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {projects.from || 1} to {projects.to || projects.data.length} of {projects.total || projects.data.length} results
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {projects.links.map((link, index) => {
        // Safely parse pagination labels
        const getLabel = (label) => {
          if (label === "&laquo; Previous") return "←";
          if (label === "Next &raquo;") return "→";
          return label;
        };

        return (
          <button
            key={index}
            disabled={!link.url}
            onClick={() => link.url && router.visit(link.url)}
            className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
              link.active
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent shadow-md'
                : link.url
                ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            {getLabel(link.label)}
          </button>
        );
      })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}