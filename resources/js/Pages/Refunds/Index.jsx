import { useState } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Search,
  RefreshCw,
  DollarSign,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  Download,
  Eye,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function Index({ refunds, months, selectedMonth, selectedStatus }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [month, setMonth] = useState(selectedMonth);
  const [statusFilter, setStatusFilter] = useState(selectedStatus);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(usePage().props.perPage || 10);

  const flash = usePage().props?.flash || {};

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFilterChange = (type, value) => {
    const updatedMonth = type === 'month' ? value : month;
    const updatedStatus = type === 'status' ? value : statusFilter;

    setMonth(updatedMonth);
    setStatusFilter(updatedStatus);

    router.get('/refunds', {
      month: updatedMonth,
      status: updatedStatus,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    router.get('/refunds', {
      month,
      status: statusFilter,
      search: e.target.value,
      perPage,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handlePerPageChange = (e) => {
    setPerPage(e.target.value);
    router.get('/refunds', {
      month,
      status: statusFilter,
      search,
      perPage: e.target.value,
    }, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleStatusChange = (id, status, refund) => {
    const payload = {
      status,
      project_code: refund.project_code,
      company_name: refund.company_name,
      refund_date: refund.refund_date,
    };

    router.post(`/refunds/${id || 0}/update-status`, payload, {
      preserveScroll: true,
    });
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    router.post('/refunds/sync', {}, {
      preserveScroll: true,
      preserveState: true,
      onFinish: () => setIsSyncing(false),
    });
  };

  if (!refunds || !months) {
    return (
      <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load refunds. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusStats = () => {
    const data = refunds.data || [];
    const total = data.length;
    const paid = data.filter(r => r.status === 'paid').length;
    const unpaid = data.filter(r => r.status === 'unpaid').length;
    
    return { total, paid, unpaid };
  };

  const stats = getStatusStats();

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Refund Monitoring" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Refund Monitoring</h1>
                    <p className="text-gray-600 mt-1">Track and manage project refund status</p>
                  </div>
                </div>
                
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg ${
                    isSyncing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync CSV Data'}
                </button>
              </div>

              {/* Flash Messages */}
              {flash.success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">{flash.success}</p>
                  </div>
                </div>
              )}
              
              {flash.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 font-medium">{flash.error}</p>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Refunds</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Paid</p>
                      <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Unpaid</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.unpaid}</p>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Filter className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Filters & Search</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Month Filter */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Select Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    {[...months]
                      .sort((a, b) => {
                        const parse = (s) => new Date(`1 ${s.replace(' ,', ',')}`);
                        return parse(b) - parse(a);
                      })
                      .map((m, i) => (
                        <option key={i} value={m}>{m}</option>
                      ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <BarChart3 className="w-4 h-4 inline mr-1" />
                    Filter Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid Only</option>
                    <option value="unpaid">Unpaid Only</option>
                  </select>
                </div>

                {/* Search */}
                <div className="lg:col-span-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={handleSearch}
                      placeholder="Search project or company..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Per Page */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Show Entries</label>
                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sync Loading Indicator */}
              {isSyncing && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Syncing CSV data, please wait...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Refunds Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Refund Records</h2>
                </div>
              </div>

              {refunds.data && refunds.data.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No refunds found</h3>
                    <p className="text-gray-500 mb-6">
                      {search || statusFilter !== 'all' ? 
                        'No refunds match your current filters. Try adjusting your search criteria.' :
                        'No refund records available for the selected month.'
                      }
                    </p>
                    {(search || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearch('');
                          handleFilterChange('status', 'all');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>#</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>Project Code</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>Business Name</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Refund Date</span>
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Status</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {refunds.data && refunds.data.map((refund, index) => (
                          <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{refund.project_code}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{refund.company_name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">{refund.refund_date}</div>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={refund.status}
                                onChange={(e) => handleStatusChange(refund.id, e.target.value, refund)}
                                className={`px-3 py-2 rounded-lg border-0 text-sm font-medium focus:ring-2 transition-all duration-200 cursor-pointer
                                  ${refund.status === 'paid'
                                    ? 'bg-green-100 text-green-800 focus:ring-green-500'
                                    : 'bg-amber-100 text-amber-800 focus:ring-amber-500'
                                  }`}
                              >
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="p-6 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        Showing {refunds.from || 0} to {refunds.to || 0} of {refunds.total || 0} results
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {refunds.links && refunds.links.map((link, i) => {
                          if (link.label.includes('Previous')) {
                            return (
                              <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
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
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
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
                              key={i}
                              disabled={!link.url}
                              onClick={() => link.url && router.visit(link.url)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                link.active
                                  ? 'bg-blue-500 text-white shadow-lg'
                                  : link.url
                                  ? 'text-gray-600 hover:bg-gray-100'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}