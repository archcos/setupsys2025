import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import {
  Shield, Search, Download, CheckCircle, XCircle,
  PlusCircle, RotateCcw, X, ChevronLeft, ChevronRight,
  Clock, AlertTriangle
} from 'lucide-react';

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white outline-none transition-colors";

const fmtDate = (iso) => new Date(iso).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

export default function BlockedIpManagement({ blockedIps, filters }) {
  const { flash } = usePage().props;
  const [flashMessage, setFlashMessage]     = useState(flash?.success || null);
  const [search, setSearch]                 = useState(filters?.search || '');
  const [filter, setFilter]                 = useState(filters?.filter || 'active');
  const [form, setForm]                     = useState({ ip: '', reason: '', duration: 1, unit: 'days' });
  const [showModal, setShowModal]           = useState(false);
  const [blockAgainData, setBlockAgainData] = useState({ id: null, duration: 1, unit: 'days' });
  const [showAddForm, setShowAddForm]       = useState(false);

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const t = setTimeout(() => setFlashMessage(null), 3500);
      return () => clearTimeout(t);
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
      onSuccess: () => { setForm({ ip: '', reason: '', duration: 1, unit: 'days' }); setShowAddForm(false); },
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

  const isExpired = (blockedUntil) => new Date(blockedUntil) < new Date();

  const activeCount  = blockedIps.data.filter(ip => !isExpired(ip.blocked_until)).length;
  const expiredCount = blockedIps.data.filter(ip => ip.blocked_until && isExpired(ip.blocked_until)).length;

  return (
    <main className="min-h-screen">
      <Head title="Blocked IP Management" />

      {/* Toast */}
      {flashMessage && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          {flashMessage}
          <button onClick={() => setFlashMessage(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Blocked IPs</h1>
            <p className="text-sm mt-1">Monitor, block, and unblock IP addresses</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = '/blocked-ips/download'}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white bg-white transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showAddForm ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
            >
              {showAddForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">{showAddForm ? 'Cancel' : 'Block IP'}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
          {[
            { label: 'Currently Blocked', value: activeCount, icon: Shield, color: 'text-red-600', bg: 'bg-red-100' },
            { label: 'Expired Blocks', value: expiredCount, icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Add IP Form */}
        {showAddForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Block an IP Address
            </h2>
            <form onSubmit={handleBlock}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">IP Address <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.ip}
                    onChange={e => setForm({ ...form, ip: e.target.value })}
                    placeholder="e.g. 192.168.1.1"
                    className={inputCls}
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason</label>
                  <input
                    type="text"
                    value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })}
                    placeholder="Optional"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Unit</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className={inputCls}
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Block IP
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search + Filter bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search IP or reason…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white outline-none transition-colors"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="pr-6 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors"
          >
            <option value="active">Blocked</option>
            <option value="expired">Expired</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['IP Address', 'Reason', 'Blocked Until', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-center' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blockedIps.data.length > 0 ? blockedIps.data.map((ip) => {
                  const expired = ip.blocked_until && isExpired(ip.blocked_until);
                  return (
                    <tr key={ip.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {ip.ip}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {ip.reason || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {ip.blocked_until ? fmtDate(ip.blocked_until) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {expired ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {!expired ? (
                          <button
                            onClick={() => handleUnblock(ip.id)}
                            title="Unblock"
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockAgain(ip.id)}
                            title="Re-block"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">No blocked IPs found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {blockedIps.data.length > 0 ? blockedIps.data.map((ip) => {
              const expired = ip.blocked_until && isExpired(ip.blocked_until);
              return (
                <div key={ip.id} className="px-4 py-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {ip.ip}
                      </span>
                      {expired ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Blocked
                        </span>
                      )}
                    </div>
                    {ip.reason && <p className="text-xs text-gray-500 mt-1">{ip.reason}</p>}
                    {ip.blocked_until && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{fmtDate(ip.blocked_until)}
                      </p>
                    )}
                  </div>
                  {!expired ? (
                    <button onClick={() => handleUnblock(ip.id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0">
                      <XCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handleBlockAgain(ip.id)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex-shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No blocked IPs found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {blockedIps.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Showing {(blockedIps.current_page - 1) * blockedIps.per_page + 1}–{Math.min(blockedIps.current_page * blockedIps.per_page, blockedIps.total)} of {blockedIps.total}
              </p>
              <div className="flex gap-1">
                {blockedIps.links.map((link, i) => {
                  if (link.label === '&laquo; Previous') return (
                    <button key={i} disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url, { data: { search, filter }, preserveScroll: true, preserveState: true })}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  );
                  if (link.label === 'Next &raquo;') return (
                    <button key={i} disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url, { data: { search, filter }, preserveScroll: true, preserveState: true })}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                  return (
                    <button key={i} disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url, { data: { search, filter }, preserveScroll: true, preserveState: true })}
                      className={`min-w-[2rem] h-8 px-2 text-xs rounded-lg border transition-colors ${link.active ? 'bg-gray-900 border-gray-900 text-white font-medium' : 'border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40'}`}>
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Re-Block Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Re-block IP</h2>
                  <p className="text-xs text-gray-500">Set a new block duration</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={blockAgainData.duration}
                    onChange={e => setBlockAgainData({ ...blockAgainData, duration: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Unit</label>
                  <select
                    value={blockAgainData.unit}
                    onChange={e => setBlockAgainData({ ...blockAgainData, unit: e.target.value })}
                    className={inputCls}
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlockAgain}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Re-block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}