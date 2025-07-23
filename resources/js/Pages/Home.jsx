import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { usePage } from '@inertiajs/react';

export default function Home() {
const { projectsPerOffice, selectedYear, availableYears, userOfficeId, userOfficeName } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleYearChange = (e) => {
    window.location.href = `?year=${e.target.value}`;
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {userOfficeId !== 1
                ? `PSTO ${userOfficeName} SETUP Projects (${selectedYear})`
                : `Projects Per Office (${selectedYear})`}
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="year" className="text-sm text-gray-700">
                Filter by Year:
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={handleYearChange}
                className="block w-36 text-sm border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>


            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Office</th>
                  <th className="p-2">Project Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(projectsPerOffice).map(([office, count]) => (
                  <tr key={office} className="border-t">
                    <td className="p-2">{office}</td>
                    <td className="p-2">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
