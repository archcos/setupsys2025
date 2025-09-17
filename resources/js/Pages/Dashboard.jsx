import { useState } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import { 
  CheckCircle, 
  Circle, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target,
  FileText,
  Clock,
  Award,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Eye,
  Search,
  X
} from 'lucide-react';

export default function Dashboard() {
  const { projectDetails = [], userCompanyName } = usePage().props;
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stages = ['Complete Details', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];

  const openModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

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

  const filteredProjects = projectDetails.filter(project => {
    const matchesSearch = project.project_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'completed') return matchesSearch && project.progress === 'Completed';
    if (selectedFilter === 'in-progress') return matchesSearch && project.progress !== 'Completed';
    if (selectedFilter === 'urgent') {
      const impl = project.implementation || {};
      return matchesSearch && project.progress === 'Implementation' && 
             (!impl.tarp_upload || !impl.pdc_upload || !impl.liquidation_upload);
    }
    return matchesSearch;
  });

  const getProjectProgress = (project) => {
    const currentStageIndex = stages.indexOf(project.progress);
    return Math.round((currentStageIndex / (stages.length - 1)) * 100);
  };

  const getProjectStatus = (project) => {
    const impl = project.implementation || {};
    const tags = impl.tags || [];
    const projectCost = parseFloat(project?.project_cost || 0);
    const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
    const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

    if (project.progress === 'Completed') {
      return { status: 'completed', color: 'green', message: 'Project completed' };
    }
    
    if (project.progress === 'Implementation') {
      const missingItems = [];
      if (!impl.tarp_upload) missingItems.push('Tarpaulin');
      if (!impl.pdc_upload) missingItems.push('PDC');
      if (percentage < 50) missingItems.push('First Untagging (50%)');
      if (percentage < 100) missingItems.push('Final Untagging (100%)');
      
      if (missingItems.length > 0) {
        return { 
          status: 'needs-attention', 
          color: 'orange', 
          message: `Missing: ${missingItems.slice(0, 2).join(', ')}${missingItems.length > 2 ? '...' : ''}` 
        };
      }
    }
    
    return { status: 'in-progress', color: 'blue', message: 'In progress' };
  };

  const completedProjects = projectDetails.filter(p => p.progress === 'Completed').length;
  const totalProjects = projectDetails.length;
  const inProgressProjects = totalProjects - completedProjects;
  const needsAttentionProjects = projectDetails.filter(p => {
    const impl = p.implementation || {};
    return p.progress === 'Implementation' && (!impl.tarp_upload || !impl.pdc_upload);
  }).length;

  const filters = [
    { key: 'all', label: 'All Projects', count: totalProjects },
    { key: 'in-progress', label: 'In Progress', count: inProgressProjects },
    { key: 'completed', label: 'Completed', count: completedProjects },
    { key: 'urgent', label: 'Needs Attention', count: needsAttentionProjects }
  ];

  return (
    <main className="flex-1 flex flex-col overflow-hidden ">
      <Head title="Dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your projects</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-800" />
          <span className="text-sm">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Projects */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressProjects}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Attention</p>
              <p className="text-2xl font-bold text-gray-900">{needsAttentionProjects}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFilter === filter.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>  
        </div>
      </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const progress = getProjectProgress(project);
                  const status = getProjectStatus(project);
                  const impl = project.implementation || {};
                  const tags = impl.tags || [];
                  const projectCost = parseFloat(project?.project_cost || 0);
                  const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
                  const taggingProgress = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

                  const statusColors = {
                    completed: 'bg-green-50 border-green-200',
                    'in-progress': 'bg-blue-50 border-blue-200',
                    'needs-attention': 'bg-orange-50 border-orange-200'
                  };

                  const statusTextColors = {
                    completed: 'text-green-700',
                    'in-progress': 'text-blue-700',
                    'needs-attention': 'text-orange-700'
                  };

                  return (
                    <div key={project.project_id || index} 
                         className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${statusColors[status.status] || 'border-gray-200'}`}>
                      
                      {/* Project Header */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusTextColors[status.status]} ${statusColors[status.status]}`}>
                              {status.message}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Progress</div>
                            <div className="text-lg font-bold text-blue-600">{progress}%</div>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                          {project.project_title}
                        </h3>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          Budget: <span className="font-semibold text-blue-600">₱{projectCost.toLocaleString()}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Status Indicators */}
                      <div className="p-6">
                        <div className="space-y-3">
                          {/* Implementation Status */}
                          {project.progress === 'Implementation' && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="text-xs font-medium text-gray-700 mb-2">Implementation Status</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  {impl.tarp_upload ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-xs">Tarpaulin</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {impl.pdc_upload ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-xs">PDC</span>
                                </div>
                              </div>
                              
                              {tags.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600">Equipment Untagging</span>
                                    <span className="text-xs font-medium">{taggingProgress.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                      className="bg-green-500 h-1 rounded-full"
                                      style={{ width: `${Math.min(taggingProgress, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Current Stage */}
                          <div className="text-xs text-gray-600">
                            Current Stage: <span className="font-medium text-gray-900">{project.progress}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4">
                          <button
                            onClick={() => openModal(project)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                <div className="text-center">
                  <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No matching projects found' : 'No projects in this category'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? `No projects match "${searchTerm}" in the ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()} category`
                      : `You don't have any ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()} at the moment`
                    }
                  </p>
                  {(searchTerm || selectedFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Show All Projects
                    </button>
                  )}
                </div>
              </div>
            )}



{/* Project Details Modal */}
{isModalOpen && selectedProject && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
    <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 opacity-80" />
          <div>
            <h2 className="text-lg font-bold">{selectedProject.project_title}</h2>
            <p className="text-blue-100 text-xs">Project Details & Progress</p>
          </div>
        </div>
        <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(() => {
          const currentStageIndex = stages.indexOf(selectedProject.progress);
          const hasReached = (stage) => currentStageIndex >= stages.indexOf(stage);
          const implementation = selectedProject.implementation || {};
          const tags = implementation.tags || [];
          const projectCost = parseFloat(selectedProject?.project_cost || 0);
          const totalTagged = tags.reduce((sum, t) => sum + parseFloat(t.tag_amount || 0), 0);
          const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

          return (
            <>
              {/* Overview */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Project Cost", value: `₱${projectCost.toLocaleString()}`, color: "blue" },
                  { label: "Current Stage", value: selectedProject.progress, color: "green" },
                  { label: "Progress", value: `${Math.round((currentStageIndex / (stages.length - 1)) * 100)}%`, color: "purple" }
                ].map((card, i) => (
                  <div key={i} className={`rounded-lg border p-3 bg-${card.color}-50 border-${card.color}-200`}>
                    <p className={`text-xs font-medium text-${card.color}-600`}>{card.label}</p>
                    <p className={`text-lg font-bold text-${card.color}-700`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Stage Sections */}
              {[
                {
                  title: "Complete Details", icon: FileText, color: "blue",
                  items: [
                    { label: "Company Profile", date: selectedProject.company?.created_at ? new Date(selectedProject.company.created_at).toLocaleDateString() : null, status: Boolean(selectedProject.company?.created_at) },
                    { label: "Project Details", date: selectedProject.last_activity_date, status: hasReached("Complete Details") }
                  ]
                },
                {
                  title: "Draft MOA", icon: FileText, color: "green",
                  items: [
                    { label: "Generated MOA", date: selectedProject.moa?.updated_at, status: hasReached("Draft MOA") },
                    { label: "Verified MOA", date: selectedProject.moa?.acknowledge_date, status: hasReached("Implementation") }
                  ]
                },
                {
                  title: "Implementation", icon: Target, color: "orange",
                  items: [
                    { label: "Signboard", date: implementation.tarp_upload, status: Boolean(implementation.tarp_upload) },
                    { label: "Post-Dated Check", date: implementation.pdc_upload, status: Boolean(implementation.pdc_upload) },
                    { label: "First Untagging (50%)", date: null, status: percentage >= 50 },
                    { label: "Final Untagging (100%)", date: null, status: percentage >= 100 }
                  ]
                },
                {
                  title: "Liquidation", icon: BarChart3, color: "purple",
                  items: [{ label: "Liquidation Report", date: implementation.liquidation_upload, status: Boolean(implementation.liquidation_upload) }]
                },
                {
  title: "Refund", icon: TrendingUp, color: "pink",
  customContent: (
    <div className="space-y-2">
      {/* Refund Period */}
      {selectedProject.refund?.initial && selectedProject.refund?.end ? (
        <p className="text-xs text-gray-600">
          Refund Period: <span className="font-medium">{selectedProject.refund.initial_formatted  }</span> 
          &nbsp;to&nbsp;
          <span className="font-medium">{selectedProject.refund.end_formatted}</span>
        </p>
      ) : (
        <p className="text-xs italic text-gray-500">No refund schedule set</p>
      )}

      {/* Refund Status */}
{selectedProject.refund?.completed ? (
  <p className="text-green-600 text-xs font-medium">✅ All refunds are paid</p>
) : selectedProject.refund?.currentMonthOngoing ? (
  <div className="flex justify-between items-center">
    <span className="text-yellow-600 text-xs font-medium">
      🔄 Refund for this month is ongoing
    </span>
    <Link
      href={`/my-refunds?project=${selectedProject.project_id}`}
      className="text-blue-600 text-xs underline hover:text-blue-800"
    >
      View All Refunds
    </Link>
  </div>
) : (
  <div className="flex justify-between items-center">
    <span className="text-gray-600 text-xs">Refunds not yet completed</span>
    <Link
      href={`/my-refunds?project=${selectedProject.project_id}`}
      className="text-blue-600 text-xs underline hover:text-blue-800"
    >
      View Refunds
    </Link>
  </div>
)}

      {/* Refund History Scrollable */}
      {selectedProject.refund?.refunds?.length > 0 && (
        <div className="mt-2 max-h-28 overflow-y-auto bg-white border rounded-lg p-2">
          {selectedProject.refund.refunds.map((r, idx) => (
            <div key={idx} className="flex justify-between text-xs border-b last:border-0 py-1">
              <span>{r.month_paid}</span>
              <span className={r.status === 'paid' ? 'text-green-600' : 'text-red-600'}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
},
                {
                  title: "Completed", icon: Award, color: "emerald",
                  items: [{ label: selectedProject.progress === "Completed" ? "Completed" : "Not Yet Completed", date: null, status: selectedProject.progress === "Completed" }]
                }
              ].map((stage, i) => {
                const IconComp = stage.icon;
                return (
                  <div key={i} className="bg-gray-50 rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1 rounded bg-${stage.color}-100 text-${stage.color}-600`}><IconComp className="w-4 h-4" /></div>
                      <h3 className="font-semibold text-gray-800 text-sm">{stage.title}</h3>
                    </div>
                    <div className="ml-6 space-y-1">
                      {stage.customContent ? (
                        stage.customContent
                      ) : (
                        stage.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {renderStatus(item.status)}
                            <span>{item.label}{item.date && <> – {fmtDate(item.date)}</>}</span>
                          </div>
                        ))
                      )}

                    </div>
                  </div>
                );
              })}

              {/* Equipment Untagging */}
              {tags.length > 0 && (
                <div className="bg-blue-50 rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-800 text-sm">Equipment Untagging</h4>
                  </div>
                  {tags.map((tag, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{tag.tag_name}</span>
                      <span className="font-semibold text-blue-600">₱{parseFloat(tag.tag_amount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="mt-2 text-xs text-gray-700 flex justify-between">
                    <span>Total: <b className="text-blue-600">₱{totalTagged.toLocaleString()}</b></span>
                    <span>{percentage.toFixed(1)}% of ₱{selectedProject.project_cost.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-3 border-t flex justify-end">
        <button onClick={closeModal} className="px-4 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700">
          Close
        </button>
      </div>
    </div>
  </div>
)}
          </main>
  );
}
