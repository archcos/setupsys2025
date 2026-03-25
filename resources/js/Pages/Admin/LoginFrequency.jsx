import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Download, CheckCircle, Building2, SlidersHorizontal, X, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{payload[0].value} logins</p>
      </div>
    );
  }
  return null;
};

export default function LoginFrequencyIndex() {
  const {
    records, chartData, officeChartData, offices, flash,
    filter: initialFilter, selectedOffice: initialOffice,
    selectedYear: initialYear, availableYears
  } = usePage().props;

  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [filter, setFilter] = useState(initialFilter || 'daily');
  const [selectedOffice, setSelectedOffice] = useState(initialOffice || 'all');
  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const t = setTimeout(() => setFlashMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [flash]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/login-frequency', { filter, office: selectedOffice, year: selectedYear }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [filter, selectedOffice, selectedYear]);

  const handleDownload = () => {
    const params = new URLSearchParams({ filter, office: selectedOffice, year: selectedYear });
    window.location.href = `/login-frequency/download?${params.toString()}`;
  };

  const formattedData = Array.isArray(chartData)
    ? chartData
    : (chartData && typeof chartData === 'object' ? Object.values(chartData) : []);

  const formattedOfficeData = Array.isArray(officeChartData)
    ? officeChartData
    : (officeChartData && typeof officeChartData === 'object' ? Object.values(officeChartData) : []);

  const totalLogins = records?.reduce((sum, r) => sum + (r.login_count || 0), 0) || 0;
  const uniqueUsers = new Set(records?.map(r => r.user?.name)).size || 0;

  return (
    <main className="min-h-screen">
      <Head title="Login Frequency" />

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Login Frequency</h1>
            <p className="text-sm mt-1">Track user login activity by day, month, or year</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Report</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
          {[
            { label: 'Total Logins', value: totalLogins.toLocaleString(), icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-100' },
            { label: 'Unique Users', value: uniqueUsers.toLocaleString(), icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-100' },
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

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
          <div className="flex items-center gap-3 p-3 md:p-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilters ? 'bg-sky-50 border-sky-200 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* Always-visible quick selects */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {[
                {
                  value: filter, onChange: setFilter,
                  options: [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]
                },
                {
                  value: selectedYear, onChange: setSelectedYear,
                  options: availableYears?.map(y => [y, y]) || []
                },
              ].map(({ value, onChange, options }, i) => (
                <select
                  key={i}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="px-6 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors"
                >
                  {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-gray-100 pt-3 bg-gray-50/50">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Office</label>
              <div className="relative max-w-xs">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <select
                  value={selectedOffice}
                  onChange={e => setSelectedOffice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors"
                >
                  <option value="all">All Offices</option>
                  {offices?.map(o => (
                    <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          {/* Bar Chart — takes 2/3 */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Login Activity Overview</h2>
              <span className="text-xs text-gray-400 capitalize">{filter}</span>
            </div>
            {formattedData.length > 0 ? (
              <div className="w-full h-60 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="No login data available for this period." />
            )}
          </div>

          {/* Pie Chart — takes 1/3 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">By Office</h2>
            </div>
            {formattedOfficeData.length > 0 ? (
              <div className="w-full h-60 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedOfficeData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={75}
                      dataKey="count"
                    >
                      {formattedOfficeData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="No office data available." />
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['User', 'Office', 'Login Date', 'Login Count'].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 3 ? 'text-center' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records?.length > 0 ? records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{r.user?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{r.office?.office_name || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{r.login_date}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                        {r.login_count}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">No records found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {records?.length > 0 ? records.map((r) => (
              <div key={r.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.user?.name || '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.office?.office_name || '—'} · {r.login_date}</p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                  {r.login_count}
                </span>
              </div>
            )) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No records found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center h-48 text-center">
      <div>
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-5 h-5 text-gray-300" />
        </div>
        <p className="text-xs text-gray-400">{message}</p>
      </div>
    </div>
  );
}