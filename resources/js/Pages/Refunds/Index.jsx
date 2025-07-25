import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Index({ refunds, months, selectedMonth, selectedStatus }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [month, setMonth] = useState(selectedMonth);
  const [statusFilter, setStatusFilter] = useState(selectedStatus);
  const [isSyncing, setIsSyncing] = useState(false);

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

            {/* Refund Table */}
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
                  refunds.map((refund, index) => (
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
          </div>
        </main>
      </div>
    </div>
  );
}
