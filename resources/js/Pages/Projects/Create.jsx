import { useForm, Link, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Create({ companies }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data, setData, post, processing, errors } = useForm({
    project_id: '',
    project_title: '',
    company_id: '',
    release_initial: '',
    release_end: '',
    refund_initial: '',
    refund_end: '',
    project_cost: '',
    progress: 'Project Created',
    year_obligated: new Date().getFullYear().toString(),
    revenue: '',
    net_income: '',
    current_asset: '',
    noncurrent_asset: '',
    equity: '',
    liability: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/projects');
  };
  

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);


   useEffect(() => {
    if (data.release_initial) {
      const [year, month] = data.release_initial.split('-').map(Number);
      const nextYear = year + 1;
      const newReleaseEnd = `${nextYear}-${month.toString().padStart(2, '0')}`;
      const newRefundInt = `${nextYear}-${month.toString().padStart(2, '0')}`;
      const newRefundeEnd = `${nextYear}-${month.toString().padStart(2, '0')}`;


      // Update release_end only if empty or before release_initial (optional)
      if (!data.release_end || data.release_end <= data.release_initial) {
        setData('release_end', newReleaseEnd);
      }
        if (!data.release_end || data.release_end <= data.release_initial) {
        setData('release_end', newReleaseEnd);
      }
        if (!data.release_end || data.release_end <= data.release_initial) {
        setData('release_end', newReleaseEnd);
      }
    }
  }, [data.release_initial]);

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Create Project" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
            <div className="mb-4">
              <Link
                href="/projects"
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                ← Back to Projects
              </Link>
            </div>
            <h2 className="text-xl font-semibold mb-4">Add New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Project Title</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={data.project_title}
                  onChange={(e) => setData('project_title', e.target.value)}
                />
                {errors.project_title && (
                  <div className="text-red-500 text-sm">{errors.project_title}</div>
                )}
              </div>

              <div>
                <label className="block font-medium">Project Code</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={data.project_id}
                  onChange={(e) => setData('project_id', e.target.value)}
                  required
                />
                {errors.project_id && (
                  <div className="text-red-500 text-sm">{errors.project_id}</div>
                )}
              </div>

              <div>
                <label className="block font-medium">Select Company</label>
                <select
                  className="w-full p-2 border rounded"
                  value={data.company_id}
                  onChange={(e) => setData('company_id', e.target.value)}
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <div className="text-red-500 text-sm">{errors.company_id}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Release Initial */}
                <div>
                  <label className="block font-medium">Release Initial</label>
                  <input
                    type="month"
                    className="w-full p-2 border rounded"
                    value={data.release_initial}
                    onChange={(e) => setData('release_initial', e.target.value)}
                  />
                  {errors.release_initial && (
                    <div className="text-red-500 text-sm">{errors.release_initial}</div>
                  )}
                </div>

                {/* Release End */}
                <div>
                  <label className="block font-medium">Release End</label>
                  <input
                    type="month"
                    className="w-full p-2 border rounded"
                    value={data.release_end}
                    onChange={(e) => setData('release_end', e.target.value)}
                  />
                  {errors.release_end && (
                    <div className="text-red-500 text-sm">{errors.release_end}</div>
                  )}
                </div>

                {/* Refund Initial */}
                <div>
                  <label className="block font-medium">Refund Initial</label>
                  <input
                    type="month"
                    className="w-full p-2 border rounded"
                    value={data.refund_initial}
                    onChange={(e) => setData('refund_initial', e.target.value)}
                  />
                  {errors.refund_initial && (
                    <div className="text-red-500 text-sm">{errors.refund_initial}</div>
                  )}
                </div>

                {/* Refund End */}
                <div>
                  <label className="block font-medium">Refund End</label>
                  <input
                    type="month"
                    className="w-full p-2 border rounded"
                    value={data.refund_end}
                    onChange={(e) => setData('refund_end', e.target.value)}
                  />
                  {errors.refund_end && (
                    <div className="text-red-500 text-sm">{errors.refund_end}</div>
                  )}
                </div>
              </div>


              <div>
                <label className="block font-medium">Project Cost</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={data.project_cost}
                  onChange={(e) => setData('project_cost', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Year Obligated</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={data.year_obligated}
                    onChange={(e) => setData('year_obligated', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium">Revenue</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={data.revenue}
                    onChange={(e) => setData('revenue', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium">Net Income</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={data.net_income}
                    onChange={(e) => setData('net_income', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium">Current Asset</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={data.current_asset}
                    onChange={(e) => setData('current_asset', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium">Non-Current Asset</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={data.noncurrent_asset}
                    onChange={(e) => setData('noncurrent_asset', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium">Equity</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={data.equity}
                    onChange={(e) => setData('equity', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium">Liability</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={data.liability}
                    onChange={(e) => setData('liability', e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={processing}
              >
                Save Project
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
