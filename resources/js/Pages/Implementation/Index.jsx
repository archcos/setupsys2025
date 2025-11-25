import { useEffect, useState } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import {
  Search,
  ClipboardList,
  Building2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  ArrowUpDown,
  X,
  FolderOpen,
  ChevronRight
} from 'lucide-react';

export default function ImplementationIndex({ implementations, filters }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [statusFilter, setStatusFilter] = useState(filters?.statusFilter || null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      router.get('/implementation', { search, perPage, statusFilter }, { preserveState: true, replace: true });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const handlePerPageChange = (e) => {
    const newPerPage = Number(e.target.value);
    setPerPage(newPerPage);
    router.get('/implementation', { search, perPage: newPerPage, statusFilter }, { preserveState: true, replace: true });
  };

  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      replace: true,
      only: ['implementations'],
      data: {
        search,
        perPage,
        statusFilter,
      },
    });
  };

  const handleStatClick = (status) => {
    setStatusFilter(statusFilter === status ? null : status);
  };

  const getCompletionStatus = (impl) => {
    const hasFiles = !!(impl.tarp && impl.pdc && impl.liquidation);
    const hasUntagging = !!(impl.first_untagged && impl.final_untagged);
    
    if (hasFiles && hasUntagging) {
      return { status: 'complete', label: 'Complete', icon: CheckCircle };
    } else if (impl.tarp || impl.pdc || impl.liquidation) {
      return { status: 'in-progress', label: 'In Progress', icon: Clock };
    } else {
      return { status: 'pending', label: 'Pending', icon: AlertTriangle };
    }
  };

  const getProjectCost = (impl) => {
    const cost = parseFloat(impl.project?.project_cost || 0);
    return cost.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  const getTaggingProgress = (impl) => {
    const totalTags = impl.tags?.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0) || 0;
    const projectCost = parseFloat(impl.project?.project_cost || 0);
    const percentage = projectCost > 0 ? (totalTags / projectCost) * 100 : 0;
    return Math.min(percentage, 100);
  };

  const getStatusBadge = (impl) => {
    const status = getCompletionStatus(impl);
    const StatusIcon = status.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        status.status === 'complete' 
          ? 'bg-green-100 text-green-800'
          : status.status === 'in-progress'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-amber-100 text-amber-800'
      }`}>
        <StatusIcon className="w-3 h-3" />
        {status.label}
      </span>
    );
  };

  const getUntaggingStatus = (impl) => {
    const totalTags = impl.tags?.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0) || 0;
    const projectCost = parseFloat(impl.project?.project_cost || 0);
    const firstUntaggedThreshold = projectCost * 0.5;
    
    const firstUntagged = totalTags >= firstUntaggedThreshold;
    const finalUntagged = totalTags >= projectCost;
    
    return { firstUntagged, finalUntagged, totalTags, projectCost };
  };

  const getStats = () => {
    const total = implementations.total || 0;
    const complete = implementations.data.filter(impl => getCompletionStatus(impl).status === 'complete').length;
    const inProgress = implementations.data.filter(impl => getCompletionStatus(impl).status === 'in-progress').length;
    const pending = implementations.data.filter(impl => getCompletionStatus(impl).status === 'pending').length;
    
    return { total, complete, inProgress, pending };
  };

  const stats = getStats();

  const filteredData = statusFilter
    ? implementations.data.filter(impl => getCompletionStatus(impl).status === statusFilter)
    : implementations.data;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Implementation Checklists" />
      <div className="max-w-7xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Implementation Management</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Track project implementation progress and checklists</p>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-green-50/30 to-blue-50/30 border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <button
                onClick={() => handleStatClick(null)}
                className={`text-center p-3 md:p-4 rounded-lg transition-all duration-200 ${
                  statusFilter === null
                    ? 'bg-gray-100 ring-2 ring-offset-2 ring-gray-500 shadow-md'
                    : 'hover:shadow-md hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs md:text-sm text-gray-600">Total Projects</div>
              </button>
              <button
                onClick={() => handleStatClick('complete')}
                className={`text-center p-3 md:p-4 rounded-lg transition-all duration-200 ${
                  statusFilter === 'complete'
                    ? 'bg-green-100 ring-2 ring-offset-2 ring-green-500 shadow-md'
                    : 'hover:shadow-md hover:bg-green-50 cursor-pointer'
                }`}
              >
                <div className="text-xl md:text-2xl font-bold text-green-600">{stats.complete}</div>
                <div className="text-xs md:text-sm text-gray-600">Complete</div>
              </button>
              <button
                onClick={() => handleStatClick('in-progress')}
                className={`text-center p-3 md:p-4 rounded-lg transition-all duration-200 ${
                  statusFilter === 'in-progress'
                    ? 'bg-blue-100 ring-2 ring-offset-2 ring-blue-500 shadow-md'
                    : 'hover:shadow-md hover:bg-blue-50 cursor-pointer'
                }`}
              >
                <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs md:text-sm text-gray-600">In Progress</div>
              </button>
              <button
                onClick={() => handleStatClick('pending')}
                className={`text-center p-3 md:p-4 rounded-lg transition-all duration-200 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-100 ring-2 ring-offset-2 ring-amber-500 shadow-md'
                    : 'hover:shadow-md hover:bg-amber-50 cursor-pointer'
                }`}
              >
                <div className="text-xl md:text-2xl font-bold text-amber-600">{stats.pending}</div>
                <div className="text-xs md:text-sm text-gray-600">Pending</div>
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
            <div className="flex flex-col gap-2 md:gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search company or project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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

          {/* Content Section - Desktop Table */}
          {filteredData.length === 0 ? (
            <div className="text-center py-8 md:py-12 px-4">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1">No implementations found</h3>
                  <p className="text-xs md:text-sm text-gray-500">
                    {search ? `No implementations match your search "${search}"` : statusFilter ? `No ${statusFilter} implementations found` : 'No implementation checklists have been created yet'}
                  </p>
                </div>
                {(search || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter(null);
                    }}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Signboard</th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PDC</th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">First Untagging</th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Final Untagging</th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Liquidation</th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((impl) => {
                      const untaggingStatus = getUntaggingStatus(impl);
                      
                      return (
                        <tr key={impl.implement_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="p-1.5 bg-indigo-100 rounded-lg mt-0.5 flex-shrink-0">
                                <FolderOpen className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-gray-900 text-xs md:text-sm mb-1 line-clamp-1">
                                  {impl.project?.project_title || 'No Title'}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Building2 className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{impl.project?.company?.company_name || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            {getStatusBadge(impl)}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {impl.tarp ? (
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 mx-auto" />
                            ) : (
                              <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {impl.pdc ? (
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 mx-auto" />
                            ) : (
                              <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {untaggingStatus.firstUntagged ? (
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 mx-auto" />
                            ) : (
                              <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {untaggingStatus.finalUntagged ? (
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 mx-auto" />
                            ) : (
                              <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            {impl.liquidation ? (
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 mx-auto" />
                            ) : (
                              <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                            <Link
                              href={`/implementation/checklist/${impl.implement_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow group"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredData.map((impl) => {
                  const untaggingStatus = getUntaggingStatus(impl);
                  
                  return (
                    <div key={impl.implement_id} className="p-3 space-y-3">
                      {/* Project Info */}
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg mt-0.5 flex-shrink-0">
                          <FolderOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 text-sm mb-0.5 line-clamp-2">
                            {impl.project?.project_title || 'No Title'}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{impl.project?.company?.company_name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {getStatusBadge(impl)}
                      </div>

                      {/* Checklist Items */}
                      <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Signboard</span>
                          {impl.tarp ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">PDC</span>
                          {impl.pdc ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">First Untagging</span>
                          {untaggingStatus.firstUntagged ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Final Untagging</span>
                          {untaggingStatus.finalUntagged ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Liquidation</span>
                          {impl.liquidation ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </div>

                      {/* View Button */}
                      <Link
                        href={`/implementation/checklist/${impl.implement_id}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Checklist
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {implementations.links && implementations.links.length > 1 && (
            <div className="bg-gradient-to-r from-gray-50/50 to-white px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {implementations.from || 1} to {implementations.to || filteredData.length} of {implementations.total || filteredData.length} results
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {implementations.links.map((link, index) => (
                    <button
                      key={index}
                      disabled={!link.url}
                      onClick={() => link.url && handlePageChange(link.url)}
                      className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
                        link.active
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent shadow-md'
                          : link.url
                          ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {link.label === "&laquo; Previous" ? "←" : link.label === "Next &raquo;" ? "→" : link.label}
                    </button>
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