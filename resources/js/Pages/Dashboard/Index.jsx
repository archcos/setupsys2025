import { useState, useMemo, useEffect } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import { Search, X, Filter, CheckCircle2, Circle, Download, ExternalLink, AlertTriangle, Ban, Calendar, Building2, FileText, BadgeCheck, FileCheck2, Wrench, Wallet, Trophy, TrendingUp, FolderOpen, DollarSign, Clock, ChevronDown, ChevronUp, ArrowUpRight, Menu, Grid, List } from 'lucide-react';

// ─── UTILS ────────────────────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-PH');

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
const statusMap = {
  Draft: 'border-gray-300 text-gray-600 bg-gray-50',
  'For Review': 'border-yellow-300 text-yellow-700 bg-yellow-50',
  Approved: 'border-blue-300 text-blue-700 bg-blue-50',
  Implementation: 'border-indigo-300 text-indigo-700 bg-indigo-50',
  Refund: 'border-purple-300 text-purple-700 bg-purple-50',
  Completed: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Withdrawn: 'border-amber-300 text-amber-700 bg-amber-50',
  Terminated: 'border-red-300 text-red-700 bg-red-50',
};

const StatusPill = ({ status, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusMap[status] || statusMap.Draft} ${className}`}>
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
      status === 'Completed' ? 'bg-emerald-500' : 
      status === 'Withdrawn' ? 'bg-amber-500' : 
      status === 'Terminated' ? 'bg-red-500' : 
      'bg-current'
    }`} />
    {status}
  </span>
);

// ─── MOBILE PROJECT CARD ──────────────────────────────────────────────────────
const MobileProjectCard = ({ project, onClick }) => {
  const progressBarColor = 
    project.progress_status === 'Completed' ? 'bg-emerald-500' :
    project.progress_status === 'Withdrawn' ? 'bg-amber-400' :
    project.progress_status === 'Terminated' ? 'bg-red-500' :
    'bg-indigo-500';

  return (
    <div onClick={onClick} className="bg-white rounded-2xl border border-gray-200 p-4 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <StatusPill status={project.progress_status} />
        <span className="text-xs font-bold text-gray-400">{project.overall_progress}%</span>
      </div>
      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{project.project_title}</h3>
      <p className="text-xs text-gray-500 mb-3">{project.proponent?.company_name}</p>
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${progressBarColor}`} style={{ width: `${project.overall_progress}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">₱{formatCurrency(project.project_cost)}</span>
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(project.created_at)}
        </span>
      </div>
    </div>
  );
};

