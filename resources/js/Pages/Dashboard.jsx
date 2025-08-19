import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Head, usePage } from '@inertiajs/react';
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
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Dashboard() {
  const { projectDetails = [], userCompanyName } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState({});
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const stages = ['Complete Details', 'Draft MOA', 'Implementation', 'Liquidation', 'Refund', 'Completed'];

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
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

  // Calculate overall progress stats
  const completedProjects = projectDetails.filter(p => p.progress === 'Completed').length;
  const totalProjects = projectDetails.length;
  const inProgressProjects = totalProjects - completedProjects;

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto space-y-8">
          <div className="max-w-7xl mx-auto">
            <Head title="Dashboard" />
            
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {userCompanyName}'s Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">Track your project progress and milestones</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{inProgressProjects}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Progress Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Project Progress Overview</h2>
                    <p className="text-gray-600 mt-1">Monitor all your project milestones and stages</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {projectDetails.length > 0 ? (
                  <div className="space-y-8">
                    {projectDetails.map((project, index) => {
                      const currentStageIndex = stages.indexOf(project.progress);
                      const hasReached = (stage) => currentStageIndex >= stages.indexOf(stage);
                      const isExpanded = expandedProjects[project.project_id];

                      const implementation = project.implementation || {};
                      const tags = implementation.tags || [];
                      const projectCost = parseFloat(project?.project_cost || 0);
                      const totalTagged = tags.reduce((sum, tag) => sum + parseFloat(tag.tag_amount || 0), 0);
                      const percentage = projectCost > 0 ? (totalTagged / projectCost) * 100 : 0;

                      return (
                        <div key={project.project_id || index} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                          {/* Project Header - Clickable */}
                          <div 
                            className="bg-gradient-to-r from-blue-50 to-blue-50/30 p-6 border-b border-blue-200 cursor-pointer hover:from-blue-100 hover:to-blue-100/30 transition-all duration-200"
                            onClick={() => toggleProject(project.project_id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-sm">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{project.project_title}</h3>
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                      project.progress === 'Completed' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      <div className={`w-2 h-2 rounded-full ${
                                        project.progress === 'Completed' 
                                          ? 'bg-green-500' 
                                          : 'bg-orange-500'
                                      }`}></div>
                                      {project.progress}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Project Cost: <span className="font-semibold text-blue-600">₱{projectCost.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-sm text-gray-600">Progress</div>
                                  <div className="text-lg font-bold text-blue-600">{Math.round((currentStageIndex / (stages.length - 1)) * 100)}%</div>
                                </div>
                                <div className="transition-transform duration-200">
                                  {isExpanded ? (
                                    <ChevronUp className="w-6 h-6 text-blue-600" />
                                  ) : (
                                    <ChevronDown className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Project Details - Expandable */}
                          {isExpanded && (
                            <div className="p-8 bg-white">
                              <div className="space-y-6">
                                {/* Stage Blocks */}
                                {[
                                  {
                                    title: 'Complete Details',
                                    icon: FileText,
                                    color: 'blue',
                                    items: [
                                      {
                                          label: 'Company Profile',
                                          date: project.company?.created_at
                                              ? new Date(project.company.created_at).toLocaleDateString()
                                              : null,
                                          status: Boolean(project.company?.created_at)
                                      },
                                      { label: 'Project Details', date: project.last_activity_date, status: hasReached('Complete Details') }
                                    ]
                                  },
                                  {
                                    title: 'Draft MOA',
                                    icon: FileText,
                                    color: 'green',
                                    items: [
                                      { label: 'Generated MOA', date: project.moa?.updated_at, status: hasReached('Draft MOA') },
                                      { label: 'Verified MOA', date: project.moa?.acknowledge_date, status: hasReached('Implementation') }
                                    ]
                                  },
                                  {
                                    title: 'Implementation',
                                    icon: Target,
                                    color: 'orange',
                                    items: [
                                      { label: 'Tarpaulin', date: implementation.tarp_upload, status: Boolean(implementation.tarp_upload) },
                                      { label: 'Post-Dated Check', date: implementation.pdc_upload, status: Boolean(implementation.pdc_upload) },
                                      { label: 'First Untagging (50%)', date: null, status: percentage >= 50 },
                                      { label: 'Final Untagging (100%)', date: null, status: percentage >= 100 }
                                    ]
                                  },
                                  {
                                    title: 'Liquidation',
                                    icon: BarChart3,
                                    color: 'purple',
                                    items: [
                                      { label: 'Liquidation Report', date: implementation.liquidation_upload, status: Boolean(implementation.liquidation_upload) }
                                    ]
                                  },
                                  {
                                    title: 'Refund',
                                    icon: TrendingUp,
                                    color: 'pink',
                                    items: [
                                      { label: 'Refund Date', date: null, status: hasReached('Refund') }
                                    ]
                                  },
                                  {
                                    title: 'Completed',
                                    icon: Award,
                                    color: 'green',
                                    items: [
                                      { label: project.progress === 'Completed' ? 'Completed' : 'Not Yet Completed', date: null, status: project.progress === 'Completed' }
                                    ]
                                  }
                                ].map((stage, i) => {
                                  const IconComponent = stage.icon;
                                  const colorClasses = {
                                    blue: 'bg-blue-100 text-blue-600 border-blue-200',
                                    green: 'bg-green-100 text-green-600 border-green-200',
                                    orange: 'bg-orange-100 text-orange-600 border-orange-200',
                                    purple: 'bg-purple-100 text-purple-600 border-purple-200',
                                    pink: 'bg-pink-100 text-pink-600 border-pink-200'
                                  };

                                  return (
                                    <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-50/30 rounded-xl border border-gray-200 overflow-hidden">
                                      <div className={`p-4 border-l-4 ${colorClasses[stage.color] || colorClasses.blue}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className={`p-2 rounded-lg ${colorClasses[stage.color]}`}>
                                            <IconComponent className="w-4 h-4" />
                                          </div>
                                          <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                                        </div>
                                        <div className="ml-9 space-y-2">
                                          {stage.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                              {renderStatus(item.status)}
                                              <span className="text-sm">
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
                                    </div>
                                  );
                                })}

                                {/* Equipment Untagging Summary */}
                                {tags.length > 0 && (
                                  <div className="bg-gradient-to-r from-blue-50 to-blue-50/30 rounded-xl border border-blue-200 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="p-2 bg-blue-100 rounded-lg">
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <h4 className="font-semibold text-gray-900">Equipment Untagging Progress</h4>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      {tags.map((tag, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white rounded-lg px-4 py-3 border border-blue-100">
                                          <span className="font-medium text-gray-700">{tag.tag_name}</span>
                                          <span className="font-bold text-blue-600">₱{parseFloat(tag.tag_amount).toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-blue-200">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                          Total: <strong className="text-blue-600">₱{totalTagged.toLocaleString()}</strong>
                                        </span>
                                        <span className="text-sm text-gray-600">
                                          {percentage.toFixed(1)}% of ₱{project.project_cost.toLocaleString()}
                                        </span>
                                      </div>
                                      
                                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                                          style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Projects Found</h3>
                        <p className="text-gray-500">No project progress records found for your company.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}