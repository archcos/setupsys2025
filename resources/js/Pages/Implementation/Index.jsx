import { useEffect, useState } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      router.get('/implementation', { search, perPage }, { preserveState: true, replace: true });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handlePerPageChange = (e) => {
    const newPerPage = Number(e.target.value);
    setPerPage(newPerPage);
    router.get('/implementation', { search, perPage: newPerPage }, { preserveState: true, replace: true });
  };

  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      replace: true,
      only: ['implementations'],
      data: {
        search,
        perPage,
      },
    });
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
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
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

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-100 to-blue-400 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Implementation Checklists" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ClipboardList className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Implementation Management</h2>
                    <p className="text-sm text-gray-600 mt-1">Track project implementation progress and checklists</p>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="p-6 bg-gradient-to-r from-green-50/30 to-blue-50/30 border-b border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
                    <div className="text-sm text-gray-600">Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by project title or company..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
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
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 border border-gray-500 shadow-sm">
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
              </div>

              {/* Content Section */}
              {implementations.data.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <ClipboardList className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No implementations found</h3>
                      <p className="text-gray-500 text-sm">
                        {search ? `No implementations match your search "${search}"` : 'No implementation checklists have been created yet'}
                      </p>
                    </div>
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {implementations.data.map((impl) => {
                      const status = getCompletionStatus(impl);
                      const taggingProgress = getTaggingProgress(impl);
                      const untaggingStatus = getUntaggingStatus(impl);

                      return (
                        <div 
                          key={impl.implement_id} 
                          className="bg-gradient-to-br from-white to-gray-50 border border-gray-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1"
                        >
                          {/* Card Header */}
                          <div className="p-6 border-b border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                                </div>
                                {getStatusBadge(impl)}
                              </div>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 leading-5">
                              {impl.project?.project_title || 'No Title'}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 className="w-4 h-4" />
                              <span className="truncate">{impl.project?.company?.company_name || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-6 space-y-4">
                            {/* Tarp and PDC - First Row */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                  impl.tarp ? 'bg-green-100' : 'bg-gray-200'
                                }`}>
                                  {impl.tarp ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-700">Tarp</span>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                  impl.pdc ? 'bg-green-100' : 'bg-gray-200'
                                }`}>
                                  {impl.pdc ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-700">PDC</span>
                              </div>
                            </div>

                            {/* First Untag and Final Untag - Second Row */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                  untaggingStatus.firstUntagged ? 'bg-green-100' : 'bg-gray-200'
                                }`}>
                                  {untaggingStatus.firstUntagged ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-700 block">First Untag</span>
                                <span className="text-xs text-gray-500">(50%)</span>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                  untaggingStatus.finalUntagged ? 'bg-green-100' : 'bg-gray-200'
                                }`}>
                                  {untaggingStatus.finalUntagged ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-700 block">Final Untag</span>
                                <span className="text-xs text-gray-500">(100%)</span>
                              </div>
                            </div>

                            {/* Liquidation - Bottom Row (Full Width) */}
                            <div className="w-full">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                                  impl.liquidation ? 'bg-green-100' : 'bg-gray-200'
                                }`}>
                                  {impl.liquidation ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-700">Liquidation</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="p-6 pt-0">
                            <Link
                              href={`/implementation/checklist/${impl.implement_id}`}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
                            >
                              <Eye className="w-4 h-4" />
                              View Checklist
                              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {implementations.links && implementations.links.length > 1 && (
                <div className="bg-gradient-to-r from-gray-50/50 to-white px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {implementations.from || 1} to {implementations.to || implementations.data.length} of {implementations.total || implementations.data.length} results
                    </div>
                    <div className="flex gap-1">
                      {implementations.links.map((link, index) => (
                        <button
                          key={index}
                          disabled={!link.url}
                          onClick={() => link.url && handlePageChange(link.url)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                            link.active
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent shadow-md'
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
      </div>
    </div>
  );
}