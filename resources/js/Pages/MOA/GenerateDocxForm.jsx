import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function GenerateDocxForm({ companies }) {
  const [projects, setProjects] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { data, setData } = useForm({
    company_id: '',
    project_id: '',
    owner_name: '',
    owner_position: '',
    witness: '', 
  });

  const handleSelectCompany = async (company_id) => {
    setData('company_id', company_id);
    try {
      const res = await fetch(`/moa/company/${company_id}/details`);
      const json = await res.json();
      setSelectedCompany(json.company);
      setProjects(json.projects);
    } catch (err) {
      console.error('Error fetching company details:', err);
    }
  };

  const handleSubmit = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = route('moa.generateDocx');

    const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_token';
    csrfInput.value = csrf;
    form.appendChild(csrfInput);

    const projectInput = document.createElement('input');
    projectInput.type = 'hidden';
    projectInput.name = 'project_id';
    projectInput.value = data.project_id;
    form.appendChild(projectInput);

    const ownerNameInput = document.createElement('input');
    ownerNameInput.type = 'hidden';
    ownerNameInput.name = 'owner_name';
    ownerNameInput.value = data.owner_name;
    form.appendChild(ownerNameInput);

    const ownerPositionInput = document.createElement('input');
    ownerPositionInput.type = 'hidden';
    ownerPositionInput.name = 'owner_position';
    ownerPositionInput.value = data.owner_position;
    form.appendChild(ownerPositionInput);

    const witnessInput = document.createElement('input');
    witnessInput.type = 'hidden';
    witnessInput.name = 'witness';
    witnessInput.value = data.witness;
    form.appendChild(witnessInput);



    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto">
            <h1 className="text-xl font-bold mb-4">Generate Draft MOA</h1>

            <label className="block mb-1">Select Company:</label>
            <select
              value={data.company_id}
              onChange={(e) => handleSelectCompany(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            >
              <option value="">-- Choose Company --</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_name}
                </option>
              ))}
            </select>

            {projects.length > 0 && (
              <>
                <label className="block mb-1">Select Project:</label>
                <select
                  value={data.project_id}
                  onChange={(e) => setData('project_id', e.target.value)}
                  className="w-full border px-3 py-2 rounded mb-4"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_title}
                    </option>
                  ))}
                </select>

                <label className="block mb-1">Witness Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={data.witness}
                  onChange={(e) => setData('witness', e.target.value)}
                  placeholder="Enter witness name"
                  className="w-full border px-3 py-2 rounded mb-4"
                  required
                />


                <label className="block mb-1">Representative's Name (optional):</label>

                <input
                  type="text"
                  value={data.owner_name}
                  onChange={(e) => setData('owner_name', e.target.value)}
                  placeholder="Enter representative's name or leave blank to use Company's owner name"
                  className="w-full border px-3 py-2 rounded mb-4"
                />

                <label className="block mb-1">Position (optional, default: Owner):</label>
                <input
                  type="text"
                  value={data.owner_position}
                  onChange={(e) => setData('owner_position', e.target.value)}
                  placeholder="Enter position or leave blank to default as Owner"
                  className="w-full border px-3 py-2 rounded mb-4"
                />


                <button
                onClick={handleSubmit}
                disabled={!data.project_id || !data.witness}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Generate DOCX
              </button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
