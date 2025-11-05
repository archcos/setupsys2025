import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { 
  ClipboardList, 
  FileCheck, 
  Users, 
  CheckCircle, 
  ThumbsUp,
  Calendar,
  Video,
  Building2,
  User,
  X,
  Filter,
  Stamp
} from 'lucide-react';

export default function Dashboard({ statusCounts, allowedStatuses, projects, currentFilter, userRole }) {
  const [selectedFilter, setSelectedFilter] = useState(currentFilter || null);

  // Card configuration - now only in frontend
  const cardConfig = {
    internal_rtec: {
      label: 'Internal RTEC',
      color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      icon: ClipboardList,
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    internal_compliance: {
      label: 'Internal Compliance',
      color: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      icon: FileCheck,
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    external_rtec: {
      label: 'External RTEC',
      color: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      icon: Users,
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    external_compliance: {
      label: 'External Compliance',
      color: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      icon: CheckCircle,
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    approval: {
      label: 'Approval',
      color: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
      icon: Stamp,
      badge: 'bg-teal-100 text-teal-700 border-teal-200',
    },
    Approved: {
      label: 'Approved',
      color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      icon: ThumbsUp,
      badge: 'bg-green-100 text-green-700 border-green-200',
    },
  };

  const handleCardClick = (status) => {
    const newFilter = selectedFilter === status ? null : status;
    setSelectedFilter(newFilter);
    
    router.get(route('rtec.dashboard'), 
      newFilter ? { status: newFilter } : {},
      { preserveState: false, preserveScroll: true }
    );
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    router.get(route('rtec.dashboard'), {}, { preserveState: false, preserveScroll: true });
  };

  const formatLabel = (text) => {
    return text.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
            <h1 className="text-4xl font-bold text-gray-900">
              RTEC Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-base ml-4">
            {userRole === 'irtec' 
              ? 'Internal RTEC Management' 
              : userRole === 'ertec' 
              ? 'External RTEC Management' 
              : 'RTEC Management'}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          {allowedStatuses.map((status) => {
            const config = cardConfig[status];
            if (!config) return null;
            
            const Icon = config.icon;
            const isSelected = selectedFilter === status;
            
            return (
              <button
                key={status}
                onClick={() => handleCardClick(status)}
                className={`relative group bg-white text-gray-900 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${config.badge}`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{statusCounts[status] || 0}</div>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700">{config.label}</p>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Filter */}
        {selectedFilter && (
          <div className="mb-8 flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-200/50 backdrop-blur-sm">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Active Filter:</span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-bold shadow-md">
              {formatLabel(selectedFilter)}
              <button
                onClick={clearFilter}
                className="hover:bg-white/20 rounded-full p-1 transition-all duration-200"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </span>
          </div>
        )}

        {/* Projects List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ClipboardList className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Projects
                </h2>
                <p className="text-sm text-gray-600">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'} in view
                </p>
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-6 shadow-inner">
                <ClipboardList className="w-10 h-10 text-gray-400" strokeWidth={2} />
              </div>
              <p className="text-gray-700 text-xl font-semibold mb-2">No projects found</p>
              <p className="text-gray-500 text-base">Projects will appear here once assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50">
              {projects.map((project) => {
                const badge = cardConfig[project.progress]?.badge || 'bg-gray-100 text-gray-700 border-gray-200';
                
                return (
                  <div
                    key={project.rtec_id}
                    className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-4">
                          <h3 className="text-xl font-bold text-gray-900 flex-1 leading-tight">
                            {project.project_title}
                          </h3>
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border-2 shadow-sm ${badge}`}>
                            {formatLabel(project.progress)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Company</div>
                              <div className="font-bold text-gray-900 truncate">{project.company_name}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                              <User className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Assigned to</div>
                              <div className="font-bold text-gray-900 truncate">{project.assigned_user}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-gray-600 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                              <Calendar className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Schedule</div>
                              <div className="font-bold text-gray-900 truncate">{project.schedule}</div>
                            </div>
                          </div>
                        </div>

                        {project.zoom_link && (
                          <div className="mt-4 flex items-center gap-3 bg-blue-50/70 rounded-xl p-4 border border-blue-200/50">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                              <Video className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            
                            <a href={project.zoom_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-700 hover:text-blue-900 font-bold hover:underline transition-all duration-200 flex items-center gap-2 group"
                            >
                              Join Zoom Meeting 
                              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="lg:ml-6 flex-shrink-0 text-right bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl px-5 py-4 lg:min-w-[160px] border border-gray-200/50 shadow-sm">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Added on</p>
                        <p className="text-base font-bold text-gray-900">
                          {project.created_at}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
}