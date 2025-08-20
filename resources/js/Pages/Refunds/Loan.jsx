import { useState, useEffect, useRef } from 'react';
import { useForm, Head, router, usePage } from '@inertiajs/react';
import { Save, Search, DollarSign, Filter, Calendar, Building2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Loan({ projects, selectedMonth, selectedYear, search }) {
  const { flash } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savingProject, setSavingProject] = useState(null);
  const [searchInput, setSearchInput] = useState(search || '');

  const { data, setData, post, processing } = useForm({
    project_id: '',
    refund_amount: '',
    status: 'unpaid',
  });

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const delay = setTimeout(() => {
      handleFilterChange(selectedMonth, selectedYear, searchInput);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchInput]);

  useEffect(() => {
    if (projects?.data) {
      const initialData = {};
      projects.data.forEach((p) => {
        const latestLoan = p.loans?.[0];
        initialData[`refund_amount_${p.project_id}`] =
          latestLoan?.refund_amount ?? p.refund_amount ?? '';
        initialData[`status_${p.project_id}`] =
          latestLoan?.status ?? 'unpaid';
      });
      setData((prev) => ({ ...prev, ...initialData }));
    }
  }, [projects]);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleFilterChange = (month, year, searchValue) => {
    router.get('/loans', { month, year, search: searchValue }, { preserveScroll: true });
  };

  const handleSave = (projectId) => {
    const project = projects.data.find(p => p.project_id === projectId);
    const month = selectedMonth.toString().padStart(2, '0');
    const saveDate = `${selectedYear}-${month}-01`;

    setSavingProject(projectId);
    router.post('/loans/save', {
      project_id: projectId,
      refund_amount: data[`refund_amount_${projectId}`] ?? project.refund_amount ?? 0,
      status: data[`status_${projectId}`],
      save_date: saveDate,
    }, {
      preserveScroll: true,
      onFinish: () => setSavingProject(null),
    });
  };

  const getStatusIcon = (status) => {
    return status === 'paid' ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusColor = (status) => {
    return status === 'paid' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Head title="Loan Management" />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
                  <p className="text-gray-600 mt-1">Manage project loans and refund amounts</p>
                </div>
              </div>
            </div>

            {/* Flash Messages */}
            {flash.success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {flash.success}
              </div>
            )}
            {flash.error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                {flash.error}
              </div>
            )}

            {/* Filters Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Filter & Search</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleFilterChange(e.target.value, selectedYear, searchInput)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleFilterChange(selectedMonth, e.target.value, searchInput)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search Projects
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by project title or company..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Loans Table Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Project Loans</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {projects.data.length > 0 
                        ? `Showing ${projects.data.length} projects for ${months.find(m => m.value == selectedMonth)?.label} ${selectedYear}`
                        : 'No projects found for the selected period'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Project Details
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Refund Amount
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.data.length > 0 ? (
                      projects.data.map((p, idx) => {
                        const latestLoan = p.loans?.[0];
                        const currentStatus = data[`status_${p.project_id}`] ?? latestLoan?.status ?? 'unpaid';
                        
                        return (
                          <tr
                            key={p.project_id}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <h3 className="font-medium text-gray-900 leading-5 line-clamp-2">
                                  {p.project_title}
                                </h3>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{p.company.company_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <input
                                  type="number"
                                  value={data[`refund_amount_${p.project_id}`] ?? ''}
                                  onChange={(e) => setData(`refund_amount_${p.project_id}`, e.target.value)}
                                  className="pl-9 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(currentStatus)}
                                <select
                                  value={currentStatus}
                                  onChange={(e) => setData(`status_${p.project_id}`, e.target.value)}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${getStatusColor(currentStatus)}`}
                                >
                                  <option value="paid">Paid</option>
                                  <option value="unpaid">Unpaid</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleSave(p.project_id)}
                                disabled={processing && savingProject === p.project_id}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                                  processing && savingProject === p.project_id
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-lg'
                                }`}
                              >
                                {processing && savingProject === p.project_id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Save
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-gray-100 rounded-full">
                              <DollarSign className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
                              <p className="text-gray-500 mt-1">
                                No projects found for {months.find(m => m.value == selectedMonth)?.label} {selectedYear}.
                                {searchInput && ` Try adjusting your search term "${searchInput}".`}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {projects.links && projects.links.length > 3 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-center">
                    <div className="flex gap-1">
                      {projects.links.map((link, index) => (
                        <button
                          key={index}
                          disabled={!link.url}
                          onClick={() => router.get(link.url)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            link.active
                              ? 'bg-blue-600 text-white shadow-sm'
                              : link.url
                              ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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