import { useState, useEffect, useRef } from 'react';
import { useForm, Head, router, usePage } from '@inertiajs/react';
import { Save, Search } from 'lucide-react'; // icons
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
    return; // skip first render
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

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Head title="Loan Management" />

        <div className="p-4 space-y-4">
          {/* Flash messages */}
          {flash.success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-md">
              {flash.success}
            </div>
          )}
          {flash.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-md">
              {flash.error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-3 sticky top-0 z-10">
            <select
              value={selectedMonth}
             onChange={(e) => handleFilterChange(e.target.value, selectedYear, searchInput)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => handleFilterChange(selectedMonth, e.target.value, searchInput)}
              className="border border-gray-300 rounded-md px-3 pr-8 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm w-full"
              />
            </div>
          </div>

          {/* Loans table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="p-3 border-b">Project Title</th>
                  <th className="p-3 border-b">Company Name</th>
                  <th className="p-3 border-b">Refund Amount</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.data.length > 0 ? (
                  projects.data.map((p, idx) => {
                    const latestLoan = p.loans?.[0];
                    return (
                      <tr
                        key={p.project_id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="p-3 border-b">{p.project_title}</td>
                        <td className="p-3 border-b">{p.company.company_name}</td>
                        <td className="p-3 border-b">
                          <input
                            type="number"
                            value={data[`refund_amount_${p.project_id}`] ?? ''}
                            onChange={(e) => setData(`refund_amount_${p.project_id}`, e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full text-sm"
                          />
                        </td>
                        <td className="p-3 border-b">
                          <select
                            value={data[`status_${p.project_id}`] ?? latestLoan?.status ?? 'unpaid'}
                            onChange={(e) => setData(`status_${p.project_id}`, e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-full text-sm"
                          >
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                          </select>
                        </td>
                        <td className="p-3 border-b">
                          <button
                            onClick={() => handleSave(p.project_id)}
                            disabled={processing && savingProject === p.project_id}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                          >
                            <Save className="w-4 h-4" />
                            {processing && savingProject === p.project_id
                              ? 'Saving...'
                              : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-500">
                      No projects found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4 flex-wrap gap-1">
            {projects.links.map((link, index) => (
              <button
                key={index}
                disabled={!link.url}
                onClick={() => router.get(link.url)}
                className={`px-3 py-1.5 text-sm border rounded-md ${
                  link.active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-50'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
