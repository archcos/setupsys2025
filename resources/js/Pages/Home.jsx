import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { usePage, Head } from '@inertiajs/react';

export default function Home() {
  const {
    projectsPerOffice,
    selectedYear,
    availableYears,
    userOfficeId,
    userOfficeName,
    projectDetails = [], // project_title, office_name, progress
  } = usePage().props;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleYearChange = (e) => {
    window.location.href = `?year=${e.target.value}`;
  };

  const allStages = ['Complete Details', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];

  const getStageIcon = (stage, current) => {
    if (allStages.indexOf(stage) < allStages.indexOf(current)) return '✅';
    if (stage === current) return '⏳';
    return '⬜';
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Dashboard" />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Project Count Table */}
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

  {/* MOA Progress Table */}
<div className="bg-white rounded-xl shadow p-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    Project Progress Status
  </h2>

  <table className="w-full text-sm text-left border">
    <thead className="bg-gray-200">
      <tr>
        <th className="p-2">Project Title</th>
        <th className="p-2">Company</th>
        <th className="p-2 w-1/2">Progress</th>
      </tr>
    </thead>
    <tbody>
      {projectDetails.length > 0 ? (
        projectDetails.map((project) => {
          const stages = ['Complete Details', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];
          const currentStageIndex = stages.indexOf(project.progress);

          // Default values for progress bar if incomplete
          const progressWidth = project.progress
            ? ['w-1/6', 'w-2/6', 'w-7/12', 'w-2/3', 'w-5/6', 'w-full'][currentStageIndex] || 'w-0'
            : 'w-full';

          const progressColor = project.progress
            ? ['bg-yellow-600', 'bg-orange-600', 'bg-purple-600', 'bg-blue-600', 'bg-teal-600', 'bg-green-600'][currentStageIndex] || 'bg-red-600'
            : 'bg-red-600';
          const progressLabel = project.progress || 'Incomplete Profile';

          return (
            <tr key={project.project_title} className="border-t">
              <td className="p-2">{project.project_title}</td>
              <td className="p-2">{project.company_name}</td>
              <td className="p-2">
                <div className="w-full bg-gray-200 rounded-full h-6 relative">
                  <div
                    className={`h-6 rounded-full transition-all duration-300 ${progressWidth} ${progressColor}`}
                  ></div>
                <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-medium drop-shadow-sm">
                    {project.progress ? (
                      stages.map((stage, i) => {
                        const isActive = i <= currentStageIndex;

                        // Choose text color based on background for contrast
                        const stageTextColors = ['text-white', 'text-white', 'text-white', 'text-black', 'text-white', 'text-white'];
                        const textColor = isActive ? stageTextColors[i] : 'text-gray-800';

                        return (
                          <span key={i} className={textColor}>
                            {stage}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-white drop-shadow-sm">Incomplete Project Details</span>
                    )}
                  </div>


                </div>

              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan="3" className="text-center p-4 text-gray-500">
            No project progress records found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


        </main>
      </div>
    </div>
  );
}
