import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm, Head, router, usePage, Link } from '@inertiajs/react';
import { Save, Search, Filter, Calendar, Building2, CheckCircle, AlertCircle, X, Check, Eye, HandCoins, FileText, TrendingUp, Hand, Building, Banknote, BanknoteArrowUp, Receipt, ReceiptText, TicketSlash, UserCircle, Clock } from 'lucide-react';
import { MONTHS, REFUND_STATUS } from './constants/refundConstants';
import FilterSection from './components/FilterSection';
import RefundTableRow from './components/RefundTableRow';
import RefundMobileCard from './components/RefundMobileCard';
import RefundPagination from './components/RefundPagination';
import UnpaidMonthsWarningModal from './components/UnpaidMonthsWarningModal';
import { useRefundData } from './hooks/useRefundData';

export default function Index({
    projects,
    selectedMonth,
    selectedYear,
    search,
    selectedStatus,
    // ── new props ──
    selectedOffice,
    includeWithdrawn,
    includeTerminated,
    availableYears,   // from DB — replaces the hardcoded 5-year array
    offices,          // [{office_id, office_name}, ...]
}) {
    const { flash, userRole } = usePage().props;
    const isRPMO = ['rpmo', 'au'].includes(userRole);
    const [perPage, setPerPage] = useState(10);
    const [officeFilter, setOfficeFilter]               = useState(selectedOffice || '');
    const [withWithdrawn, setWithWithdrawn]             = useState(includeWithdrawn  ?? false);
    const [withTerminated, setWithTerminated]           = useState(includeTerminated ?? false);

    // refs for stale-closure safety
    const officeFilterRef    = useRef(officeFilter);
    const withWithdrawnRef   = useRef(withWithdrawn);
    const withTerminatedRef  = useRef(withTerminated);

    useEffect(() => { officeFilterRef.current   = officeFilter;   }, [officeFilter]);
    useEffect(() => { withWithdrawnRef.current  = withWithdrawn;  }, [withWithdrawn]);
    useEffect(() => { withTerminatedRef.current = withTerminated; }, [withTerminated]);
    // State management
    const saveTimeoutsRef = useRef({});
    const savedProjectsRef = useRef({});
    const [savedProjects, setSavedProjects] = useState({});
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
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // FIX: use refs to always hold latest filter values for callbacks
    const statusFilterRef = useRef(statusFilter);
    const perPageRef = useRef(perPage);
    const searchInputRef = useRef(searchInput);

    useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);
    useEffect(() => { perPageRef.current = perPage; }, [perPage]);
    useEffect(() => { searchInputRef.current = searchInput; }, [searchInput]);

    const { data, setData } = useForm({
        project_id: '',
        refund_amount: '',
        status: 'unpaid',
    });


    const projectMap = useMemo(() =>
        new Map(projects.data?.map(p => [p.project_id, p]) ?? []),
        [projects.data]
    );

    // FIX: pass projects.data as a dep so the hook re-runs when data changes
    useRefundData(projects, data, setData);

    // Debounced search/status filter
    useEffect(() => {
        if (isFirstRun.current) { isFirstRun.current = false; return; }

        const delaySearch = setTimeout(() => {
            router.get('/refunds',
                {
                    month:               selectedMonth,
                    year:                selectedYear,
                    search:              searchInputRef.current,
                    status:              statusFilterRef.current,
                    perPage:             perPageRef.current,
                    office:              officeFilterRef.current,
                    include_withdrawn:   withWithdrawnRef.current  ? 1 : 0,
                    include_terminated:  withTerminatedRef.current ? 1 : 0,
                },
                { preserveScroll: true, preserveState: true }
            );
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

    // FIX: reads from refs so this callback is never stale regardless of state
    const handleFilterChange = useCallback((month, year, searchValue, statusValue, perPageValue, officeValue, withdrawn, terminated) => {
        router.get('/refunds',
            {
                month,
                year,
                search:              searchValue  ?? searchInputRef.current,
                status:              statusValue  ?? statusFilterRef.current,
                perPage:             perPageValue ?? perPageRef.current,
                office:              officeValue  ?? officeFilterRef.current,
                include_withdrawn:   withdrawn    ?? withWithdrawnRef.current  ? 1 : 0,
                include_terminated:  terminated   ?? withTerminatedRef.current ? 1 : 0,
            },
            { preserveScroll: true, preserveState: true }
        );
    }, []);

    // ── New handlers ───────────────────────────────────────────────────────
    const handleOfficeChange = useCallback((office) => {
        setOfficeFilter(office);
        officeFilterRef.current = office;
        handleFilterChange(selectedMonth, selectedYear, undefined, undefined, undefined, office);
    }, [selectedMonth, selectedYear, handleFilterChange]);

    const handleWithdrawnToggle = useCallback((checked) => {
        setWithWithdrawn(checked);
        withWithdrawnRef.current = checked;
        handleFilterChange(selectedMonth, selectedYear, undefined, undefined, undefined, undefined, checked, withTerminatedRef.current);
    }, [selectedMonth, selectedYear, handleFilterChange]);

    const handleTerminatedToggle = useCallback((checked) => {
        setWithTerminated(checked);
        withTerminatedRef.current = checked;
        handleFilterChange(selectedMonth, selectedYear, undefined, undefined, undefined, undefined, withWithdrawnRef.current, checked);
    }, [selectedMonth, selectedYear, handleFilterChange]);

    const handlePerPageChange = useCallback((value) => {
        setPerPage(value);
        perPageRef.current = value; // update ref immediately before calling filter
        handleFilterChange(selectedMonth, selectedYear, undefined, undefined, value);
    }, [selectedMonth, selectedYear, handleFilterChange]);

    // FIX: status change now updates ref immediately too
    const handleStatusFilterChange = useCallback((status) => {
        setStatusFilter(status);
        statusFilterRef.current = status;
    }, []);

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
            check_date: data[`check_date_${projectId}`] ?? '',
            receipt_num: data[`receipt_num_${projectId}`] ?? '',
            receipt_date: data[`receipt_date_${projectId}`] ?? '',
            status: currentStatus,
            save_date: saveDate,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (saveTimeoutsRef.current[projectId]) {
                    clearTimeout(saveTimeoutsRef.current[projectId]);
                    delete saveTimeoutsRef.current[projectId];
                }

                savedProjectsRef.current[projectId] = true;
                setSavedProjects(prev => ({ ...prev, [projectId]: true }));

                const timeoutId = setTimeout(() => {
                    delete savedProjectsRef.current[projectId];
                    delete saveTimeoutsRef.current[projectId];
                    setSavedProjects(prev => {
                        const newState = { ...prev };
                        delete newState[projectId];
                        return newState;
                    });
                }, 3000);

                saveTimeoutsRef.current[projectId] = timeoutId;
            },
            onFinish: () => {
                setSavingProject(null);
            },
            onError: () => {},
        });
    }, [projectMap, selectedMonth, selectedYear, data]);

    const getButtonState = useCallback((projectId) => {
        if (savingProject === projectId) return 'loading';
        if (savedProjectsRef.current[projectId]) return 'success';
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

    /**
     * Renders the "last updated by" info for a project's latest refund.
     * Shows the editor's name and the updated_at timestamp.
     */
    const renderUpdatedBy = useCallback((project) => {
        const refund = project?.refunds?.[0];

        if (!refund?.updated_at) return null;

        const editorName = refund?.editor?.name ?? null;
        const updatedAt = new Date(refund.updated_at);

        const formattedDate = updatedAt.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        const formattedTime = updatedAt.toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        return (
            <div className="mt-1.5 flex flex-col gap-0.5">
                {editorName && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <UserCircle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]" title={editorName}>
                            {editorName}
                        </span>
                    </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{formattedDate}, {formattedTime}</span>
                </span>
            </div>
        );
    }, []);

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
                            {isRPMO && (
                                <button
                                    onClick={() => setShowSyncModal(true)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md font-medium text-sm"
                                    title="Sync refunds from CSV"
                                >
                                    <HandCoins className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sync CSV</span>
                                    <span className="sm:hidden">Sync</span>
                                </button>
                            )}
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
                        years={availableYears}  
                        projects={projects}
                        flash={flash}
                        onMonthChange={(month) => handleFilterChange(month, selectedYear)}
                        onYearChange={(year) => handleFilterChange(selectedMonth, year)}
                        onSearchChange={setSearchInput}
                        onStatusChange={handleStatusFilterChange}
                        onPerPageChange={handlePerPageChange}
                        isRPMO={isRPMO}
                        offices={offices}
                        officeFilter={officeFilter}
                        onOfficeChange={handleOfficeChange}
                        withWithdrawn={withWithdrawn}
                        onWithdrawnToggle={handleWithdrawnToggle}
                        withTerminated={withTerminated}
                        onTerminatedToggle={handleTerminatedToggle}
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
                                            Check Number & Date
                                        </div>
                                    </th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <ReceiptText className="w-4 h-4" />
                                            OR Number & Date
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
                                            renderUpdatedBy={renderUpdatedBy}
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
                                    renderUpdatedBy={renderUpdatedBy}
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

            {/* Sync Modal */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
                        {isSyncing ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-4">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
                                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <HandCoins className="w-6 h-6 text-purple-500" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-semibold text-gray-900">Syncing refunds from Google Sheets…</p>
                                    <p className="text-sm text-gray-500 mt-1">This may take a few seconds. Please wait.</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <span key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sync Refunds from Google Sheets?</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            This will <span className="font-semibold text-yellow-700">upsert refund records</span> matched
                                            by project title. Restructuring rows will automatically fill all months in the stated range
                                            with <span className="font-mono text-xs bg-gray-100 px-1 rounded">restructured</span> status.
                                        </p>
                                        <p className="text-sm text-yellow-700 font-medium bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                            Existing refund records for matching months will be overwritten. Proceed only if
                                            the spreadsheet data is up to date.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowSyncModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsSyncing(true);
                                            router.post('/refunds/sync', {}, {
                                                onFinish: () => { setIsSyncing(false); setShowSyncModal(false); },
                                                onError: () => { setIsSyncing(false); setShowSyncModal(false); },
                                            });
                                        }}
                                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm">
                                        Yes, Sync Now
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}