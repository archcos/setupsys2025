import { useForm, Link } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useState } from 'react';

export default function Create({ projects }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data, setData, post, errors } = useForm({
    project_id: '',
    activity_name: '',
    activity_date: '',
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/activities');
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4">
          <div className="bg-white rounded shadow p-6 max-w-2xl mx-auto">
                <div className="mb-4">
                    <Link href="/activities" className="inline-block text-sm text-blue-600 hover:underline">
                        ← Back to Activities
                    </Link>
                </div>
            <h2 className="text-xl font-semibold mb-4">Create Activity</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Project</label>
                <select
                  value={data.project_id}
                  onChange={(e) => setData('project_id', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_title}
                    </option>
                  ))}
                </select>
                {errors.project_id && <p className="text-red-500 text-sm">{errors.project_id}</p>}
              </div>

              <div>
                <label className="block mb-1">Activity Name</label>
                <input
                  type="text"
                  value={data.activity_name}
                  onChange={(e) => setData('activity_name', e.target.value)}
                  className="w-full p-2 border rounded"
                />
                {errors.activity_name && <p className="text-red-500 text-sm">{errors.activity_name}</p>}
              </div>

              <div>
                <label className="block mb-1">Activity Date</label>
               <input
                  type="month"
                  value={data.activity_date.slice(0, 7)} // Trim to "YYYY-MM" if needed
                  onChange={(e) => setData('activity_date', e.target.value + '-01')} // Append '-01' to make it a valid DATE
                  className="w-full p-2 border rounded"
                />
                {errors.activity_date && <p className="text-red-500 text-sm">{errors.activity_date}</p>}
              </div>

              <div className="flex justify-end gap-2">
                <Link href="/activities" className="px-4 py-2 border rounded">Cancel</Link>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