// ─── DESKTOP PROJECT ROW ──────────────────────────────────────────────────────
const DesktopProjectRow = ({ project, onClick }) => {
  const progressBarColor = 
    project.progress_status === 'Completed' ? 'bg-emerald-500' :
    project.progress_status === 'Withdrawn' ? 'bg-amber-400' :
    project.progress_status === 'Terminated' ? 'bg-red-500' :
    project.progress_status === 'Refund' ? 'bg-purple-500' :
    project.progress_status === 'Implementation' ? 'bg-indigo-500' :
    'bg-blue-500';

  return (
    <div onClick={onClick} className="group bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer hidden sm:block">
      <div className="flex items-center gap-4">
        <div className="w-28 flex-shrink-0">
          <StatusPill status={project.progress_status} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors text-sm">
            {project.project_title}
          </h3>
          <p className="text-xs text-gray-500 truncate mt-0.5">{project.proponent?.company_name}</p>
        </div>
        <div className="w-28 text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-900">₱{formatCurrency(project.project_cost)}</p>
        </div>
        <div className="w-36 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${progressBarColor}`} style={{ width: `${project.overall_progress}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-500 w-8 text-right">{project.overall_progress}%</span>
          </div>
        </div>
        <div className="w-24 text-right flex-shrink-0">
          <span className="text-xs text-gray-400 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(project.created_at)}
          </span>
        </div>
        <div className="flex-shrink-0">
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE PANEL (MOBILE: FULL SCREEN, DESKTOP: RIGHT PANEL) ──────────────────
const iconMap = {
  Building: Building2,
  FileText: FileText,
  CheckBadge: BadgeCheck,
  FileCheck: FileCheck2,
  Wrench: Wrench,
  Wallet: Wallet,
  Trophy: Trophy,
};

const SlidePanel = ({ project, onClose }) => {
  const [expandedSection, setExpandedSection] = useState('timeline');
  
  // Lock body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!project) return null;

  const milestones = project.milestones || [];
  const impl = project.implementation;
  const refund = project.refund;
  const moa = project.moa;
  const withdrawn = project.is_withdrawn;
  const terminated = project.is_terminated;
  const completedMilestones = milestones.filter(m => m.completed).length;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[560px] bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              <StatusPill status={project.progress_status} />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-2 leading-snug line-clamp-2">{project.project_title}</h2>
              <p className="text-sm text-gray-500 mt-1 truncate">{project.proponent?.company_name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 -mr-1">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-500">Budget</p>
              <p className="text-sm sm:text-base font-bold text-gray-900 truncate">₱{formatCurrency(project.project_cost)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-500">Progress</p>
              <p className="text-sm sm:text-base font-bold text-gray-900">{project.overall_progress}%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-500">Milestones</p>
              <p className="text-sm sm:text-base font-bold text-gray-900">{completedMilestones}/{milestones.length}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 overscroll-contain">
          
          {/* Alert */}
          {(withdrawn || terminated) && (
            <div className={`p-3 sm:p-4 rounded-2xl border-l-4 ${withdrawn ? 'bg-amber-50 border-amber-400' : 'bg-red-50 border-red-400'}`}>
              <div className="flex gap-2 sm:gap-3">
                {withdrawn ? <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" /> : <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className={`text-sm font-bold ${withdrawn ? 'text-amber-800' : 'text-red-800'}`}>Project {project.progress_status}</p>
                  <p className={`text-xs mt-1 ${withdrawn ? 'text-amber-700' : 'text-red-700'}`}>
                    {withdrawn ? 'This project has been withdrawn.' : 'This project has been terminated.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overall Progress</h4>
              <span className="text-sm font-bold text-gray-900">{project.overall_progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  project.progress_status === 'Completed' ? 'bg-emerald-500' :
                  project.progress_status === 'Withdrawn' ? 'bg-amber-400' :
                  project.progress_status === 'Terminated' ? 'bg-red-500' :
                  'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${project.overall_progress}%` }} 
              />
            </div>
          </div>

          {/* MOA */}
          {moa && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setExpandedSection(expandedSection === 'moa' ? '' : 'moa')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${moa.has_approved_file ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <FileCheck2 className={`w-4 h-4 ${moa.has_approved_file ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">Memorandum of Agreement</p>
                    <p className="text-xs text-gray-500 truncate">{moa.has_approved_file ? 'Approved & Uploaded' : 'Pending Approval'}</p>
                  </div>
                </div>
                {expandedSection === 'moa' ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />}
              </button>
              
              {expandedSection === 'moa' && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  {moa.has_approved_file ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">MOA has been approved and uploaded</span>
                      </div>
                      {moa.approved_file_uploaded_at && (
                        <p className="text-xs text-gray-500 pl-6">Uploaded on {formatDate(moa.approved_file_uploaded_at)}</p>
                      )}
                      {moa.approved_by && (
                        <p className="text-xs text-gray-500 pl-6">Uploaded by: {moa.approved_by}</p>
                      )}
                      <div className="pl-6 pt-1">
                        <a 
                          href={`/moa/${moa.id}/download-approved`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download MOA
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">Waiting for MOA approval and upload</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Implementation */}
          {impl && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setExpandedSection(expandedSection === 'implementation' ? '' : 'implementation')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-indigo-100 flex-shrink-0">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">Implementation</p>
                    <p className="text-xs text-gray-500 truncate">{impl.is_fully_untagged && impl.liquidation_upload ? 'Completed' : 'In Progress'}</p>
                  </div>
                </div>
                {expandedSection === 'implementation' ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />}
              </button>
              
              {expandedSection === 'implementation' && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  <div className="space-y-1.5">
                    {[
                      { label: 'Implementation Started', done: true, date: impl.created_at },
                      { label: 'Tarpaulin Uploaded', done: !!impl.tarp_upload, date: impl.tarp_upload },
                      { label: 'PDC Uploaded', done: !!impl.pdc_upload, date: impl.pdc_upload },
                      { label: 'Final Untagging (100%)', done: impl.is_fully_untagged, date: impl.final_untag_date },
                      { label: 'Liquidation Submitted', done: !!impl.liquidation_upload, date: impl.liquidation_upload },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          )}
                          <span className={`text-xs sm:text-sm truncate ${item.done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{item.label}</span>
                        </div>
                        {item.date && (
                          <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0 ml-2">{formatDate(item.date)}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {impl.tags && impl.tags.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Equipment Tagged</span>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-900">₱{formatCurrency(impl.total_tag_amount)} ({impl.tag_percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: `${Math.min(impl.tag_percentage, 100)}%` }} />
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {impl.tags.map((tag, i) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-700 font-medium truncate mr-2">{tag.tag_name}</span>
                            <span className="font-bold text-gray-900 flex-shrink-0">₱{formatCurrency(tag.tag_amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Refund */}
          {refund && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setExpandedSection(expandedSection === 'refund' ? '' : 'refund')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${refund.completed ? 'bg-emerald-100' : 'bg-purple-100'}`}>
                    <Wallet className={`w-4 h-4 ${refund.completed ? 'text-emerald-600' : 'text-purple-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">Refund</p>
                    <p className="text-xs text-gray-500 truncate">{refund.completed ? 'Completed' : `${refund.progress}% complete`}</p>
                  </div>
                </div>
                {expandedSection === 'refund' ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />}
              </button>
              
              {expandedSection === 'refund' && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${refund.progress}%` }} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-[10px] sm:text-xs text-gray-500">Period</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{refund.initial} — {refund.end}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-[10px] sm:text-xs text-gray-500">Paid Months</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{refund.paid_months} / {refund.total_months}</p>
                    </div>
                  </div>

                  {refund.completed ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                      <span className="text-xs sm:text-sm font-medium">All refunds completed</span>
                    </div>
                  ) : (
                    <Link href={`/my-refunds`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Manage Refunds
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'timeline' ? '' : 'timeline')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-gray-100 flex-shrink-0">
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Timeline</p>
                  <p className="text-xs text-gray-500 truncate">{completedMilestones} of {milestones.length} stages complete</p>
                </div>
              </div>
              {expandedSection === 'timeline' ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />}
            </button>
            
            {expandedSection === 'timeline' && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <div className="relative pl-6">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
                  
                  <div className="space-y-5">
                    {milestones.map((milestone, i) => {
                      const Icon = iconMap[milestone.icon] || Circle;
                      return (
                        <div key={milestone.id} className="relative">
                          <div className={`absolute -left-[25px] top-0.5 rounded-full p-1.5 ${
                            milestone.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`text-sm font-bold ${milestone.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {milestone.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
                              </div>
                              {milestone.date && (
                                <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0 mt-0.5">{formatDate(milestone.date)}</span>
                              )}
                            </div>

                            {milestone.subItems && milestone.subItems.length > 0 && (
                              <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-gray-100">
                                {milestone.subItems.map((sub, j) => (
                                  <div key={j} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {sub.completed ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                      )}
                                      <span className={`text-xs truncate ${sub.completed ? 'text-gray-600' : 'text-gray-400'}`}>{sub.label}</span>
                                    </div>
                                    {sub.date && <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(sub.date)}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">#{project.project_id}</span>
            <button onClick={onClose} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors active:scale-95">
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @media (max-width: 640px) {
          .animate-slide-in {
            animation: slideIn 0.25s ease-out;
          }
        }
      `}</style>
    </div>
  );
};

// ─── STAT CARDS ───────────────────────────────────────────────────────────────
const statCards = [
  { key: 'total', label: 'Total', icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'active', label: 'Active', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { key: 'withdrawn', label: 'Withdrawn', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'terminated', label: 'Terminated', icon: Ban, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { key: 'attention', label: 'Attention', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
];

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { projectDetails, userCompanyName } = usePage().props;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // default to grid for mobile
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const projects = projectDetails || [];

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => !['Completed','Withdrawn','Terminated','Disapproved'].includes(p.progress_status)).length,
    completed: projects.filter(p => p.progress_status === 'Completed').length,
    withdrawn: projects.filter(p => p.progress_status === 'Withdrawn').length,
    terminated: projects.filter(p => p.progress_status === 'Terminated').length,
    attention: projects.filter(p => {
      if (['Completed','Withdrawn','Terminated','Disapproved'].includes(p.progress_status)) return false;
      const impl = p.implementation;
      return impl && (!impl.tarp_upload || !impl.pdc_upload || !impl.liquidation_upload || !impl.is_fully_untagged);
    }).length,
  }), [projects]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const q = search.toLowerCase();
      if (q && !p.project_title?.toLowerCase().includes(q) && !p.proponent?.company_name?.toLowerCase().includes(q)) return false;
      switch (filter) {
        case 'active': return !['Completed','Withdrawn','Terminated','Disapproved'].includes(p.progress_status);
        case 'completed': return p.progress_status === 'Completed';
        case 'withdrawn': return p.progress_status === 'Withdrawn';
        case 'terminated': return p.progress_status === 'Terminated';
        case 'attention':
          if (['Completed','Withdrawn','Terminated','Disapproved'].includes(p.progress_status)) return false;
          const impl = p.implementation;
          return impl && (!impl.tarp_upload || !impl.pdc_upload || !impl.liquidation_upload || !impl.is_fully_untagged);
        default: return true;
      }
    });
  }, [projects, filter, search]);

  const filterTabs = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'withdrawn', label: 'Withdrawn', count: stats.withdrawn },
    { key: 'terminated', label: 'Terminated', count: stats.terminated },
    { key: 'attention', label: 'Attention', count: stats.attention },
  ];

  const totalBudget = projects.reduce((s, p) => s + (p.project_cost || 0), 0);
  const selectedProject = projects.find(p => p.project_id === selectedProjectId) || null;

  return (
    <div className="min-h-screen ">
      <Head title="Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{userCompanyName}</h1>
            <p className="text-xs sm:text-sm">Project Portfolio Dashboard</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Total Budget</p>
              <p className="text-lg sm:text-xl font-black">₱{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </div>

        {/* Stats Row - Scrollable on mobile */}
        <div className="flex sm:grid sm:grid-cols-6 gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
          {statCards.map(card => (
            <div key={card.key} className={`bg-white rounded-xl sm:rounded-2xl border ${card.border} p-3 sm:p-4 hover:shadow-md transition-shadow cursor-default flex-shrink-0 w-[130px] sm:w-auto`}>
              <div className={`inline-flex p-1.5 sm:p-2 rounded-lg ${card.bg} mb-1.5 sm:mb-2`}>
                <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color}`} />
              </div>
              <p className="text-lg sm:text-2xl font-black text-gray-900">{stats[card.key]}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Filters - Mobile: Expandable, Desktop: Always visible */}
        <div className="bg-white rounded-2xl border border-gray-200">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="sm:hidden w-full flex items-center justify-between p-4 text-sm font-bold text-gray-900"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{filtered.length}</span>
            </span>
            {showMobileFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block p-3 sm:p-4`}>
            {/* Filter Tabs - Scrollable */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    filter === tab.key
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${
                    filter === tab.key ? 'bg-white/20' : 'bg-gray-200'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>
            
            {/* Search & View Mode */}
            <div className="flex items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>

              {/* View Toggle */}
              <div className="hidden sm:flex bg-gray-100 rounded-xl p-1 flex-shrink-0">
                <button onClick={() => setViewMode('rows')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'rows' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  <Grid className="w-3.5 h-3.5" /> Grid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm ">
            Showing <span className="font-bold">{filtered.length}</span> of <span className="font-bold ">{projects.length}</span> projects
          </p>
          {viewMode === 'rows' && (
            <p className="text-[10px] text-gray-400 hidden sm:block">Click a row to view details</p>
          )}
        </div>

        {/* Projects List */}
        {filtered.length > 0 ? (
          <>
            {/* Desktop: List View */}
            {viewMode === 'rows' && (
              <div className="hidden sm:block space-y-2">
                {filtered.map(project => (
                  <DesktopProjectRow 
                    key={project.project_id} 
                    project={project} 
                    onClick={() => setSelectedProjectId(project.project_id)} 
                  />
                ))}
              </div>
            )}

            {/* Mobile + Desktop: Grid View */}
            {(viewMode === 'grid' || typeof window !== 'undefined' && window.innerWidth < 640) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filtered.map(project => (
                  <MobileProjectCard
                    key={project.project_id}
                    project={project}
                    onClick={() => setSelectedProjectId(project.project_id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-200">
            <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">No projects found</h3>
            <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Slide Panel */}
      {selectedProject && (
        <SlidePanel 
          project={selectedProject} 
          onClose={() => setSelectedProjectId(null)} 
        />
      )}

      {/* Hide scrollbar utility */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}