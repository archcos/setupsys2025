import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function GeneratePDF({ companies }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [projects, setProjects] = useState([]);

  const { data, setData } = useForm({
    company_id: '',
  });

  const filtered = companies.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (company) => {
    setSearch(company.company_name);
    setData('company_id', company.company_id);
    setShowDropdown(false);

    try {
      const res = await fetch(`/moa/company/${company.company_id}/details`);
      const result = await res.json();
      setProjects(result);
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/moa/generate-pdf';
    form.target = '_blank';

    const token = document.querySelector('meta[name="csrf-token"]').content;

    const csrf = document.createElement('input');
    csrf.type = 'hidden';
    csrf.name = '_token';
    csrf.value = token;
    form.appendChild(csrf);

    const companyInput = document.createElement('input');
    companyInput.type = 'hidden';
    companyInput.name = 'company_id';
    companyInput.value = data.company_id;
    form.appendChild(companyInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow relative">
      <h1 className="text-xl font-bold mb-4">Generate Company PDF</h1>

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
            setProjects([]);
          }}
        />

        {showDropdown && search && filtered.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border max-h-60 overflow-y-auto rounded shadow">
            {filtered.map((c) => (
              <li
                key={`company-${c.company_id}`}
                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => handleSelect(c)}
              >
                {c.company_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {projects.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Projects & Activities</h2>
          {projects.map((project) => (
            <div key={`project-${project.project_id}`} className="mb-4 border rounded p-3">
              <div className="font-bold text-blue-700">{project.project_title}</div>
              {project.activities && project.activities.length > 0 ? (
                <ul className="list-disc list-inside ml-2 text-sm text-gray-700">
                  {project.activities.map((activity) => (
                    <li key={`activity-${activity.activity_id}`}>
                      {activity.activity_name} ({activity.activity_date})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No activities</p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        disabled={!data.company_id}
      >
        Generate PDF
      </button>
    </div>
  );
}
