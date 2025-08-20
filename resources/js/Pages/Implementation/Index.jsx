import { useEffect, useState } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Search,
  ClipboardList,
  Building2,
  FolderOpen,
  Eye,
  ChevronRight,
  ChevronLeft,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function ImplementationIndex({ implementations, filters }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      router.get('/implementation', { search, perPage }, { preserveState: true, replace: true });
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search, perPage]);

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
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
      return { status: 'complete', label: 'Complete', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
    } else if (impl.tarp || impl.pdc || impl.liquidation) {
      return { status: 'in-progress', label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock };
    } else {
      return { status: 'pending', label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle };
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

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Implementation Checklists" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Implementation Checklists</h1>
                  <p className="text-gray-600 mt-1">Manage and track project implementation progress</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Projects</p>
                      <p className="text-2xl font-bold text-gray-900">{implementations.total}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FolderOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Complete</p>
                      <p className="text-2xl font-bold text-green-600">
                        {implementations.data.filter(impl => {
                          const status = getCompletionStatus(impl);
                          return status.status === 'complete';
                        }).length}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {implementations.data.filter(impl => {
                          const status = getCompletionStatus(impl);
                          return status.status === 'in-progress';
                        }).length}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {implementations.data.filter(impl => {
                          const status = getCompletionStatus(impl);
                          return status.status === 'pending';
                        }).length}
                      </p>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by project title or company name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Show</label>
                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">entries</span>
                </div>
              </div>
            </div>

            {/* Content */}
            {implementations.data.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No implementations found</h3>
                  <p className="text-gray-500 mb-6">
                    {search ? 
                      `No implementations match your search for "${search}". Try adjusting your search terms.` :
                      "There are no implementation checklists available at the moment."
                    }
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Implementation Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {implementations.data.map((impl) => {
                    const status = getCompletionStatus(impl);
                    const StatusIcon = status.icon;
                    const taggingProgress = getTaggingProgress(impl);
                    
                    return (
                      <div
                        key={impl.implement_id}
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                      >
                        {/* Card Header */}
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-100 rounded-lg">
                                <FolderOpen className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                {status.label}
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {impl.project?.project_title ?? 'No Title'}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{impl.project?.company?.company_name ?? 'N/A'}</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4">
                          {/* Project Cost */}
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Project Cost</span>
                            </div>
                            <span className="font-bold text-green-600">₱{getProjectCost(impl)}</span>
                          </div>

                          {/* Tagging Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700">Tagging Progress</span>
                              <span className="font-bold text-blue-600">{taggingProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${taggingProgress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* File Status */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${impl.tarp ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {impl.tarp ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">Tarp</span>
                            </div>
                            <div className="text-center">
                              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${impl.pdc ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {impl.pdc ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">PDC</span>
                            </div>
                            <div className="text-center">
                              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${impl.liquidation ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {impl.liquidation ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">Report</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-6 pt-0">
                          <Link
                            href={`/implementation/checklist/${impl.implement_id}`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            <Eye className="w-4 h-4" />
                            View Checklist
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {((implementations.current_page - 1) * implementations.per_page) + 1} to{' '}
                      {Math.min(implementations.current_page * implementations.per_page, implementations.total)} of{' '}
                      {implementations.total} results
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {implementations.links.map((link, index) => {
                        if (link.label.includes('Previous')) {
                          return (
                            <button
                              key={index}
                              disabled={!link.url}
                              onClick={() => link.url && handlePageChange(link.url)}
                              className={`p-2 rounded-lg transition-colors ${
                                link.url
                                  ? 'text-gray-600 hover:bg-gray-100'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                          );
                        }
                        
                        if (link.label.includes('Next')) {
                          return (
                            <button
                              key={index}
                              disabled={!link.url}
                              onClick={() => link.url && handlePageChange(link.url)}
                              className={`p-2 rounded-lg transition-colors ${
                                link.url
                                  ? 'text-gray-600 hover:bg-gray-100'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          );
                        }
                        
                        return (
                          <button
                            key={index}
                            disabled={!link.url}
                            onClick={() => link.url && handlePageChange(link.url)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              link.active
                                ? 'bg-blue-500 text-white shadow-lg'
                                : link.url
                                ? 'text-gray-600 hover:bg-gray-100'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {link.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}