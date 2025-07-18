import { useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Edit({ project, companies }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const normalizedItems = (project.items || []).map(item => ({
    item_name: item.item_name || '',
    specifications: item.specifications || '',
    item_cost: item.item_cost ?? '',
    quantity: item.quantity ?? '',
    }));

    const { data, setData, put, processing, errors } = useForm({
    project_title: project.project_title || '',
    company_id: project.company_id || '',
    phase_one: project.phase_one || '',
    phase_two: project.phase_two || '',
    project_cost: project.project_cost || '',
    items: normalizedItems,
    });


  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/projects/${project.project_id}`);
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
              <Link href="/projects" className="inline-block text-sm text-blue-600 hover:underline">
                ← Back to Projects
              </Link>
            </div>
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Title */}
              <div>
                <label className="block font-medium">Project Title</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={data.project_title}
                  onChange={(e) => setData('project_title', e.target.value)}
                />
                {errors.project_title && <div className="text-red-500 text-sm">{errors.project_title}</div>}
              </div>

              {/* Company Select */}
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
                {errors.company_id && <div className="text-red-500 text-sm">{errors.company_id}</div>}
              </div>

              {/* Phase One */}
              <div>
                <label className="block font-medium">Phase One</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={data.phase_one}
                  onChange={(e) => setData('phase_one', e.target.value)}
                />
              </div>

              {/* Phase Two */}
              <div>
                <label className="block font-medium">Phase Two</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={data.phase_two}
                  onChange={(e) => setData('phase_two', e.target.value)}
                />
              </div>

              {/* Project Cost */}
              <div>
                <label className="block font-medium">Project Cost</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={data.project_cost}
                  onChange={(e) => setData('project_cost', e.target.value)}
                />
              </div>

            <div>
                <label className="block font-medium mb-2">Items</label>

                {data.items.map((item, index) => (
                    <div key={index} className="border p-4 mb-4 rounded-md bg-gray-50 relative">
                    {/* Remove button */}
                    <button
                        type="button"
                        className="absolute top-2 right-2 text-red-500 font-bold"
                        onClick={() => {
                        const newItems = [...data.items];
                        newItems.splice(index, 1);
                        setData('items', newItems);
                        }}
                    >
                        ×
                    </button>

                    <div className="mb-2">
                        <label className="block text-sm">Item Name</label>
                        <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={item.item_name}
                        onChange={(e) =>
                            setData('items', data.items.map((i, idx) =>
                            idx === index ? { ...i, item_name: e.target.value } : i
                            ))
                        }
                        />
                    </div>

                    <div className="mb-2">
                        <label className="block text-sm">Specifications</label>
                        <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={item.specifications}
                        onChange={(e) =>
                            setData('items', data.items.map((i, idx) =>
                            idx === index ? { ...i, specifications: e.target.value } : i
                            ))
                        }
                        />
                    </div>

                    <div className="mb-2">
                        <label className="block text-sm">Item Cost</label>
                        <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={item.item_cost}
                        onChange={(e) =>
                            setData('items', data.items.map((i, idx) =>
                            idx === index ? { ...i, item_cost: e.target.value } : i
                            ))
                        }
                        />
                    </div>

                    <div>
                        <label className="block text-sm">Quantity</label>
                        <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={item.quantity}
                        onChange={(e) =>
                            setData('items', data.items.map((i, idx) =>
                            idx === index ? { ...i, quantity: e.target.value } : i
                            ))
                        }
                        />
                    </div>
                    </div>
                ))}

                {/* Add new item */}
                <button
                    type="button"
                    className="mt-2 text-blue-600 font-semibold"
                    onClick={() =>
                    setData('items', [
                        ...data.items,
                        { item_name: '', specifications: '', item_cost: '', quantity: '' },
                    ])
                    }
                >
                    + Add Item
                </button>
                </div>


              {/* Submit Button */}
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={processing}
              >
                Update Project
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
