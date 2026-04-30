import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm, Head, router, usePage, Link } from '@inertiajs/react';
import { Save, Search, Filter, Calendar, Building2, CheckCircle, AlertCircle, X, Check, Eye, HandCoins, FileText, TrendingUp, Hand, Building, Banknote, BanknoteArrowUp, Receipt, ReceiptText, TicketSlash } from 'lucide-react';
import { MONTHS, REFUND_STATUS } from './constants/refundConstants';
import FilterSection from './components/FilterSection';
import RefundTableRow from './components/RefundTableRow';
import RefundMobileCard from './components/RefundMobileCard';
import RefundPagination from './components/RefundPagination';
import UnpaidMonthsWarningModal from './components/UnpaidMonthsWarningModal';
import { useRefundData } from './hooks/useRefundData';

export default function Index({ projects, selectedMonth, selectedYear, search, selectedStatus }) {
  const { flash, userRole } = usePage().props;
  const isRPMO = ['rpmo', 'au'].includes(userRole);
  const [perPage, setPerPage] = useState(10);

  // State management
  const saveTimeoutsRef = useRef({});
  const savedProjectsRef = useRef({});           // source of truth (sync, no batching issues)
  const [savedProjects, setSavedProjects] = useState({});  // only for re-render trigger
  const [savingProject, setSavingProject] = useState(null);
  const [searchInput, setSearchInput] = useState(search || '');
  const [statusFilter, setStatusFilter] = useState(selectedStatus || '');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningData, setWarningData] = useState({
    unpaidMonths: [],
    projectTitle: '',
    refundInitial: '',
    refundEnd: '',
    message: '',
    action: '',
  });
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

  // Handle flash messages for warnings
  useEffect(() => {
    if (flash && typeof flash === 'object') {
      if (flash.warning) {
        const newWarningData = {
          unpaidMonths: flash.warning.unpaid_months || [],
          projectTitle: flash.warning.project_title || '',
          refundInitial: flash.warning.refund_initial || '',
          refundEnd: flash.warning.refund_end || '',
          message: flash.warning.message || 'Cannot update project status.',
          action: flash.warning.action || '',
        };
        setWarningData(newWarningData);
        setShowWarningModal(true);
      }
    }
  }, [flash]);

  // Memoized handlers
  const handleFilterChange = useCallback((month, year, searchValue, statusValue = statusFilter, perPageValue = perPage) => {
    router.get('/refunds',
      { month, year, search: searchValue, status: statusValue, perPage: perPageValue },
      { preserveScroll: true, preserveState: true }
    );
  }, [statusFilter, perPage]);

  const handlePerPageChange = useCallback((value) => {
    setPerPage(value);
    handleFilterChange(selectedMonth, selectedYear, searchInput, statusFilter, value);
  }, [selectedMonth, selectedYear, searchInput, statusFilter, handleFilterChange]);

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
      preserveState: true,
      onSuccess: () => {
        // Clear any existing timeout for this project
        if (saveTimeoutsRef.current[projectId]) {
          clearTimeout(saveTimeoutsRef.current[projectId]);
          delete saveTimeoutsRef.current[projectId];
        }

        // Update ref first (sync, no React batching issues)
        savedProjectsRef.current[projectId] = true;
        // Trigger re-render with immutable update
        setSavedProjects(prev => ({ ...prev, [projectId]: true }));

        const timeoutId = setTimeout(() => {
          delete savedProjectsRef.current[projectId];
          delete saveTimeoutsRef.current[projectId];
          // Trigger re-render to remove success state - create new object without the key
          setSavedProjects(prev => {
            const newState = { ...prev };
            delete newState[projectId];
            return newState;
          });
        }, 3000);

        saveTimeoutsRef.current[projectId] = timeoutId;
      },
      onFinish: () => {
        // Safe to call here — savedProjectsRef is already committed synchronously
        setSavingProject(null);
      },
      onError: (errors) => {},
    });
  }, [projectMap, selectedMonth, selectedYear, data]);

  // Reads from ref (always current), state (savedProjects) just triggers re-renders
  const getButtonState = useCallback((projectId) => {
    if (savingProject === projectId) return 'loading';
    if (savedProjectsRef.current[projectId]) return 'success';
    return 'default';
  }, [savingProject, savedProjects]); // savedProjects in deps ensures re-render when ref changes

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
        className: 'p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all',
        content: <Save className="w-5 h-5" />,
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
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <HandCoins className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Refund Management</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                  Manage project refund amounts
                </p>
              </div>
            </div>
          </div>

          {/* Unpaid Months Warning Modal */}
          <UnpaidMonthsWarningModal
            isOpen={showWarningModal}
            onClose={() => setShowWarningModal(false)}
            unpaidMonths={warningData.unpaidMonths}
            message={warningData.message}
            action={warningData.action}
            projectTitle={warningData.projectTitle}
            refundInitial={warningData.refundInitial}
            refundEnd={warningData.refundEnd}
          />

          {/* Filters Section */}
          <FilterSection
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            searchInput={searchInput}
            statusFilter={statusFilter}
            perPage={perPage}
            months={MONTHS}
            years={years}
            projects={projects}
            flash={flash}
            onMonthChange={(month) => handleFilterChange(month, selectedYear, searchInput)}
            onYearChange={(year) => handleFilterChange(selectedMonth, year, searchInput)}
            onSearchChange={setSearchInput}
            onStatusChange={(status) => setStatusFilter(status)}
            onPerPageChange={handlePerPageChange}
          />

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Project & Proponent
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Amount Due
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <BanknoteArrowUp className="w-4 h-4" />
                      Refund Amount
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <TicketSlash className="w-4 h-4" />
                      Check Number
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="w-4 h-4" />
                      Receipt Number
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Status
                    </div>
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <Hand className="w-4 h-4" />
                      Action
                    </div>
                  </th>
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
            <RefundPagination
              links={projects.links}
              from={projects.from}
              to={projects.to}
              total={projects.total}
            />
          )}
        </div>
      </div>
    </main>
  );
}