import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Edit({ project, companies }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data, setData, put, processing, errors } = useForm({
    project_id: project.project_id,
    project_title: project.project_title || '',
    company_id: project.company_id || '',
    phase_one: project.phase_one || '',
    phase_two: project.phase_two || '',
    project_cost: project.project_cost || '',

    year_obligated: project.year_obligated || '',
    revenue: project.revenue || '',
    net_income: project.net_income || '',
    current_asset: project.current_asset || '',
    noncurrent_asset: project.noncurrent_asset || '',
    equity: project.equity || '',
    liability: project.liability || '',

    items: project.items || [],
  });

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...data.items];
    updatedItems[index][field] = value;
    setData('items', updatedItems);
  };

  const addItem = () => {
    setData('items', [
      ...data.items,
      { item_name: '', specifications: '', item_cost: '', quantity: 1 },
    ]);
  };

  const removeItem = (index) => {
    setData('items', data.items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/projects/${project.project_id}`);
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Project</h2>
              <Link href="/projects" className="text-blue-600 text-sm hover:underline">
                ← Back to Projects
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Title</label>
                  <input
                    type="text"
                    value={data.project_title}
                    onChange={(e) => setData('project_title', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.project_title && <div className="text-red-500 text-sm">{errors.project_title}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <select
                    value={data.company_id}
                    onChange={(e) => setData('company_id', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.company_id} value={company.company_id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                  {errors.company_id && <div className="text-red-500 text-sm">{errors.company_id}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phase One</label>
                  <input
                    type="text"
                    value={data.phase_one}
                    onChange={(e) => setData('phase_one', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.phase_one && <div className="text-red-500 text-sm">{errors.phase_one}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phase Two</label>
                  <input
                    type="text"
                    value={data.phase_two}
                    onChange={(e) => setData('phase_two', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.phase_two && <div className="text-red-500 text-sm">{errors.phase_two}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Cost</label>
                  <input
                    type="number"
                    step="any"
                    value={data.project_cost}
                    onChange={(e) => setData('project_cost', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.project_cost && <div className="text-red-500 text-sm">{errors.project_cost}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Year Obligated</label>
                  <input
                    type="text"
                    value={data.year_obligated}
                    onChange={(e) => setData('year_obligated', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.year_obligated && <div className="text-red-500 text-sm">{errors.year_obligated}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Revenue</label>
                  <input
                    type="number"
                    step="any"
                    value={data.revenue}
                    onChange={(e) => setData('revenue', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.revenue && <div className="text-red-500 text-sm">{errors.revenue}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Net Income</label>
                  <input
                    type="number"
                    step="any"
                    value={data.net_income}
                    onChange={(e) => setData('net_income', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.net_income && <div className="text-red-500 text-sm">{errors.net_income}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Asset</label>
                  <input
                    type="number"
                    step="any"
                    value={data.current_asset}
                    onChange={(e) => setData('current_asset', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.current_asset && <div className="text-red-500 text-sm">{errors.current_asset}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Noncurrent Asset</label>
                  <input
                    type="number"
                    step="any"
                    value={data.noncurrent_asset}
                    onChange={(e) => setData('noncurrent_asset', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.noncurrent_asset && <div className="text-red-500 text-sm">{errors.noncurrent_asset}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Equity</label>
                  <input
                    type="number"
                    step="any"
                    value={data.equity}
                    onChange={(e) => setData('equity', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.equity && <div className="text-red-500 text-sm">{errors.equity}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Liability</label>
                  <input
                    type="number"
                    step="any"
                    value={data.liability}
                    onChange={(e) => setData('liability', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  {errors.liability && <div className="text-red-500 text-sm">{errors.liability}</div>}
                </div>
              </div>

              {/* Items Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                {data.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 border p-3 rounded bg-gray-50"
                  >
                    {/* Item Name */}
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      className="p-2 border rounded"
                    />

                    {/* Item Cost */}
                    <input
                      type="number"
                      placeholder="Item Cost"
                      step="any"
                      value={item.item_cost}
                      onChange={(e) => handleItemChange(index, 'item_cost', e.target.value)}
                      className="p-2 border rounded"
                    />

                    {/* Quantity */}
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="p-2 border rounded"
                    />

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 text-sm hover:underline self-center"
                    >
                      Remove
                    </button>

                    {/* Specifications (Full width, below other fields) */}
                    <textarea
                      placeholder="Specifications"
                      value={item.specifications || ''}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                      className="md:col-span-4 p-2 border rounded resize-y min-h-[60px]"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 text-sm hover:underline mt-2"
                >
                  + Add Item
                </button>
              </div>

              <div className="pt-6">
              <button
                type="submit"
                disabled={processing}
                className={`px-4 py-2 rounded text-white text-sm ${processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {processing ? 'Updating...' : 'Update Company'}
              </button>

              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
