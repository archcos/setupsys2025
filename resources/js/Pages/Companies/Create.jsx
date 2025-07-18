import { useState } from 'react';
import { useForm , Link} from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function CompanyCreate() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data, setData, post, errors } = useForm({
    company_name: '',
    owner_fname: '',
    owner_mname: '',
    owner_lname: '',
    company_location: '',
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/companies');
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow p-4 max-w-xl mx-auto">
            <div className="mb-4">
                <Link href="/companies" className="inline-block text-sm text-blue-600 hover:underline">
                    ← Back to Companies
                </Link>
            </div>
            <h1 className="text-xl font-semibold mb-4 text-gray-800">Add Company</h1>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1">Company Name</label>
                <input
                  type="text"
                  value={data.company_name}
                  onChange={(e) => setData('company_name', e.target.value)}
                  className="w-full p-2 border rounded"
                />
                {errors.company_name && <div className="text-red-500 text-xs mt-1">{errors.company_name}</div>}
              </div>

              <div>
                <label className="block mb-1">Owner First Name</label>
                <input
                  type="text"
                  value={data.owner_fname}
                  onChange={(e) => setData('owner_fname', e.target.value)}
                  className="w-full p-2 border rounded"
                />
                {errors.owner_fname && <div className="text-red-500 text-xs mt-1">{errors.owner_fname}</div>}
              </div>

              <div>
                <label className="block mb-1">Owner Middle Name</label>
                <input
                  type="text"
                  value={data.owner_mname}
                  onChange={(e) => setData('owner_mname', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-1">Owner Last Name</label>
                <input
                  type="text"
                  value={data.owner_lname}
                  onChange={(e) => setData('owner_lname', e.target.value)}
                  className="w-full p-2 border rounded"
                />
                {errors.owner_lname && <div className="text-red-500 text-xs mt-1">{errors.owner_lname}</div>}
              </div>

              <div>
                <label className="block mb-1">Company Location</label>
                <input
                  type="text"
                  value={data.company_location}
                  onChange={(e) => setData('company_location', e.target.value)}
                  className="w-full p-2 border rounded"
                />
                {errors.company_location && <div className="text-red-500 text-xs mt-1">{errors.company_location}</div>}
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm"
              >
                Save
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
