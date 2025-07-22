import { useForm, Link } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useState } from 'react';

export default function Create({ projects }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data, setData, post, errors } = useForm({
    project_id: '',
    activities: [
      { activity_name: '', start_date: '', end_date: '' }
    ],
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/activities');
  };

  const handleActivityChange = (index, field, value) => {
    const updatedActivities = [...data.activities];
    updatedActivities[index][field] = value;
    setData('activities', updatedActivities);
  };

  const addActivity = () => {
    setData('activities', [...data.activities, { activity_name: '', start_date: '', end_date: '' }]);
  };

  const removeActivity = (index) => {
    const updatedActivities = data.activities.filter((_, i) => i !== index);
    setData('activities', updatedActivities);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4">
          <div className="bg-white rounded shadow p-6 max-w-3xl mx-auto">
            <div className="mb-4">
              <Link href="/activities" className="inline-block text-sm text-blue-600 hover:underline">
                ← Back to Activities
              </Link>
            </div>
            <h2 className="text-xl font-semibold mb-4">Create Activities</h2>
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

              {data.activities.map((activity, index) => (
                <div key={index} className="border p-4 rounded bg-gray-50">
                  <h3 className="font-semibold mb-2">Activity {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1">Activity Name</label>
                      <input
                        type="text"
                        value={activity.activity_name}
                        onChange={(e) => handleActivityChange(index, 'activity_name', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Start Date</label>
                      <input
                        type="month"
                        value={activity.start_date.slice(0, 7)}
                        onChange={(e) => handleActivityChange(index, 'start_date', e.target.value + '-01')}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">End Date</label>
                      <input
                        type="month"
                        value={activity.end_date.slice(0, 7)}
                        onChange={(e) => handleActivityChange(index, 'end_date', e.target.value + '-01')}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                  {data.activities.length > 1 && (
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={addActivity}
                  className="text-blue-600 hover:underline"
                >
                  + Add Another Activity
                </button>
                <div className="flex gap-2">
                  <Link href="/activities" className="px-4 py-2 border rounded">Cancel</Link>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
