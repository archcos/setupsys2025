import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

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
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600">Failed to load refunds. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6">
            {flash.success && (
              <div className="mb-4 text-green-800 bg-green-100 border border-green-300 p-3 rounded">
                ✅ {flash.success}
              </div>
            )}
            {flash.error && (
              <div className="mb-4 text-red-800 bg-red-100 border border-red-300 p-3 rounded">
                ❌ {flash.error}
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Refunds</h2>
              <button
                onClick={handleManualSync}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isSyncing}
              >
                {isSyncing ? '⏳ Syncing...' : '🔄 Sync CSV (ONGOING only)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Month</label>
          <select
  value={month}
  onChange={(e) => handleFilterChange('month', e.target.value)}
  className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
>
  {[...months]
    .sort((a, b) => {
      // Fix format by removing space after comma: "Jul , 2025" => "Jul, 2025"
      const parse = (s) => new Date(`1 ${s.replace(' ,', ',')}`);
      return parse(b) - parse(a);
    })
    .map((m, i) => (
      <option key={i} value={m}>
        {m}
      </option>
    ))}
</select>


              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Filter Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {/* Loading Indicator */}
            {isSyncing && (
              <div className="mb-4 text-blue-600 text-sm flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 00-10 10h4z" />
                </svg>
                Syncing CSV, please wait...
              </div>
            )}

      {/* Refund Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Per Page Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Show</label>
            <select
              value={perPage}
              onChange={handlePerPageChange}
              className="block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="🔍 Search project or company"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>


            <table className="w-full text-sm text-left table-auto border">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="px-3 py-2 border">#</th>
                  <th className="px-3 py-2 border">Project Code</th>
                  <th className="px-3 py-2 border">Business Name</th>
                  <th className="px-3 py-2 border">Refund Date</th>
                  <th className="px-3 py-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-4">
                      No refunds found for this filter.
                    </td>
                  </tr>
                ) : (
                  refunds.data.map((refund, index) => (
                    <tr key={refund.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border">{index + 1}</td>
                      <td className="px-3 py-2 border">{refund.project_code}</td>
                      <td className="px-3 py-2 border">{refund.company_name}</td>
                      <td className="px-3 py-2 border">{refund.refund_date}</td>
                      <td className="px-3 py-2 border">
                        <select
                          value={refund.status}
                          onChange={(e) => handleStatusChange(refund.id, e.target.value, refund)}
                          className={`w-full px-3 py-1 rounded-lg border text-sm font-medium
                            ${refund.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'}`}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end gap-2">
              {refunds.links.map((link, i) => (
                <button
                  key={i}
                  disabled={!link.url}
                  onClick={() => link.url && router.visit(link.url)}
                  className={`px-3 py-1 rounded border text-sm ${
                    link.active
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span dangerouslySetInnerHTML={{ __html: link.label }} />
                </button>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
