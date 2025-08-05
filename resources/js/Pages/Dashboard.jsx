import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { usePage } from '@inertiajs/react';
import { CheckCircle, Circle } from 'lucide-react';

export default function Dashboard() {
  const { projectDetails = [], userCompanyName } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const stages = ['Complete Details', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];

  const renderStatus = (value) =>
    value ? (
      <CheckCircle className="text-green-500 w-5 h-5" />
    ) : (
      <Circle className="text-gray-400 w-5 h-5" />
    );

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Company Progress</h2>

            <table className="w-full text-sm text-left border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Project Title</th>
                  <th className="p-2 w-2/3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {projectDetails.length > 0 ? (
                  projectDetails.map((project, index) => {
                    const currentStageIndex = stages.indexOf(project.progress);
                    const hasReached = (stage) => currentStageIndex >= stages.indexOf(stage);

                    const progressWidth = ['w-1/6', 'w-2/6', 'w-7/12', 'w-2/3', 'w-5/6', 'w-full'][currentStageIndex] || 'w-0';
                    const progressColor = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500', 'bg-purple-500', 'bg-green-700'][currentStageIndex] || 'bg-red-500';

                    const implementation = project.implementation;
                    const tags = implementation?.tags || [];
                    const projectCost = parseFloat(project?.project_cost || 0);
                    const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
                    const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

                    return (
                      <tr key={project.id || index} className="border-t align-top">
                        <td className="p-2 font-medium">{project.project_title}</td>
                        <td className="p-2 space-y-3">

                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-6 relative">
                            <div className={`h-6 rounded-full transition-all duration-300 ${progressWidth} ${progressColor}`} />
                            <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-medium text-gray-700">
                              {project.progress
                                ? stages.map((stage, i) => (
                                    <span key={stage} className={i <= currentStageIndex ? 'text-white' : ''}>
                                      {stage}
                                    </span>
                                  ))
                                : <span className="text-white">Incomplete</span>}
                            </div>
                          </div>

                          {/* Full Vertical Checklist */}
                          <div className="space-y-4 text-sm mt-2">
                            {/* ✅ Complete Details */}
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Complete Details</div>
                              <div className="ml-4 space-y-1">
                                <div className="flex items-center gap-2">
                                  {renderStatus(hasReached('Complete Details'))}
                                  <span>Company Profile</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderStatus(hasReached('Complete Details'))}
                                  <span>Project Details</span>
                                </div>
                              </div>
                            </div>

                            {/* ✅ Draft MOA */}
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Draft MOA</div>
                              <div className="ml-4 space-y-1">
                                <div className="flex items-center gap-2">
                                  {renderStatus(hasReached('Draft MOA'))}
                                  <span>Generated MOA</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderStatus(hasReached('Implementation'))}
                                  <span>Verified MOA</span>
                                </div>
                              </div>
                            </div>

                            {/* ✅ Implementation */}
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Implementation</div>
                              <div className="ml-4 space-y-1">
                                <div className="flex items-center gap-2">
                                  {renderStatus(implementation?.tarp)}
                                  <span>Tarpaulin</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderStatus(implementation?.pdc)}
                                  <span>Post-Dated Check</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderStatus(percentage >= 50)}
                                  <span>First Untagging (≥ 50%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderStatus(percentage >= 100)}
                                  <span>Final Untagging (100%)</span>
                                </div>
                              </div>
                            </div>

                            {/* ✅ Tagging Summary */}
                            {tags.length > 0 && (
                              <div className="text-xs mt-3 border-t pt-2 space-y-2">
                                <h4 className="font-medium">Equipment Untagging</h4>
                                <ul className="space-y-1">
                                  {tags.map((tag, i) => (
                                    <li key={i} className="flex justify-between bg-gray-50 rounded px-3 py-1 border">
                                      <span>{tag.tag_name}</span>
                                      <span>₱{parseFloat(tag.tag_amount).toLocaleString()}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="text-gray-600">
                                  Total: <strong>₱{totalTagged.toLocaleString()}</strong> (
                                  {percentage.toFixed(1)}% of project cost ₱{project.project_cost.toLocaleString()})
                                </div>

                                <div className="w-full bg-gray-300 rounded h-3 overflow-hidden">
                                  <div
                                    className="bg-blue-500 h-full transition-all"
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* ✅ Liquidation */}
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Liquidation</div>
                              <div className="ml-4">
                                <div className="flex items-center gap-2">
                                  {renderStatus(implementation?.liquidation)}
                                  <span>Liquidation Report</span>
                                </div>
                              </div>
                            </div>

                            {/* ✅ Refund */}
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Refund</div>
                              <div className="ml-4">
                                <div className="flex items-center gap-2">
                                  {renderStatus(hasReached('Refund'))}
                                  <span>Refund Date</span>
                                </div>
                              </div>
                            </div>

                            {/* ✅ Completed */}
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Completed</div>
                              <div className="ml-4">
                                <div className="flex items-center gap-2">
                                  {renderStatus(project.progress === 'Completed')}
                                  <span>{project.progress === 'Completed' ? 'Completed' : 'Not Yet Completed'}</span>
                                </div>
                              </div>
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
