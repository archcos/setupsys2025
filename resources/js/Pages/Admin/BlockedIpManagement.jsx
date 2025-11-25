import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import { Shield, Search, Download, CheckCircle, XCircle, PlusCircle, RotateCcw, X, Menu } from 'lucide-react';

export default function BlockedIpManagement({ blockedIps, filters }) {
  const { flash } = usePage().props;
  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [search, setSearch] = useState(filters?.search || '');
  const [filter, setFilter] = useState(filters?.filter || 'active');
  const [form, setForm] = useState({ ip: '', reason: '', duration: 1, unit: 'days' });
  const [showModal, setShowModal] = useState(false);
  const [blockAgainData, setBlockAgainData] = useState({ id: null, duration: 1, unit: 'days' });
  const [showFormMobile, setShowFormMobile] = useState(false);

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const timer = setTimeout(() => setFlashMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/blocked-ips', { search, filter }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search, filter]);

  const handleBlock = (e) => {
    e.preventDefault();
    router.post('/blocked-ips', form, {
      onSuccess: () => {
        setForm({ ip: '', reason: '', duration: 1, unit: 'days' });
        setShowFormMobile(false);
      },
    });
  };

  const handleUnblock = (id) => {
    if (!confirm('Unblock this IP address?')) return;
    router.post(`/blocked-ips/${id}/unblock`);
  };

  const handleBlockAgain = (id) => {
    setBlockAgainData({ id, duration: 1, unit: 'days' });
    setShowModal(true);
  };

  const confirmBlockAgain = () => {
    const { id, duration, unit } = blockAgainData;
    router.post(`/blocked-ips/${id}/block-again`, { duration: parseInt(duration), unit }, {
      onSuccess: () => setShowModal(false),
    });
  };

  const handleDownload = () => {
    window.location.href = '/blocked-ips/download';
  };

  const isExpired = (blockedUntil) => new Date(blockedUntil) < new Date();

  return (
    <main className="flex-1 min-h-screen">
      <Head title="Blocked IP Management" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Flash Message */}
        {flashMessage && (
          <div className="fixed top-4 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 md:w-auto bg-green-500 text-white px-4 md:px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{flashMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="p-2 md:p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">Blocked IPs</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1 hidden sm:block">Monitor, block, and unblock IP addresses</p>
          </div>
        </div>

        {/* Add IP Form - Toggle on Mobile */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 mb-6">
          <button
            onClick={() => setShowFormMobile(!showFormMobile)}
            className="md:hidden w-full flex items-center justify-between text-left font-semibold text-gray-900 mb-4"
          >
            <span>Block IP Address</span>
            <Menu className="w-5 h-5" />
          </button>

          <div className={`${showFormMobile ? 'block' : 'hidden'} md:block space-y-3 md:space-y-0 md:grid md:grid-cols-5 md:gap-4`}>
            <input
              type="text"
              value={form.ip}
              onChange={(e) => setForm({ ...form, ip: e.target.value })}
              placeholder="IP address"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
              required
            />
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason (optional)"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
            />
            <input
              type="number"
              min="1"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="Duration"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
              required
            />
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="border text-sm border-gray-200 rounded-lg md:rounded-xl px-3 md:px-3 py-2 md:py-3 bg-gray-50 focus:ring-2 focus:ring-red-500"
            >
              <option value="days">Days</option>
              <option value="hours">Hours</option>
            </select>
            <button
              onClick={handleBlock}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium px-3 md:px-4 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl hover:from-red-600 hover:to-red-700 transition-all"
            >
              <PlusCircle className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Block IP</span><span className="sm:hidden">Block</span>
            </button>
          </div>
        </div>

        {/* Search + Filter + Download */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-4">
          <div className="flex items-center gap-2 md:gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-gray-50"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border text-sm border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-red-500"
            >
              <option value="active">Blocked</option>
              <option value="expired">Expired</option>
              <option value="all">All</option>
            </select>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 text-sm md:text-base w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">CSV</span><span className="sm:hidden">Export</span>
          </button>
        </div>

        {/* Table - Card View on Mobile */}
        <div className="space-y-3 md:space-y-0">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">IP Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Blocked Until</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIps.data.length > 0 ? (
                  blockedIps.data.map((ip, i) => {
                    const expired = ip.blocked_until && isExpired(ip.blocked_until);
                    return (
                      <tr key={ip.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{ip.ip}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm">{ip.reason || '—'}</td>
                        <td className={`px-6 py-4 text-sm ${expired ? 'text-red-500' : 'text-gray-600'}`}>
                          {ip.blocked_until ? new Date(ip.blocked_until).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!expired ? (
                            <button
                              onClick={() => handleUnblock(ip.id)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              title="Unblock IP"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockAgain(ip.id)}
                              className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                              title="Re-block IP"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500">
                      No blocked IPs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {blockedIps.data.length > 0 ? (
              blockedIps.data.map((ip) => {
                const expired = ip.blocked_until && isExpired(ip.blocked_until);
                return (
                  <div key={ip.id} className="bg-white rounded-lg shadow border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm md:text-base break-all">{ip.ip}</p>
                        {ip.reason && <p className="text-xs text-gray-600 mt-1">{ip.reason}</p>}
                      </div>
                      {!expired ? (
                        <button
                          onClick={() => handleUnblock(ip.id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex-shrink-0"
                          title="Unblock IP"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockAgain(ip.id)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors flex-shrink-0"
                          title="Re-block IP"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className={`text-xs ${expired ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                      {ip.blocked_until ? new Date(ip.blocked_until).toLocaleString() : '—'}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p className="text-sm">No blocked IPs found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {blockedIps.links.length > 1 && (
          <div className="flex justify-center md:justify-end gap-2 mt-6 flex-wrap">
            {blockedIps.links.map((link, i) => (
              <button
                key={i}
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg border transition-colors ${
                  link.active
                    ? 'bg-red-600 text-white border-red-600'
                    : link.url
                      ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Re-Block Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-sm relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg md:text-xl font-semibold mb-4">Re-block IP</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <input
                  type="number"
                  min="1"
                  value={blockAgainData.duration}
                  onChange={(e) => setBlockAgainData({ ...blockAgainData, duration: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <select
                  value={blockAgainData.unit}
                  onChange={(e) => setBlockAgainData({ ...blockAgainData, unit: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlockAgain}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}