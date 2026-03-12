import React, { useEffect, useState } from 'react';
import { useForm, usePage, router, Head, Link } from '@inertiajs/react';
import { CheckCircle, Circle, Loader2, Eye, Download, X, Plus, Pencil, ChevronLeft, FileText, Package, ClipboardList, Building2, Target, Activity, Upload, Trash2, Calendar, BarChart3, Sparkles, PhilippinePeso, AlertCircle, User, Clock } from 'lucide-react';

const fieldLabels = { tarp: 'Tarpaulin', pdc: 'Post-Dated Check', liquidation: 'Liquidation Report' };
const fieldIcons  = { tarp: FileText, pdc: ClipboardList, liquidation: BarChart3 };

export default function Checklist({ implementation, approvedItems }) {
  const { data, setData, reset } = useForm({
    tarp: null, pdc: null, liquidation: null,
    tag_name: '', tag_amount: '', tag_created_at: '', selected_item_id: '',
  });

  const { props: page } = usePage();
  const [loadingField,      setLoadingField]      = useState(null);
  const [previewUrl,        setPreviewUrl]         = useState(null);
  const [previewType,       setPreviewType]        = useState(null);
  const [editingTag,        setEditingTag]         = useState(null);
  const [editedTag,         setEditedTag]          = useState({ name: '', amount: '', created_at: '' });
  const [deleteModal,       setDeleteModal]        = useState({ show: false, field: null, uploadTime: null });
  const [showAddTagModal,   setShowAddTagModal]    = useState(false);
  const [showDeleteTagModal,setShowDeleteTagModal] = useState(false);
  const [showEditTagModal,  setShowEditTagModal]   = useState(false);
  const [tagToDelete,       setTagToDelete]        = useState(null);
  const [tagError,          setTagError]           = useState(null);

  const isRPMO = page.auth?.user?.role === 'rpmo';

  const formatTagDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
  };
  const formatDateForInput  = (d) => d ? new Date(d).toISOString().slice(0,16) : '';
  const formatDateForLaravel = (d) => d ? d.replace('T',' ') : null;
  const getCurrentDateTime  = ()  => new Date().toISOString().slice(0,16);

  const handleItemSelect = (e) => {
    const id = e.target.value;
    if (id) {
      const item = approvedItems.find(i => i.item_id == id);
      if (item) setData({ ...data, selected_item_id: id, tag_name: item.item_name, tag_amount: item.item_cost });
    } else {
      setData({ ...data, selected_item_id: '', tag_name: '', tag_amount: '' });
    }
  };

  const upload = (field) => {
    if (implementation[field]) return;
    setLoadingField(field);
    const fd = new FormData();
    fd.append(field, data[field]);
    fd.append('implement_id', implementation.implement_id);
    router.post(`/implementation/upload/${field}`, fd, {
      forceFormData: true, preserveScroll: true,
      onFinish: () => { setLoadingField(null); reset(field); },
    });
  };

  const deleteFile   = (field) => setDeleteModal({ show: true, field, uploadTime: implementation[`${field}_upload`] });
  const cancelDelete = ()      => setDeleteModal({ show: false, field: null, uploadTime: null });
  const confirmDelete = () => {
    const field = deleteModal.field;
    setLoadingField(field);
    router.delete(`/implementation/delete/${field}`, {
      data: { implement_id: implementation.implement_id }, preserveScroll: true,
      onFinish: () => { setLoadingField(null); setDeleteModal({ show: false, field: null, uploadTime: null }); },
    });
  };

  const handleAddTagClick = () => {
    setTagError(null);
    setData({ ...data, tag_created_at: getCurrentDateTime() });
    setShowAddTagModal(true);
  };

  const addTag = () => {
    setTagError(null);
    if (!data.tag_name.trim() || !data.tag_amount.toString().trim()) { setTagError('Please fill in all fields'); return; }
    const payload = {
      implement_id: implementation.implement_id,
      tag_name: data.tag_name,
      tag_amount: parseFloat(data.tag_amount),
      ...(data.tag_created_at && { created_at: formatDateForLaravel(data.tag_created_at) }),
    };
    router.post('/tags', payload, {
      preserveScroll: true,
      onSuccess: () => { setData({ ...data, tag_name:'', tag_amount:'', tag_created_at:'', selected_item_id:'' }); setShowAddTagModal(false); router.reload({ preserveScroll: true }); },
      onError: (errors) => setTagError(errors.tag_amount || errors.created_at || 'Failed to add tag. Please try again.'),
    });
  };

  const handleDeleteTagClick = (id) => { setTagToDelete(id); setShowDeleteTagModal(true); };
  const confirmDeleteTag = () => {
    if (!tagToDelete) return;
    router.delete(`/tags/${tagToDelete}`, {
      preserveScroll: true,
      onSuccess: () => { setShowDeleteTagModal(false); setTagToDelete(null); },
    });
  };

  const startEditTag = (tag) => {
    setEditingTag(tag.tag_id);
    setEditedTag({ name: tag.tag_name, amount: tag.tag_amount, created_at: formatDateForInput(tag.created_at) });
    setShowEditTagModal(true);
    setTagError(null);
  };

  const saveEditTag = (tagId) => {
    setTagError(null);
    if (!editedTag.name.trim() || !editedTag.amount.toString().trim()) { setTagError('Please fill in all fields'); return; }
    const payload = {
      tag_name: editedTag.name,
      tag_amount: parseFloat(editedTag.amount),
      ...(editedTag.created_at && { created_at: formatDateForLaravel(editedTag.created_at) }),
    };
    router.put(`/tags/${tagId}`, payload, {
      preserveScroll: true,
      onSuccess: () => { setEditingTag(null); setShowEditTagModal(false); setTagError(null); },
      onError: (errors) => setTagError(errors.tag_amount || errors.created_at || 'Failed to update tag. Please try again.'),
    });
  };

  const cancelEditTag = () => { setEditingTag(null); setShowEditTagModal(false); setTagError(null); };

  const renderStatus = (value) =>
    value
      ? <CheckCircle className="text-green-500 w-5 h-5 md:w-6 md:h-6" />
      : <Circle      className="text-gray-400  w-5 h-5 md:w-6 md:h-6" />;

  const previewFile = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    setPreviewType(['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : ext === 'pdf' ? 'pdf' : 'other');
    setPreviewUrl(`/implementation/view/document?url=${encodeURIComponent(url)}`);
  };

  const FileUploadInfo = ({ implementation, field }) => {
    const by   = implementation[`${field}UploadedBy`];
    const date = implementation[`${field}_upload`];
    if (!by || !date) return null;
    return (
      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 flex-wrap">
        <User className="w-3 h-3" />
        <span>Uploaded by <strong>{by.name || by.username}</strong></span>
        <span className="text-gray-400">•</span>
        <span>{new Date(date).toLocaleString()}</span>
      </div>
    );
  };

  useEffect(() => {
    if (page.errors?.tag_amount) setTagError(page.errors.tag_amount);
  }, [page.errors]);

  const totalAmount        = implementation.tags?.reduce((s, t) => s + parseFloat(t.tag_amount || 0), 0) ?? 0;
  const projectCost        = parseFloat(implementation.project?.project_cost || 0);
  const percentage         = projectCost > 0 ? (totalAmount / projectCost) * 100 : 0;
  const canUploadLiquidation = percentage >= 100;

  /* ── reusable input class ── */
  const inputCls = "w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all";

  const renderFileUploadSection = (field) => {
    const fileExists = !!implementation[field];
    const isLoading  = loadingField === field;
    const Icon       = fieldIcons[field];

    return (
      <div key={field} className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">{fieldLabels[field]}</h3>
            <FileUploadInfo implementation={implementation} field={field} />
            <p className="text-xs md:text-sm text-red-600">Supported formats: pdf, png, jpg, jpeg</p>
          </div>
          <div className="flex-shrink-0">{renderStatus(fileExists)}</div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {fileExists && (
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
              <span className="text-xs md:text-sm text-green-700 font-medium flex-1">File uploaded</span>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => previewFile(implementation[field])}
                  className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  <Eye className="w-3 h-3 md:w-4 md:h-4" /> View
                </button>
                <a href={`/implementation/download/${field}?url=${encodeURIComponent(implementation[field])}`}
                  className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  <Download className="w-3 h-3 md:w-4 md:h-4" /> DL
                </a>
                <button onClick={() => deleteFile(field)} disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" /> : <Trash2 className="w-3 h-3 md:w-4 md:h-4" />}
                </button>
              </div>
            </div>
          )}

          {fileExists && (
            <div className="p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs md:text-sm text-yellow-700">
              Delete existing file to upload a new one.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <input type="file" onChange={(e) => setData(field, e.target.files[0])} disabled={fileExists}
              className="flex-1 text-xs md:text-sm text-gray-500 file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <button onClick={() => upload(field)} disabled={!data[field] || fileExists || isLoading}
              className="inline-flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 py-2 bg-blue-500 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0">
              {isLoading
                ? <><Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" /><span>Uploading...</span></>
                : <><Upload className="w-3 h-3 md:w-4 md:h-4" /><span>Upload</span></>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head title="Implementation Checklist" />

      <div className="p-3 md:p-6 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-4 md:mb-8">
            <Link href="/implementation"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mb-2 md:mb-4 group">
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Implementation
            </Link>
            <div className="flex items-start gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
                <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">Implementation Checklist</h1>
                <p className="text-xs md:text-base text-gray-600 mt-1">Track project deliverables and requirements</p>
              </div>
            </div>
          </div>

          {/* ── Project Information ── */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100 mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Building2 className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Project Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500">Company</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{implementation.company_name}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500">Project</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2">{implementation.project_title}</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center p-4 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg md:rounded-xl border border-green-200 w-full">
                  <PhilippinePeso className="w-6 h-6 md:w-8 md:h-8 text-green-600 mx-auto mb-2" />
                  <label className="text-xs md:text-sm font-medium text-gray-500 block">Project Cost</label>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    ₱{projectCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── File Upload Sections ── */}
          <div className="space-y-3 md:space-y-6 mb-4 md:mb-8">
            {['tarp', 'pdc'].map((f) => renderFileUploadSection(f))}
          </div>

          {/* ── Equipment Tagging ── */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100 mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Equipment Tagging</h2>
            </div>

            {isRPMO && (
              <div className="mb-4 md:mb-6">
                <button onClick={handleAddTagClick}
                  className="inline-flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Add Equipment Tag</span>
                </button>
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-gray-700">Project Completion</span>
                <span className="text-xs md:text-sm font-bold text-purple-600">{percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(percentage, 100)}%` }} />
              </div>
              <div className="flex items-center gap-1 md:gap-2 mt-2">
                <Target className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />
                <span className="text-xs md:text-sm text-gray-600">
                  Tag Total: <strong>₱{totalAmount?.toLocaleString()}</strong> / ₱{projectCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tags list */}
            <div className="space-y-2 md:space-y-3">
              {implementation.tags?.length > 0 ? implementation.tags.map((tag) => (
                <div key={tag.tag_id}
                  className="flex flex-col gap-1.5 md:gap-2 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-50/30 rounded-lg md:rounded-xl border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs md:text-sm font-medium text-gray-900">{tag.tag_name}</span>
                      <span className="text-purple-600 font-semibold text-xs md:text-sm ml-2">
                        ₱{parseFloat(tag.tag_amount).toLocaleString()}
                      </span>
                    </div>
                    {isRPMO && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => startEditTag(tag)}
                          className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                          <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <button onClick={() => handleDeleteTagClick(tag.tag_id)}
                          className="p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>Added: {formatTagDate(tag.created_at)}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <Package className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs md:text-sm">No tags added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Untagging Status ── */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100 mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Untagging Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-orange-50 to-orange-50/30 rounded-lg md:rounded-xl border border-orange-200">
                {renderStatus(implementation.first_untagged)}
                <div>
                  <h3 className="text-sm md:text-base font-medium text-gray-900">First Untagging</h3>
                  <p className="text-xs md:text-sm text-gray-500">50% Progress Milestone</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-green-50 to-green-50/30 rounded-lg md:rounded-xl border border-green-200">
                {renderStatus(implementation.final_untagged)}
                <div>
                  <h3 className="text-sm md:text-base font-medium text-gray-900">Final Untagging</h3>
                  <p className="text-xs md:text-sm text-gray-500">100% Completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Liquidation ── */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-xl font-semibold text-gray-900">Liquidation Report</h2>
                <p className="text-xs md:text-sm text-gray-600">Available when tagging reaches 100%</p>
                <p className="text-xs md:text-sm text-red-600">Supported formats: pdf, png, jpg, jpeg</p>
              </div>
              {renderStatus(implementation.liquidation)}
            </div>

            {!canUploadLiquidation && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-yellow-50 rounded-lg md:rounded-xl border border-yellow-200">
                <div className="flex items-start gap-2 md:gap-3">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-yellow-700">
                    <strong>Complete all tagging first!</strong> Liquidation upload becomes available when tagging reaches 100% of project cost.
                  </p>
                </div>
              </div>
            )}

            {implementation.liquidation && implementation.liquidation_upload && (
              <div className="mb-3 md:mb-4">
                <p className="text-xs text-gray-500">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                  Uploaded: {new Date(implementation.liquidation_upload).toLocaleDateString()}
                </p>
              </div>
            )}

            {implementation.liquidation && (
              <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-green-50 rounded-lg border border-green-200 mb-3 md:mb-4">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                <span className="text-xs md:text-sm text-green-700 font-medium flex-1">Liquidation report uploaded</span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => previewFile(implementation.liquidation)}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                    <Eye className="w-3 h-3 md:w-4 md:h-4" /> View
                  </button>
                  <a href={`/implementation/download/liquidation?url=${encodeURIComponent(implementation.liquidation)}`}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                    <Download className="w-3 h-3 md:w-4 md:h-4" /> DL
                  </a>
                  <button onClick={() => deleteFile('liquidation')} disabled={loadingField === 'liquidation'}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50">
                    {loadingField === 'liquidation' ? <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" /> : <Trash2 className="w-3 h-3 md:w-4 md:h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <input type="file" onChange={(e) => setData('liquidation', e.target.files[0])}
                disabled={implementation.liquidation || !canUploadLiquidation}
                className="flex-1 text-xs md:text-sm text-gray-500 file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              <button onClick={() => upload('liquidation')}
                disabled={!data.liquidation || implementation.liquidation || loadingField === 'liquidation' || !canUploadLiquidation}
                className="inline-flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 py-2 bg-emerald-500 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0">
                {loadingField === 'liquidation'
                  ? <><Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" /><span>Uploading...</span></>
                  : <><Upload className="w-3 h-3 md:w-4 md:h-4" /><span>Upload</span></>}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ════ Preview Modal ════ */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 md:p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-lg md:rounded-2xl max-w-2xl md:max-w-4xl w-full p-3 md:p-6 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-400 hover:text-gray-600 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-xl md:text-2xl font-bold">
              ×
            </button>
            <div className="mt-6 md:mt-8">
              {previewType === 'image' && <img src={previewUrl} alt="Preview" className="w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg" />}
              {previewType === 'pdf'   && <iframe src={previewUrl} className="w-full h-[60vh] md:h-[70vh] border rounded-lg" title="PDF Preview" />}
              {previewType === 'other' && (
                <div className="flex items-center justify-center h-40 md:h-64 text-gray-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <p className="text-sm md:text-base">No preview available for this file type.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ Delete File Modal ════ */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">Delete {fieldLabels[deleteModal.field]}</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">Are you sure you want to delete this file?</p>
                {deleteModal.uploadTime && (
                  <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                    Uploaded: {new Date(deleteModal.uploadTime).toLocaleString()}
                  </p>
                )}
                <p className="text-xs md:text-sm text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button onClick={cancelDelete} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Add Tag Modal ════ */}
      {showAddTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base md:text-xl font-bold text-gray-900">Add Equipment Tag</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Add equipment details and cost</p>
              </div>
              <button onClick={() => setShowAddTagModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {tagError && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs md:text-sm text-red-700"><AlertCircle className="w-4 h-4 inline mr-1" />{tagError}</p>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Select Approved Item (Optional)</label>
                <select value={data.selected_item_id} onChange={handleItemSelect} className={inputCls}>
                  <option value="">-- Select or enter manually --</option>
                  {approvedItems?.map((item) => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.item_name} - ₱{parseFloat(item.item_cost).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Equipment Name *</label>
                <input type="text" value={data.tag_name} onChange={(e) => setData('tag_name', e.target.value)} placeholder="Enter equipment name" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Amount (₱) *</label>
                <input type="number" value={data.tag_amount} onChange={(e) => setData('tag_amount', e.target.value)} placeholder="0.00" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Date & Time <span className="text-gray-500 font-normal">(Optional — defaults to now)</span>
                </label>
                <input type="datetime-local" value={data.tag_created_at} onChange={(e) => setData('tag_created_at', e.target.value)} className={inputCls} />
                <p className="text-xs text-gray-500 mt-1">Current: {formatTagDate(data.tag_created_at ? data.tag_created_at.replace('T',' ') : new Date().toISOString())}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs text-gray-600 space-y-1">
                <p><span className="font-semibold">Project Budget:</span> ₱{projectCost.toLocaleString()}</p>
                <p><span className="font-semibold">Tagged Amount:</span> ₱{totalAmount.toLocaleString()}</p>
                <p><span className="font-semibold">Remaining:</span> ₱{(projectCost - totalAmount).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200">
              <button onClick={() => setShowAddTagModal(false)} className="flex-1 px-4 py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Cancel</button>
              <button onClick={addTag} className="flex-1 px-4 py-2.5 md:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 font-medium text-sm transition-all shadow-md hover:shadow-lg">Add Tag</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Edit Tag Modal ════ */}
      {showEditTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">Edit Equipment Tag</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Update equipment details</p>
              </div>
              <button onClick={cancelEditTag} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {tagError && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs md:text-sm text-red-700"><AlertCircle className="w-4 h-4 inline mr-1" />{tagError}</p>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Equipment Name *</label>
                <input type="text" value={editedTag.name} onChange={(e) => setEditedTag({ ...editedTag, name: e.target.value })} placeholder="Enter equipment name" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Amount (₱) *</label>
                <input type="number" value={editedTag.amount} onChange={(e) => setEditedTag({ ...editedTag, amount: e.target.value })} placeholder="0.00" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Date & Time (Optional)</label>
                <input type="datetime-local" value={editedTag.created_at} onChange={(e) => setEditedTag({ ...editedTag, created_at: e.target.value })} className={inputCls} />
                <p className="text-xs text-gray-500 mt-1">Current: {formatTagDate(editedTag.created_at ? editedTag.created_at.replace('T',' ') : '')}</p>
              </div>
            </div>

            <div className="flex gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200">
              <button onClick={cancelEditTag} className="flex-1 px-4 py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Cancel</button>
              <button onClick={() => saveEditTag(editingTag)} className="flex-1 px-4 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium text-sm transition-all shadow-md hover:shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Delete Tag Modal ════ */}
      {showDeleteTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Delete Tag</h3>
                <p className="text-xs md:text-sm text-gray-600">Are you sure you want to delete this equipment tag? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
              <button onClick={() => { setShowDeleteTagModal(false); setTagToDelete(null); }}
                className="flex-1 px-4 py-2.5 md:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Cancel</button>
              <button onClick={confirmDeleteTag}
                className="flex-1 px-4 py-2.5 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}