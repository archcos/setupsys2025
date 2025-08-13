import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Head, usePage } from '@inertiajs/react';
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

  const fmtDate = (date) => {
    return date
      ? <span className="font-medium text-green-700">{`Completed on ${new Date(date).toLocaleDateString()}`}</span>
      : <span className="italic text-gray-500">In Progress</span>;
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <Head title="Dashboard" />
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {userCompanyName}'s Project Progress
            </h2>

            <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 font-semibold text-gray-700">Project Title</th>
                  <th className="p-3 w-2/3 font-semibold text-gray-700">Progress</th>
                </tr>
              </thead>
              <tbody>
                {projectDetails.length > 0 ? (
                  projectDetails.map((project, index) => {
                    const currentStageIndex = stages.indexOf(project.progress);
                    const hasReached = (stage) => currentStageIndex >= stages.indexOf(stage);

                    const implementation = project.implementation || {};
                    const tags = implementation.tags || [];
                    const projectCost = parseFloat(project?.project_cost || 0);
                    const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
                    const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

                    return (
                      <tr
                        key={project.project_id || index}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 font-medium text-gray-800">{project.project_title}</td>
                        <td className="p-3 space-y-4">

                          {/* Stage Block */}
                          {[
                            {
                              title: 'Complete Details',
                              items: [
                                { label: 'Company Profile', date: project.company?.created_at, status: hasReached('Complete Details') },
                                { label: 'Project Details', date: project.last_activity_date, status: hasReached('Complete Details') }
                              ]
                            },
                            {
                              title: 'Draft MOA',
                              items: [
                                { label: 'Generated MOA', date: project.moa?.updated_at, status: hasReached('Draft MOA') },
                                { label: 'Verified MOA', date: project.moa?.acknowledge_date, status: hasReached('Implementation') }
                              ]
                            },
                            {
                              title: 'Implementation',
                              items: [
                                { label: 'Tarpaulin', date: implementation.tarp_upload, status: Boolean(implementation.tarp_upload) },
                                { label: 'Post-Dated Check', date: implementation.pdc_upload, status: Boolean(implementation.pdc_upload) },
                                { label: 'First Untagging (50%)', date: null, status: percentage >= 50 },
                                { label: 'Final Untagging (100%)', date: null, status: percentage >= 100 }
                              ]
                            },
                            {
                              title: 'Liquidation',
                              items: [
                                { label: 'Liquidation Report', date: implementation.liquidation_upload, status: Boolean(implementation.liquidation_upload) }
                              ]
                            },
                            {
                              title: 'Refund',
                              items: [
                                { label: 'Refund Date', date: null, status: hasReached('Refund') }
                              ]
                            },
                            {
                              title: 'Completed',
                              items: [
                                { label: project.progress === 'Completed' ? 'Completed' : 'Not Yet Completed', date: null, status: project.progress === 'Completed' }
                              ]
                            }
                          ].map((stage, i) => (
                            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="font-semibold text-gray-700 mb-2">{stage.title}</div>
                              <div className="ml-4 space-y-2">
                                {stage.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    {renderStatus(item.status)}
                                    <span>
                                      {item.label}
                                      {item.date !== null && (
                                        <>
                                          {' - '}
                                          {fmtDate(item.date)}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Tagging Summary */}
                          {tags.length > 0 && (
                            <div className="text-xs mt-4 pt-3 border-t space-y-2">
                              <div className="font-semibold text-gray-700 mb-1">Equipment Untagging</div>
                              <ul className="space-y-1">
                                {tags.map((tag, i) => (
                                  <li key={i} className="flex justify-between bg-white rounded px-3 py-1 border">
                                    <span>{tag.tag_name}</span>
                                    <span>₱{parseFloat(tag.tag_amount).toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="text-gray-600">
                                Total: <strong>₱{totalTagged.toLocaleString()}</strong> (
                                {percentage.toFixed(1)}% of project cost ₱
                                {project.project_cost.toLocaleString()})
                              </div>

                              <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-full transition-all"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

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
