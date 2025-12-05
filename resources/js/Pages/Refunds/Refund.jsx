import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm, Head, router, usePage, Link } from '@inertiajs/react';
import { Save, Search, Filter, Calendar, Building2, CheckCircle, AlertCircle, X, Check, Eye, HandCoins } from 'lucide-react';
import { MONTHS, REFUND_STATUS } from './constants/refundConstants';
import FilterSection from './components/FilterSection';
import RefundTableRow from './components/RefundTableRow';
import RefundMobileCard from './components/RefundMobileCard';
import RefundPagination from './components/RefundPagination';
import { useRefundData } from './hooks/useRefundData';

export default function Refund({ projects, selectedMonth, selectedYear, search, selectedStatus }) {
  const { flash, userRole } = usePage().props;
  const isRPMO = userRole === 'rpmo';

  // State management
  const [savingProject, setSavingProject] = useState(null);
  const [savedProjects, setSavedProjects] = useState(new Set());
  const [searchInput, setSearchInput] = useState(search || '');
  const [statusFilter, setStatusFilter] = useState(selectedStatus || '');
  const isFirstRun = useRef(true);

  const { data, setData } = useForm({
    project_id: '',
    refund_amount: '',
    status: 'unpaid',
  });

  // Generate years once
  const years = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
    []
  );

  // Create project map for O(1) lookups
  const projectMap = useMemo(() => 
    new Map(projects.data?.map(p => [p.project_id, p]) ?? []),
    [projects.data]
  );

  // Initialize/sync data efficiently
  useRefundData(projects, data, setData);

  // Debounced filter change
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

  // Memoized handlers
  const handleFilterChange = useCallback((month, year, searchValue, statusValue = statusFilter) => {
    router.get('/refunds', 
      { month, year, search: searchValue, status: statusValue }, 
      { preserveScroll: true }
    );
  }, [statusFilter]);

  const handleStatusChange = useCallback((projectId, newStatus) => {
    setData(`status_${projectId}`, newStatus);
    
    if (newStatus === REFUND_STATUS.RESTRUCTURED) {
      setData(`refund_amount_${projectId}`, 0);
      setData(`amount_due_${projectId}`, 0);
    } else if ([REFUND_STATUS.PAID, REFUND_STATUS.UNPAID].includes(newStatus)) {
      const project = projectMap.get(projectId);
      const latestRefund = project?.refunds?.[0];
      const refundAmount = latestRefund?.refund_amount ?? project?.refund_amount ?? 0;
      
      if (data[`refund_amount_${projectId}`] == 0) {
        setData(`refund_amount_${projectId}`, refundAmount);
        setData(`amount_due_${projectId}`, refundAmount);
      }
    }
  }, [projectMap, data, setData]);

  const handleSave = useCallback((projectId) => {
    const project = projectMap.get(projectId);
    const month = selectedMonth.toString().padStart(2, '0');
    const saveDate = `${selectedYear}-${month}-01`;
    const currentStatus = data[`status_${projectId}`];

    setSavingProject(projectId);
    
    const refundAmount = currentStatus === REFUND_STATUS.RESTRUCTURED 
      ? 0 
      : (data[`refund_amount_${projectId}`] ?? project?.refund_amount ?? 0);
    const amountDue = currentStatus === REFUND_STATUS.RESTRUCTURED 
      ? 0 
      : (data[`amount_due_${projectId}`] ?? project?.amount_due ?? 0);
    
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
      onFinish: () => setSavingProject(null),
      onSuccess: () => {
        setSavedProjects(prev => new Set([...prev, projectId]));
        setTimeout(() => {
          setSavedProjects(prev => {
            const newSet = new Set(prev);
            newSet.delete(projectId);
            return newSet;
          });
        }, 3000);
      },
      onError: (errors) => console.log('Request errors:', errors),
    });
  }, [projectMap, selectedMonth, selectedYear, data]);

  const getButtonState = useCallback((projectId) => {
    if (savingProject === projectId) return 'loading';
    if (savedProjects.has(projectId)) return 'success';
    return 'default';
  }, [savingProject, savedProjects]);

  const renderSaveButton = useCallback((projectId) => {
    if (!isRPMO) return null;

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
  }, [isRPMO, getButtonState, handleSave]);

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Refund Management" />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <HandCoins className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Refund Management</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                  Manage project refund amounts
                </p>
              </div>
            </div>
          </div>

          {/* Filters Section - Memoized */}
          <FilterSection
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            searchInput={searchInput}
            statusFilter={statusFilter}
            months={MONTHS}
            years={years}
            projects={projects}
            flash={flash}
            onMonthChange={(month) => handleFilterChange(month, selectedYear, searchInput)}
            onYearChange={(year) => handleFilterChange(selectedMonth, year, searchInput)}
            onSearchChange={setSearchInput}
            onStatusChange={(status) => setStatusFilter(status)}
          />

          {/* Desktop Table */}
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
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount Due</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Refund Amount</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check No.</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Receipt No.</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.data.length > 0 ? (
                  projects.data.map((p) => (
                    <RefundTableRow
                      key={p.project_id}
                      project={p}
                      data={data}
                      setData={setData}
                      isRPMO={isRPMO}
                      currentStatus={data[`status_${p.project_id}`] ?? p.refunds?.[0]?.status ?? 'unpaid'}
                      onStatusChange={handleStatusChange}
                      onSaveClick={() => handleSave(p.project_id)}
                      renderSaveButton={renderSaveButton}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
                          <p className="text-gray-500 text-sm">
                            No projects found for {MONTHS.find(m => m.value == selectedMonth)?.label} {selectedYear}.
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
              projects.data.map((p) => (
                <RefundMobileCard
                  key={p.project_id}
                  project={p}
                  data={data}
                  setData={setData}
                  isRPMO={isRPMO}
                  currentStatus={data[`status_${p.project_id}`] ?? p.refunds?.[0]?.status ?? 'unpaid'}
                  onStatusChange={handleStatusChange}
                  onSaveClick={() => handleSave(p.project_id)}
                  renderSaveButton={renderSaveButton}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <h3 className="text-base font-medium text-gray-900 mb-1">No projects found</h3>
                  <p className="text-gray-500 text-xs">
                    No projects found for {MONTHS.find(m => m.value == selectedMonth)?.label} {selectedYear}.
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
            <RefundPagination links={projects.links} />
          )}
        </div>
      </div>
    </main>
  );
}