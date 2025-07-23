import { useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Create({ companies }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [itemWarning, setItemWarning] = useState('');

  const { data, setData, post, processing, errors } = useForm({
    project_title: '',
    company_id: '',
    phase_one: '',
    phase_two: '',
    project_cost: '',
    items: [
      { item_name: '', specifications: '', item_cost: '', quantity: '' },
    ],
  });

  const addItem = () => {
    setData('items', [
      ...data.items,
      { item_name: '', specifications: '', item_cost: '', quantity: '' },
    ]);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...data.items];
    updatedItems[index][field] = value;
    setData('items', updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = data.items.filter((_, i) => i !== index);
    setData('items', updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const allItemsValid = data.items.every(
      (item) =>
        item.item_name.trim() !== '' &&
        item.specifications.trim() !== '' &&
        item.item_cost !== '' &&
        item.quantity !== ''
    );

    if (!allItemsValid) {
      setItemWarning('Please complete all item details before submitting.');
      return;
    }

    setItemWarning('');
    post('/projects');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6 max-w-xl mx-auto">
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
                <label className="block font-medium">Select Company</label>
                <input
                  type="text"
                  placeholder="Search company..."
                  className="w-full p-2 border rounded mb-1"
                  onChange={(e) =>
                    setData(
                      'company_id',
                      companies.find((c) =>
                        c.company_name.toLowerCase().includes(e.target.value.toLowerCase())
                      )?.company_id || ''
                    )
                  }
                />
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
                  placeholder='eg. March 2025 to December 2025'
                  value={data.phase_one}
                  onChange={(e) => setData('phase_one', e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium">Phase Two</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder='eg. March 2026 to March 2029'
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

              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium mb-2">Project Items</h3>

                {itemWarning && (
                  <div className="mb-4 text-red-600 font-semibold">{itemWarning}</div>
                )}

                {data.items.map((item, index) => (
                  <div key={index} className="mb-4 border p-3 rounded bg-gray-50">
                    <div>
                      <label className="block text-sm font-medium">Item Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      />
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-medium">Specifications</label>
                      <textarea
                        className="w-full p-2 border rounded"
                        value={item.specifications}
                        onChange={(e) =>
                          updateItem(index, 'specifications', e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-medium">Item Cost</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={item.item_cost}
                        onChange={(e) => updateItem(index, 'item_cost', e.target.value)}
                      />
                    </div>

                    <div className="mt-2">
                      <label className="block text-sm font-medium">Quantity</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-2 text-red-600 text-sm hover:underline"
                    >
                      Remove Item
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Add Another Item
                </button>
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
