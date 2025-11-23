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
  const [openDropdowns, setOpenDropdowns] = useState({});

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

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '₱0';
    return `₱${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleDropdown = (projectId) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  if (!projects || projects.length === 0) {
    return (
      <main className="flex-1 p-3 md:p-6 overflow-y-auto">
        <Head title="Projects" />
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 p-6 md:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">No Projects Found</h3>
            <p className="text-sm md:text-base text-gray-600">No projects are available to view at this time</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Projects" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-2.5 bg-blue-100 rounded-lg">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-semibold text-gray-900">Project List</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">Click on any project to view items</p>
            </div>
          </div>
        </div>

        {/* Projects Table Card */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Project Title
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fund Release</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Refund Schedule</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project Cost</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((project, index) => {
                  const isOpen = openDropdowns[project.project_id] || false;

                  return (
                    <tr
                      key={`main-${project.project_id}`}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      } ${isOpen ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleDropdown(project.project_id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">{project.project_title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 text-sm">{project.company?.company_name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 text-sm">{formatPhase(project.release_initial, project.release_end)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 text-sm">{formatPhase(project.refund_initial, project.refund_end)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 text-sm">{formatCurrency(project.project_cost)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-blue-500 mx-auto transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 mx-auto transition-transform duration-200" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {projects.map((project) => {
              const isOpen = openDropdowns[project.project_id] || false;

              return (
                <div key={project.project_id} className="border-b border-gray-100">
                  {/* Main Card */}
                  <div
                    className="p-4 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                    onClick={() => toggleDropdown(project.project_id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{project.project_title}</h3>
                        <p className="text-xs text-gray-600 truncate mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            {project.company?.company_name || 'N/A'}
                          </span>
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-blue-500 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                        )}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-600 mb-1">Fund Release</p>
                        <p className="text-xs font-medium text-gray-900">{formatPhase(project.release_initial, project.release_end)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-600 mb-1">Project Cost</p>
                        <p className="text-xs font-semibold text-gray-900">{formatCurrency(project.project_cost)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isOpen && (
                    <div className="bg-gradient-to-r from-blue-50/50 to-blue-50/30 p-4 border-t border-blue-100">
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        {/* Schedule Info */}
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">Schedule Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Fund Release:</span>
                              <span className="font-medium text-gray-900">{formatPhase(project.release_initial, project.release_end)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Refund Schedule:</span>
                              <span className="font-medium text-gray-900">{formatPhase(project.refund_initial, project.refund_end)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Project Items */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <h4 className="font-semibold text-gray-900 text-sm">Project Items</h4>
                            {project.items && project.items.length > 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {project.items.length}
                              </span>
                            )}
                          </div>

                          {project.items && project.items.length > 0 ? (
                            <div className="space-y-3">
                              {project.items.map((item) => (
                                <div key={item.item_id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h5 className="font-medium text-gray-900 text-sm flex-1 break-words">{item.item_name}</h5>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <p className="text-gray-600 mb-1">Quantity</p>
                                      <p className="font-medium text-gray-900">{item.quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 mb-1">Cost</p>
                                      <p className="font-semibold text-green-600">{formatCurrency(item.item_cost)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No items for this project</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span className="truncate">Click any project to view details</span>
              </div>
              <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}