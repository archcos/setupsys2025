import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { usePage } from '@inertiajs/react';

export default function Dashboard() {
  const {
    projectDetails = [], // only the user's own project progress
    userCompanyName,
  } = usePage().props;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const allStages = ['Complete Details', 'Draft MOA', 'Implementation'];

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              My Company Project Progress
            </h2>

            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Project Title</th>
                  <th className="p-2 w-2/3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {projectDetails.length > 0 ? (
                  projectDetails.map((project) => {
                    const currentStageIndex = allStages.indexOf(project.progress);
                    const progressWidth = project.progress
                      ? ['w-1/3', 'w-2/3', 'w-full'][currentStageIndex] || 'w-0'
                      : 'w-full';
                    const progressColor = project.progress
                      ? ['bg-yellow-500', 'bg-blue-500', 'bg-green-600'][currentStageIndex] || 'bg-gray-300'
                      : 'bg-red-500';

                    return (
                      <tr key={project.project_title} className="border-t">
                        <td className="p-2">{project.project_title}</td>
                        <td className="p-2">
                          <div className="w-full bg-gray-200 rounded-full h-6 relative">
                            <div
                              className={`h-6 rounded-full transition-all duration-300 ${progressWidth} ${progressColor}`}
                            ></div>
                            <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-medium text-gray-700">
                              {project.progress ? (
                                allStages.map((stage, i) => (
                                  <span
                                    key={i}
                                    className={`${i <= currentStageIndex ? 'text-white' : ''}`}
                                  >
                                    {stage}
                                  </span>
                                ))
                              ) : (
                                <span className="text-white">Incomplete Project Details</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center p-4 text-gray-500">
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
