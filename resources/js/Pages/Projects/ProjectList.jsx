import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { FolderOpen, Building2, Package, Activity, Eye, X, Calendar, PhilippinePeso } from 'lucide-react';

export default function ProjectList({ projects }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const formatMonth = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'Invalid date';
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const formatPhase = (initial, end) => {
    if (!initial && !end) return 'N/A';
    return `${formatMonth(initial)} – ${formatMonth(end)}`;
  };

  const formatCurrency = (value) => {
    if (!value) return '₱0.00';
    return `₱${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const openModal = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
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
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project List</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Project Title
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fund Release
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Refund Schedule
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <PhilippinePeso className="w-4 h-4" />
                      Project Cost
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-blue-50/30 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <FolderOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{project.project_title}</p>
                          {project.items?.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {project.items.length} item{project.items.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{project.company?.company_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{formatPhase(project.release_initial, project.release_end)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{formatPhase(project.refund_initial, project.refund_end)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(project.project_cost)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openModal(project)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-sm"
                        title="View Items"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {projects.map((project) => (
              <div key={project.project_id} className="p-4 bg-white">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{project.project_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      {project.company?.company_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-blue-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">Fund Release</p>
                    <p className="text-xs font-medium text-gray-900">{formatPhase(project.release_initial, project.release_end)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">Project Cost</p>
                    <p className="text-xs font-semibold text-gray-900">{formatCurrency(project.project_cost)}</p>
                  </div>
                </div>
                <button
                  onClick={() => openModal(project)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 text-sm font-medium transition-all"
                >
                  <Eye className="w-4 h-4" />
                  View Items
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              <span>Click View to see project items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Modal */}
      {showModal && selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedProject.project_title}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedProject.items?.length || 0} item{(selectedProject.items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1">
              {selectedProject.items?.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0">
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Specifications</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedProject.items.map((item, index) => (
                      <tr
                        key={item.item_id}
                        className={`hover:bg-blue-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.item_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{item.specifications || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{item.quantity}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-green-600">{formatCurrency(item.item_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-base font-medium text-gray-900 mb-1">No items found</h4>
                  <p className="text-sm text-gray-500">This project has no items assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}