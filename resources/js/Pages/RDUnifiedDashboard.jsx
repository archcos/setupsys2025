// Resources/js/Pages/RDUnifiedDashboard.jsx

import React, { useState, useMemo } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  AlertTriangle,
  Building2,
  Calendar,
  Search,
  Eye,
  Download,
  Bell,
  TrendingUp,
  Shield,
  ChevronRight,
  FileCheck,
  Users,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ChevronDown
} from 'lucide-react';

export default function RDUnifiedDashboard({
  complianceProjects,
  complianceStats,
  restructureApplications,
  restructureStats,
  offices,
  years,
  activeTab: initialTab,
  filters
}) {
  const { flash } = usePage().props;

  const [activeTab, setActiveTab] = useState(initialTab || 'compliance');
  const [expandedItem, setExpandedItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [restructureFilter, setRestructureFilter] = useState('recommended');
  const [complianceOfficeFilter, setComplianceOfficeFilter] = useState(filters?.complianceOfficeFilter || '');
  const [officeFilter, setOfficeFilter] = useState(filters?.officeFilter || '');
  const [yearFilter, setYearFilter] = useState(filters?.yearFilter || '');
  const [preview, setPreview] = useState({ show: false, url: null, type: null, label: null, raw: null });

  const [complianceCurrentPage, setComplianceCurrentPage] = useState(1);
  const complianceItemsPerPage = 10;

  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [disapprovalRemark, setDisapprovalRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const compliancePending = complianceStats?.pending || 0;
  const restructuringPending = restructureStats?.recommended || 0;

  const complianceDocs = [
    { key: 'pp_link', label: 'Project Proposal', icon: FileText },
    { key: 'fs_link', label: 'Financial Statement', icon: FileText }
  ];

  const restructureDocs = [
    { key: 'proponent', label: 'Proponent', icon: FileText },
    { key: 'psto', label: 'PSTO', icon: FileText },
    { key: 'annexc', label: 'Annex C', icon: FileText },
    { key: 'annexd', label: 'Annex D', icon: FileText }
  ];

  const filteredProjects = useMemo(() => {
    if (!complianceProjects) return [];
    let projects = complianceProjects;

    if (complianceOfficeFilter) {
      projects = projects.filter(p =>
        p.proponent?.office_id?.toString() === complianceOfficeFilter
      );
    }

    if (activeFilter === 'pending') {
      projects = projects.filter(p => !p.progress || (p.progress !== 'Approved' && p.progress !== 'Disapproved'));
    } else if (activeFilter === 'approved') {
      projects = projects.filter(p => p.progress === 'Approved');
    } else if (activeFilter === 'disapproved') {
      projects = projects.filter(p => p.progress === 'Disapproved');
    }
    return projects;
  }, [complianceProjects, activeFilter, complianceOfficeFilter]);

  const paginatedProjects = useMemo(() => {
    const start = (complianceCurrentPage - 1) * complianceItemsPerPage;
    return filteredProjects.slice(start, start + complianceItemsPerPage);
  }, [filteredProjects, complianceCurrentPage]);

  const totalCompliancePages = Math.ceil(filteredProjects.length / complianceItemsPerPage);

  const filteredRestructures = useMemo(() => {
    if (!restructureApplications?.data) return [];
    let items = restructureApplications.data;
    if (officeFilter) {
      items = items.filter(item =>
        item.project?.proponent?.office_id?.toString() === officeFilter
      );
    }
    if (restructureFilter === 'recommended') {
      items = items.filter(item => item.computed_status === 'recommended');
    } else if (restructureFilter === 'approved') {
      items = items.filter(item => item.computed_status === 'approved');
    }
    // 'total' shows all
    return items;
  }, [restructureApplications?.data, officeFilter, restructureFilter]);

  const openApprovalModal = (type, item) => {
    setSelectedItem({
      type,
      id: type === 'compliance' ? item.project_id : item.restructure?.restruct_id,
      title: item.project_title || item.project?.project_title,
      item
    });
    setShowApprovalModal(true);
  };

  const openDisapprovalModal = (type, item) => {
    setSelectedItem({
      type,
      id: type === 'compliance' ? item.project_id : item.restructure?.restruct_id,
      title: item.project_title || item.project?.project_title,
      item
    });
    setDisapprovalRemark('');
    setShowDisapprovalModal(true);
  };

  const confirmApprove = () => {
    setIsSubmitting(true);
    if (selectedItem?.type === 'compliance') {
      router.post(route('rd.compliance.update-status', selectedItem.id), { status: 'Approved' }, {
        preserveScroll: true,
        onFinish: () => { setIsSubmitting(false); setShowApprovalModal(false); setSelectedItem(null); }
      });
    } else {
      router.post(route('rd.restructure.update-status', selectedItem.id), {
        status: 'approved',
        remarks: 'Application approved by Regional Director'
      }, {
        preserveScroll: true,
        onFinish: () => { setIsSubmitting(false); setShowApprovalModal(false); setSelectedItem(null); }
      });
    }
  };

  const confirmDisapprove = () => {
    if (!disapprovalRemark.trim() || disapprovalRemark.trim().length < 5) {
      alert('Please provide a remark (minimum 5 characters)');
      return;
    }
    setIsSubmitting(true);
    if (selectedItem?.type === 'compliance') {
      router.post(route('rd.compliance.update-status', selectedItem.id), {
        status: 'Disapproved',
        remark: disapprovalRemark
      }, {
        preserveScroll: true,
        onFinish: () => { setIsSubmitting(false); setShowDisapprovalModal(false); setSelectedItem(null); setDisapprovalRemark(''); }
      });
    } else {
      router.post(route('rd.restructure.update-status', selectedItem.id), {
        status: 'pending',
        remarks: disapprovalRemark
      }, {
        preserveScroll: true,
        onFinish: () => { setIsSubmitting(false); setShowDisapprovalModal(false); setSelectedItem(null); setDisapprovalRemark(''); }
      });
    }
  };

  const openPreview = (val, label) => {
    const url = route('apply_restruct.view_file') + `?path=${encodeURIComponent(val)}`;
    const ext = val.split('.').pop().toLowerCase();
    const type = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : 'pdf';
    setPreview({ show: true, url, type, label, raw: val });
  };

  const getComplianceStatus = (progress) => {
    if (progress === 'Approved') return { label: 'Approved', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 ring-1 ring-emerald-200' };
    if (progress === 'Disapproved') return { label: 'Disapproved', dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50 ring-1 ring-rose-200' };
    return { label: 'Pending review', dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 ring-1 ring-amber-200' };
  };

  const getRestructureStatus = (status) => {
    if (status === 'approved') return { label: 'Approved', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 ring-1 ring-emerald-200' };
    if (status === 'recommended') return { label: 'Recommended', dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50 ring-1 ring-blue-200' };
    return { label: 'Pending', dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100 ring-1 ring-slate-200' };
  };

  const clearFilters = () => {
    setOfficeFilter('');
    setYearFilter('');
    router.get(route('rd.unified.dashboard'), { tab: 'restructuring' });
  };

  const isPendingCompliance = (project) =>
    !project.progress || (project.progress !== 'Approved' && project.progress !== 'Disapproved');

  // ─── Shared card subcomponent ────────────────────────────────────────────────
  const CardRow = ({ id, isExpanded, onToggle, statusBadge, title, subtitle, meta, expandedContent }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
        className="w-full text-left px-5 py-4 flex items-center gap-4 cursor-pointer select-none"
      >
        <span className={`shrink-0 w-2 h-2 rounded-full mt-0.5 ${statusBadge.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-sm text-slate-900 leading-snug">{title}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
          {meta && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              {meta}
            </div>
          )}
        </div>
        <ChevronDown
          className={`shrink-0 w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/60">
          {expandedContent}
        </div>
      )}
    </div>
  );

  const MetaChip = ({ icon: Icon, label }) => (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );

  const ActionRow = ({ onApprove, onDeny, approveLabel = 'Approve', denyLabel = 'Deny' }) => (
    <div className="flex gap-2 pt-4 mt-4 border-t border-slate-200">
      <button
        onClick={onApprove}
        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Check className="w-3.5 h-3.5" />
        {approveLabel}
      </button>
      <button
        onClick={onDeny}
        className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-sm font-medium rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        {denyLabel}
      </button>
    </div>
  );

  const DocLink = ({ href, label }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs text-slate-700 font-medium transition-colors"
    >
      <FileText className="w-3.5 h-3.5 text-slate-400" />
      {label}
      <ExternalLink className="w-3 h-3 text-slate-400" />
    </a>
  );

  const DocButton = ({ onClick, label }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs text-slate-700 font-medium transition-colors"
    >
      <FileText className="w-3.5 h-3.5 text-slate-400" />
      {label}
      <Eye className="w-3 h-3 text-slate-400" />
    </button>
  );

  // ─── Pagination ──────────────────────────────────────────────────────────────
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl mt-4">
        <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
        <div className="flex gap-0.5">
          <PagBtn onClick={() => onPageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="w-3.5 h-3.5" /></PagBtn>
          <PagBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-3.5 h-3.5" /></PagBtn>
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 text-xs rounded-md transition-colors ${p === currentPage ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {p}
            </button>
          ))}
          <PagBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-3.5 h-3.5" /></PagBtn>
          <PagBtn onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="w-3.5 h-3.5" /></PagBtn>
        </div>
      </div>
    );
  };

  const PagBtn = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled}
      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-slate-100"
    >{children}</button>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen">
      <Head title="RD Dashboard - Approvals" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-7">
          <div>
            <h1 className="text-xl font-bold">Regional Director's Dashboard</h1>
            <p className="text-sm mt-0.5">Review and approve pending submissions</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
            <Shield className="w-4 h-4 text-slate-500" />
            Regional Director
          </div>
        </div>

        {/* Flash messages */}
        {flash?.success && (
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {flash.error}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-7 w-fit">
          {[
            { key: 'compliance', icon: FileCheck, label: 'Project Approval', count: compliancePending },
            { key: 'restructuring', icon: TrendingUp, label: 'Restructuring Approval', count: restructuringPending }
          ].map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === key ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ COMPLIANCE TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'compliance' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { key: 'pending', label: 'Pending', value: compliancePending, color: 'amber' },
                { key: 'approved', label: 'Approved', value: complianceStats?.approved || 0, color: 'emerald' },
                { key: 'disapproved', label: 'Disapproved', value: complianceStats?.disapproved || 0, color: 'rose' },
                { key: 'total', label: 'Total', value: complianceStats?.total || 0, color: 'slate' },
              ].map(({ key, label, value, color }) => (
                <MiniStat
                  key={key}
                  label={label}
                  value={value}
                  color={color}
                  active={activeFilter === key}
                  onClick={() => { setActiveFilter(key); setComplianceCurrentPage(1); }}
                />
              ))}
            </div>

            {/* Office filter */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-xs">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={complianceOfficeFilter}
                  onChange={(e) => {
                    setComplianceOfficeFilter(e.target.value);
                    setComplianceCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent appearance-none"
                >
                  <option value="">All offices</option>
                  {offices?.map(o => (
                    <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                  ))}
                </select>
              </div>
              {complianceOfficeFilter && (
                <button
                  onClick={() => { setComplianceOfficeFilter(''); setComplianceCurrentPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-2">
              {paginatedProjects.length === 0 ? (
                <EmptyState icon={FileCheck} message="No compliance projects to display" />
              ) : (
                paginatedProjects.map((project) => {
                  const status = getComplianceStatus(project.progress);
                  const isExpanded = expandedItem === project.project_id;
                  const isPending = isPendingCompliance(project);
                  const docs = complianceDocs.filter(({ key }) => project.compliance?.[key]);

                  return (
                    <CardRow
                      key={project.project_id}
                      id={project.project_id}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedItem(isExpanded ? null : project.project_id)}
                      statusBadge={status}
                      title={project.project_title}
                      subtitle={project.proponent?.company_name}
                      meta={
                        <>
                          {project.proponent?.office?.office_name && (
                            <MetaChip icon={Building2} label={project.proponent.office.office_name} />
                          )}
                          {docs.length > 0 && (
                            <MetaChip icon={FileText} label={`${docs.length} document${docs.length !== 1 ? 's' : ''}`} />
                          )}
                        </>
                      }
                      expandedContent={
                        <>
                          {docs.length > 0 && (
                            <div className="mb-0">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 mt-3">Documents</p>
                              <div className="flex flex-wrap gap-2">
                                {complianceDocs.map(({ key, label }) => {
                                  const link = project.compliance?.[key];
                                  if (!link) return null;
                                  return <DocLink key={key} href={link} label={label} />;
                                })}
                              </div>
                            </div>
                          )}
                          {isPending ? (
                            <ActionRow
                              onApprove={() => openApprovalModal('compliance', project)}
                              onDeny={() => openDisapprovalModal('compliance', project)}
                              approveLabel="Approve project"
                              denyLabel="Request changes"
                            />
                          ) : (
                            <p className={`mt-4 pt-4 border-t border-slate-200 text-xs font-medium ${project.progress === 'Approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {project.progress === 'Approved' ? '✓ Already approved' : '✗ Already disapproved'}
                            </p>
                          )}
                        </>
                      }
                    />
                  );
                })
              )}
            </div>

            <Pagination
              currentPage={complianceCurrentPage}
              totalPages={totalCompliancePages}
              onPageChange={setComplianceCurrentPage}
            />
          </>
        )}

        {/* ═══ RESTRUCTURING TAB ════════════════════════════════════════════════ */}
        {activeTab === 'restructuring' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { key: 'recommended', label: 'Pending', value: restructuringPending, color: 'amber' },
                { key: 'approved', label: 'Approved', value: restructureStats?.approved || 0, color: 'emerald' },
                { key: 'total', label: 'Total', value: restructureStats?.total || 0, color: 'slate' },
              ].map(({ key, label, value, color }) => (
                <MiniStat
                  key={key}
                  label={label}
                  value={value}
                  color={color}
                  active={restructureFilter === key}
                  onClick={() => setRestructureFilter(key)}
                />
              ))}
            </div>

            {/* Office filter */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-xs">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={officeFilter}
                  onChange={(e) => {
                    setOfficeFilter(e.target.value);
                    router.get(route('rd.unified.dashboard'), { tab: 'restructuring', officeFilter: e.target.value, yearFilter });
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-400 focus:border-transparent appearance-none"
                >
                  <option value="">All offices</option>
                  {offices?.map(o => <option key={o.office_id} value={o.office_id}>{o.office_name}</option>)}
                </select>
              </div>
              {(officeFilter || yearFilter) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-2">
              {filteredRestructures.length === 0 ? (
                <EmptyState icon={Bell} message="No restructuring requests found" sub="Recommended applications will appear here" />
              ) : (
                filteredRestructures.map((item) => {
                  const status = getRestructureStatus(item.computed_status);
                  const isExpanded = expandedItem === `restructure_${item.apply_id}`;
                  const docs = restructureDocs.filter(({ key }) => item[key]);

                  return (
                    <CardRow
                      key={item.apply_id}
                      id={`restructure_${item.apply_id}`}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedItem(isExpanded ? null : `restructure_${item.apply_id}`)}
                      statusBadge={status}
                      title={item.project?.project_title}
                      subtitle={item.project?.proponent?.company_name}
                      meta={
                        <>
                          {item.project?.proponent?.office?.office_name && (
                            <MetaChip icon={Building2} label={item.project.proponent.office.office_name} />
                          )}
                          <MetaChip icon={FileText} label={item.project_id} />
                          {docs.length > 0 && (
                            <MetaChip icon={FileText} label={`${docs.length} document${docs.length !== 1 ? 's' : ''}`} />
                          )}
                        </>
                      }
                      expandedContent={
                        <>
                          {docs.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 mt-3">Documents</p>
                              <div className="flex flex-wrap gap-2">
                                {restructureDocs.map(({ key, label }) => {
                                  const val = item[key];
                                  if (!val) return null;
                                  return <DocButton key={key} label={label} onClick={() => openPreview(val, label)} />;
                                })}
                              </div>
                            </div>
                          )}
                          <ActionRow
                            onApprove={() => openApprovalModal('restructure', item)}
                            onDeny={() => openDisapprovalModal('restructure', item)}
                            approveLabel="Approve restructuring"
                            denyLabel="Deny request"
                          />
                        </>
                      }
                    />
                  );
                })
              )}
            </div>

            {/* Server-side pagination */}
            {restructureApplications?.links && restructureApplications.links.length > 3 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl mt-4">
                <span className="text-xs text-slate-500">
                  Showing {restructureApplications.from}–{restructureApplications.to} of {restructureApplications.total}
                </span>
                <div className="flex gap-0.5">
                  {restructureApplications.links.slice(1, -1).map((link, i) => (
                    <button
                      key={i}
                      onClick={() => link.url && router.get(link.url)}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className={`w-7 h-7 text-xs rounded-md transition-colors ${
                        link.active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      } ${!link.url ? 'opacity-30 cursor-not-allowed' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Approval modal ─────────────────────────────────────────── */}
      {showApprovalModal && (
        <Modal onClose={() => setShowApprovalModal(false)}>
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-emerald-100 rounded-full mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Confirm approval</h3>
            <p className="text-sm text-slate-500 mt-1">
              {selectedItem?.type === 'compliance' ? 'Approve this project compliance?' : 'Approve this restructuring application?'}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-5 text-sm font-medium text-slate-800">
            {selectedItem?.title}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="flex-1 py-2 text-sm border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmApprove}
              disabled={isSubmitting}
              className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Processing…' : 'Yes, approve'}
            </button>
          </div>
        </Modal>
      )}

      {/* ─── Disapproval modal ──────────────────────────────────────── */}
      {showDisapprovalModal && (
        <Modal onClose={() => setShowDisapprovalModal(false)}>
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-rose-100 rounded-full mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {selectedItem?.type === 'compliance' ? 'Request changes' : 'Deny application'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">Provide feedback for the applicant</p>
          </div>
          <textarea
            value={disapprovalRemark}
            onChange={(e) => setDisapprovalRemark(e.target.value)}
            placeholder="Explain what needs to be revised or why this is being denied…"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none mb-5"
            rows="4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowDisapprovalModal(false)}
              className="flex-1 py-2 text-sm border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDisapprove}
              disabled={isSubmitting || disapprovalRemark.trim().length < 5}
              className="flex-1 py-2 text-sm bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Processing…' : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}

      {/* ─── File preview modal ──────────────────────────────────────── */}
      {preview.show && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setPreview({ show: false })}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-sm text-slate-900">{preview.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={route('apply_restruct.download_file') + `?path=${encodeURIComponent(preview.raw)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => setPreview({ show: false })}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              {preview.type === 'image' ? (
                <img src={preview.url} alt={preview.label} className="max-w-full mx-auto rounded-lg" />
              ) : (
                <iframe src={preview.url} className="w-full h-[70vh] rounded-lg border border-slate-200" title={preview.label} />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Mini stat card ──────────────────────────────────────────────────────────
function MiniStat({ label, value, color, active, onClick }) {
  const variants = {
    amber:   { ring: 'ring-amber-300',   num: 'text-amber-700',   dot: 'bg-amber-400' },
    emerald: { ring: 'ring-emerald-300', num: 'text-emerald-700', dot: 'bg-emerald-500' },
    rose:    { ring: 'ring-rose-300',    num: 'text-rose-700',    dot: 'bg-rose-500' },
    blue:    { ring: 'ring-blue-300',    num: 'text-blue-700',    dot: 'bg-blue-500' },
    slate:   { ring: 'ring-slate-300',   num: 'text-slate-700',   dot: 'bg-slate-400' },
  };
  const v = variants[color] || variants.slate;

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-all hover:shadow-sm ${active ? `ring-2 ${v.ring}` : ''} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`w-2 h-2 rounded-full ${v.dot}`} />
        <span className={`text-2xl font-bold ${v.num}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-slate-600">{label}</p>
    </button>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 text-center py-14">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 font-medium">{message}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
