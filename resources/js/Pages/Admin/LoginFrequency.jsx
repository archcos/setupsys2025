import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Calendar, Download, CheckCircle, Building2, Menu, X } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];

export default function LoginFrequencyIndex() {
  const { records, chartData, officeChartData, offices, flash, filter: initialFilter, selectedOffice: initialOffice, selectedYear: initialYear, availableYears } = usePage().props;
  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [filter, setFilter] = useState(initialFilter || 'daily');
  const [selectedOffice, setSelectedOffice] = useState(initialOffice || 'all');
  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const timer = setTimeout(() => setFlashMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(
        '/login-frequency',
        { filter, office: selectedOffice, year: selectedYear },
        { preserveState: true, replace: true }
      );
    }, 400);
    return () => clearTimeout(delay);
  }, [filter, selectedOffice, selectedYear]);

  const handleDownload = () => {
    const params = new URLSearchParams({
      filter,
      office: selectedOffice,
      year: selectedYear
    });
    window.location.href = `/login-frequency/download?${params.toString()}`;
  };

  const formattedData = Array.isArray(chartData) 
    ? chartData 
    : (chartData && typeof chartData === 'object' 
      ? Object.values(chartData) 
      : []);

  const formattedOfficeData = Array.isArray(officeChartData) 
    ? officeChartData 
    : (officeChartData && typeof officeChartData === 'object' 
      ? Object.values(officeChartData) 
      : []);

  return (
    <main className="flex-1 min-h-screen">
      <Head title="Login Frequency" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Flash Message */}
        {flashMessage && (
          <div className="fixed top-4 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 md:w-auto bg-green-500 text-white px-4 md:px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{flashMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">Login Frequency</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1 hidden sm:block">Track user login activity by day, month, or year</p>
          </div>
        </div>

        {/* Filters - Mobile Toggle */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 mb-4 md:mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full flex items-center justify-between font-semibold text-gray-900 mb-4"
          >
            <span>Filters</span>
            {showFilters ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4 md:flex-wrap`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-3 flex-wrap">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full md:w-auto text-sm border border-gray-200 rounded-lg md:rounded-xl px-3 pr-7 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full md:w-auto text-sm border border-gray-200 rounded-lg md:rounded-xl px-3 pr-7 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                {availableYears && availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <div className="w-full md:w-auto relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg md:rounded-xl pl-10 pr-7 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Offices</option>
                  {offices && offices.map((office) => (
                    <option key={office.office_id} value={office.office_id}>
                      {office.office_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl shadow hover:from-blue-600 hover:to-blue-700 text-sm md:text-base"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download Report</span><span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-4 md:mb-8">
          <h2 className="text-base md:text-xl font-semibold mb-4">Login Activity Overview</h2>
          {formattedData && formattedData.length > 0 ? (
            <div className="w-full h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10 text-sm">
              No login data available for this period.
            </p>
          )}
        </div>

        {/* Office Distribution Pie Chart */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3 mb-4">
            <Building2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
            <h2 className="text-base md:text-xl font-semibold">Login Distribution by Office</h2>
          </div>
          {formattedOfficeData && formattedOfficeData.length > 0 ? (
            <div className="w-full h-64 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedOfficeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {formattedOfficeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10 text-sm">
              No office distribution data available.
            </p>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Office</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Login Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Login Count</th>
              </tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? (
                records.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900 text-sm">{r.user?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-700 text-sm">{r.office?.office_name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{r.login_date}</td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600 text-sm">{r.login_count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500 text-sm">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {records && records.length > 0 ? (
            records.map((r) => (
              <div key={r.id} className="bg-white rounded-lg shadow border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm break-words">{r.user?.name || '—'}</p>
                    {r.office?.office_name && <p className="text-xs text-gray-600 mt-1">{r.office.office_name}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-600 mb-1">Count</p>
                    <p className="font-semibold text-blue-600">{r.login_count}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{r.login_date}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No records found.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}