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
import { Calendar, Download, CheckCircle, Building2 } from 'lucide-react';

// Color palette for pie chart
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];

export default function LoginFrequencyIndex() {
  const { records, chartData, officeChartData, offices, flash, filter: initialFilter, selectedOffice: initialOffice, selectedYear: initialYear, availableYears } = usePage().props;
  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [filter, setFilter] = useState(initialFilter || 'daily');
  const [selectedOffice, setSelectedOffice] = useState(initialOffice || 'all');
  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const timer = setTimeout(() => setFlashMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // ✅ Trigger reload when filter/office/year changes
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
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="Login Frequency" />

      <div className="max-w-7xl mx-auto">
        {/* Flash Message */}
        {flashMessage && (
          <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {flashMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Login Frequency</h1>
            <p className="text-gray-600 mt-1">
              Track user login activity by day, month, or year
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 pr-7 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 pr-7 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              {availableYears && availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="border border-gray-200 rounded-xl pl-10 pr-7 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 min-w-[200px]"
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
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl shadow hover:from-blue-600 hover:to-blue-700"
          >
            <Download className="w-4 h-4" /> Download Frequency Report
          </button>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Login Activity Overview</h2>
          {formattedData && formattedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No login data available for this period.
            </p>
          )}
        </div>

        {/* Office Distribution Pie Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Login Distribution by Office</h2>
          </div>
          {formattedOfficeData && formattedOfficeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={formattedOfficeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {formattedOfficeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No office distribution data available.
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Office
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Login Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Login Count
                </th>
              </tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? (
                records.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {r.user?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {r.office?.office_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.login_date}</td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">
                      {r.login_count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}