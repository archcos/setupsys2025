import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
  FolderOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Package,
  Sparkles,
  Activity
} from 'lucide-react';

export default function ProjectList({ projects }) {

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Format YYYY-MM-DD to "MMM YYYY"
  const formatMonth = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'Invalid date';
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  // Format Phase as "initial - end"
  const formatPhase = (initial, end) => {
    if (!initial && !end) return 'N/A';
    return `${formatMonth(initial)} - ${formatMonth(end)}`;
  };

  return (
        
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Projects" />

          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            

            {/* Projects Table Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 pb-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Project List</h2>
                    <p className="text-sm text-gray-600">Click on any row to view project items</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          Project Title
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          Company
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          Fund Release Schedule
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          Refund Schedule
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          Project Cost
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project, index) => {
                      const isOpen = openDropdowns[project.project_id] || false;

                      return [
                        <tr
                          key={`main-${project.project_id}`}
                          className={`
                            border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-all duration-200
                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                            ${isOpen ? 'bg-blue-50' : ''}
                          `}
                          onClick={() =>
                            setOpenDropdowns((prev) => ({
                              ...prev,
                              [project.project_id]: !prev[project.project_id],
                            }))
                          }
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {project.project_title}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                          
                              <span className="text-gray-700">
                                {project.company?.company_name || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">
                                {formatPhase(project.release_initial, project.release_end)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">
                                {formatPhase(project.refund_initial, project.refund_end)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-semibold">₱</span>
                              <span className="font-medium text-gray-900">
                                {project.project_cost || '0'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              {isOpen ? (
                                <ChevronUp className="w-5 h-5 text-blue-500 transition-transform duration-200" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                              )}
                            </div>
                          </td>
                        </tr>,

                        isOpen && (
                          <tr key={`details-${project.project_id}`} className="bg-gradient-to-r from-blue-50/50 to-blue-50/30 border-b border-blue-200">
                            <td colSpan="6" className="px-6 py-6">
                              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">Project Items</h3>
                                  {project.items && project.items.length > 0 && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                      {project.items.length} item{project.items.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                
                                {project.items && project.items.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {project.items.map((item) => (
                                      <div key={item.item_id} className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-start justify-between mb-2">
                                          <h4 className="font-medium text-gray-900 flex-1">
                                            {item.item_name}
                                          </h4>
                                          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center ml-2">
                                            <Package className="w-4 h-4 text-white" />
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Quantity:</span>
                                            <span className="font-medium text-gray-900">{item.quantity}</span>
                                          </div>
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Cost:</span>
                                            <span className="font-semibold text-green-600">₱{item.item_cost}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <Package className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No items found for this project</p>
                                    <p className="text-sm text-gray-400 mt-1">Items will appear here when added</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ),
                      ];
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Click any row to view project details</span>
                  </div>
                  <div className="flex items-center gap-4">
                  
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

  );
}