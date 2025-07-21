import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function DocxForm({ companies = [] }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [projects, setProjects] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);

  const { data, setData } = useForm({
    company_id: '',
    project_id: '',
  });

  const filtered = companies.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCompany = async (company) => {
    setSearch(company.company_name);
    setData('company_id', company.company_id);
    setData('project_id', ''); // reset
    setShowDropdown(false);

    try {
      const res = await fetch(`/moa/company/${company.company_id}/details`);
      const result = await res.json();
      setProjects(result.projects || []);
      setCompanyDetails(result);
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/moa/generate-docx';
    form.target = '_blank';

    const token = document.querySelector('meta[name="csrf-token"]').content;

    const csrf = document.createElement('input');
    csrf.type = 'hidden';
    csrf.name = '_token';
    csrf.value = token;
    form.appendChild(csrf);

    const projectInput = document.createElement('input');
    projectInput.type = 'hidden';
    projectInput.name = 'project_id';
    projectInput.value = data.project_id;
    form.appendChild(projectInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow relative">
      <h1 className="text-xl font-bold mb-4">Generate Company DOCX</h1>

      <div className="relative">
        <input
          type="text"
          className="w-full border px-3 py-2 mb-2"
          placeholder="Search Company..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
            setData('company_id', '');
            setData('project_id', '');
            setProjects([]);
          }}
        />

        {showDropdown && search && filtered.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border max-h-60 overflow-y-auto rounded shadow">
            {filtered.map((c) => (
              <li
                key={`company-${c.company_id}`}
                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => handleSelectCompany(c)}
              >
                {c.company_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {projects.length > 0 && (
        <div className="mt-4">
          <label className="block mb-1 font-semibold text-gray-700">
            Select Project
          </label>
          <select
            className="w-full border px-3 py-2 rounded mb-4"
            value={data.project_id}
            onChange={(e) => setData('project_id', e.target.value)}
          >
            <option value="">-- Select a project --</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.project_title}
              </option>
            ))}
          </select>

          {/* Optional: show activities below selected project */}
          {data.project_id &&
            projects.find((p) => p.project_id == data.project_id)?.activities
              ?.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold">Activities:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {projects
                    .find((p) => p.project_id == data.project_id)
                    .activities.map((a) => (
                      <li key={a.activity_id}>
                        {a.activity_name} ({a.activity_date})
                      </li>
                    ))}
                </ul>
              </div>
            )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        disabled={!data.project_id}
      >
        Generate DOCX
      </button>
    </div>
  );
}
