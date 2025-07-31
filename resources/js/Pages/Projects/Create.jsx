import { useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Create({ companies }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data, setData, post, processing, errors } = useForm({
    project_id: '',
    project_title: '',
    company_id: '',
    phase_one: '',
    phase_two: '',
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

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
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

              <div>
                <label className="block font-medium">Phase One</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="e.g., March 2025 to December 2025"
                  value={data.phase_one}
                  onChange={(e) => setData('phase_one', e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium">Phase Two</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="e.g., March 2026 to March 2029"
                  value={data.phase_two}
                  onChange={(e) => setData('phase_two', e.target.value)}
                />
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
