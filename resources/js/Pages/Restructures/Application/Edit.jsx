import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import {
  ChevronLeft, Upload, Loader2, AlertCircle, CheckCircle,
  FileText, Trash2, Eye, Download, ClipboardList, Building2, X,
  FolderOpen, ChevronDown, Check, Search,
} from 'lucide-react';

/* ── Searchable project dropdown — same as Create page ── */
function ProjectSelect({ projects, value, onChange }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);
  const searchRef         = useRef(null);
  const selected          = projects.find(p => String(p.project_id) === String(value));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else      setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? projects.filter(p => p.project_title.toLowerCase().includes(q)) : projects;
  }, [projects, query]);

  return (
    <div ref={ref} className="relative flex-1">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-slate-400"
      >
        <span className={`flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected ? selected.project_title : '— Select a project —'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search project title…"
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-56 overflow-y-auto">
            <li>
              <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs text-slate-400 hover:bg-slate-50 transition-colors">
                — Select a project —
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-400">No projects match "{query}"</li>
            ) : filtered.map((p) => {
              const isSelected = String(p.project_id) === String(value);
              return (
                <li key={p.project_id}>
                  <button type="button"
                    onClick={() => { onChange(String(p.project_id)); setOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-start gap-2
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'invisible'}`} />
                    <span className={`leading-snug ${isSelected ? 'text-blue-700 font-medium' : 'text-slate-800'}`}>
                      {p.project_title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              {filtered.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const DOCUMENT_FIELDS = [
  { field: 'proponent', label: 'Proponent Letter', color: { icon: 'bg-blue-100 text-blue-600',     btn: 'bg-blue-500 hover:bg-blue-600'     } },
  { field: 'psto',      label: 'PD Letter',        color: { icon: 'bg-green-100 text-green-600',   btn: 'bg-green-500 hover:bg-green-600'   } },
  { field: 'annexc',    label: 'Annex C',           color: { icon: 'bg-purple-100 text-purple-600', btn: 'bg-purple-500 hover:bg-purple-600' } },
  { field: 'annexd',    label: 'Annex D',           color: { icon: 'bg-orange-100 text-orange-600', btn: 'bg-orange-500 hover:bg-orange-600' } },
];

const ALLOWED_MIME  = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXT   = ['pdf', 'png', 'jpg', 'jpeg'];

export default function ApplyRestructEdit({ applyRestruct, projects }) {
  const { props }                         = usePage();
  const [loadingField, setLoadingField]   = useState(null);
  const [pickedFiles,  setPickedFiles]    = useState({});   // field → File object
  const [fileErrors,   setFileErrors]     = useState({});
  const [previewUrl,   setPreviewUrl]     = useState(null);
  const [previewType,  setPreviewType]    = useState(null);
  const [deleteModal,  setDeleteModal]    = useState({ show: false, field: null });
  const [projectId,    setProjectId]      = useState(String(applyRestruct.project_id));
  const [saving,       setSaving]         = useState(false);

  /* ─── current record from Inertia (refreshes after each upload/delete) ─── */
  const record = props.applyRestruct ?? applyRestruct;

  /* ─── file validation ─── */
  const validateFile = (field, file) => {
    const ext   = file.name.split('.').pop().toLowerCase();
    const valid = ALLOWED_MIME.includes(file.type) || ALLOWED_EXT.includes(ext);
    if (!valid) {
      setFileErrors(p => ({ ...p, [field]: `Invalid format. Only PDF, PNG, JPG, JPEG allowed.` }));
      return false;
    }
    setFileErrors(p => ({ ...p, [field]: null }));
    return true;
  };

  const handleFileChange = (field, file) => {
    if (!file) { setPickedFiles(p => ({ ...p, [field]: null })); return; }
    if (validateFile(field, file)) setPickedFiles(p => ({ ...p, [field]: file }));
  };

  /* ─── upload ─── */
  const upload = (field) => {
    const file = pickedFiles[field];
    if (!file) return;

    setLoadingField(field);
    const fd = new FormData();
    fd.append(field,      file);
    fd.append('apply_id', record.apply_id);

    router.post(route('apply_restruct.upload_file', field), fd, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setPickedFiles(p => ({ ...p, [field]: null }));
        setLoadingField(null);
      },
      onError: () => setLoadingField(null),
    });
  };

  /* ─── delete ─── */
  const confirmDelete = () => {
    const field = deleteModal.field;
    setLoadingField(field);
    router.delete(route('apply_restruct.delete_file', field), {
      data: { apply_id: record.apply_id },
      preserveScroll: true,
      onSuccess: () => {
        setLoadingField(null);
        setDeleteModal({ show: false, field: null });
      },
      onError: () => setLoadingField(null),
    });
  };

  /* ─── preview ─── */
  const previewFile = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    setPreviewType(['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : 'pdf');
    setPreviewUrl(route('apply_restruct.view_file') + `?path=${encodeURIComponent(path)}`);
  };

  /* ─── save project change only (no redirect) ─── */
  const handleSave = () => {
    setSaving(true);
    router.put(route('apply_restruct.update', record.apply_id), {
      project_id: projectId,
      submit: false,
    }, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
    });
  };

  /* ─── final submit: sends emails + redirects to index ─── */
  const handleSubmit = () => {
    setSaving(true);
    router.put(route('apply_restruct.update', record.apply_id), {
      project_id: projectId,
      submit: true,
    }, {
      onFinish: () => setSaving(false),
    });
  };

  const allUploaded = DOCUMENT_FIELDS.every(({ field }) => !!record[field]);

  return (
    <div className="min-h-screen">
      <Head title="Edit Restructuring Application" />

      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">

        {/* Flash messages */}
        {props.flash?.success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">{props.flash.success}</p>
          </div>
        )}
        {props.flash?.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{props.flash.error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 md:mb-8">
         <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mb-4 group">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Applications
          </button>
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Application #{record.apply_id}
              </h1>
              <p className="text-xs md:text-sm mt-1">Upload or replace documents below</p>
            </div>
          </div>
        </div>

        {/* Project selector */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200/60 p-4 md:p-6 mb-4 md:mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Project</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <ProjectSelect
              projects={projects}
              value={projectId}
              onChange={(val) => setProjectId(val)}
            />
            <button
              onClick={handleSave}
              disabled={saving || !projectId || String(projectId) === String(record.project_id)}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Project'}
            </button>
          </div>
        </div>

        {/* Document upload cards */}
        <div className="space-y-3 md:space-y-4 mb-6">
          {DOCUMENT_FIELDS.map(({ field, label, color }) => {
            const isLoading  = loadingField === field;
            const uploadedPath = record[field];
            const hasFile    = !!uploadedPath;
            const pickedFile = pickedFiles[field];
            const fileError  = fileErrors[field];

            return (
              <div key={field} className="bg-white rounded-xl shadow-md border border-slate-200/60 p-4 md:p-5">
                {/* Card header */}
                <div className="flex items-center gap-2 md:gap-3 mb-3">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${color.icon}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
                    <p className="text-xs text-slate-400">PDF, PNG, JPG, JPEG — max 10 MB</p>
                  </div>
                  {hasFile
                    ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    : <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                </div>

                {/* Already uploaded */}
                {hasFile && (
                  <>
                    <div className="flex items-center gap-2 p-2 md:p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-green-700 font-medium flex-1 truncate">
                        {uploadedPath.split('/').pop()}
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => previewFile(uploadedPath)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <a href={route('apply_restruct.download_file') + `?path=${encodeURIComponent(uploadedPath)}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                          <Download className="w-3 h-3" /> Save
                        </a>
                        <button
                          onClick={() => setDeleteModal({ show: true, field })}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50">
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3">
                      Delete the existing file to upload a replacement.
                    </p>
                  </>
                )}

                {/* File picker + upload button */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileChange(field, e.target.files[0])}
                    disabled={hasFile || isLoading}
                    className={`flex-1 text-xs text-slate-500
                      file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                      file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700
                      hover:file:bg-slate-200 disabled:opacity-50
                      ${fileError ? 'ring-2 ring-red-400 rounded-lg' : ''}`}
                  />
                  <button
                    onClick={() => upload(field)}
                    disabled={!pickedFile || hasFile || isLoading || !!fileError}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${color.btn}`}
                  >
                    {isLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                      : <><Upload className="w-3.5 h-3.5" /> Upload</>}
                  </button>
                </div>

                {fileError && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-red-700">{fileError}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress summary */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200/60 p-4 md:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Document Status</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DOCUMENT_FIELDS.map(({ field, label }) => {
              const done = !!record[field];
              return (
                <div key={field} className={`p-2 rounded-lg border text-center ${done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  {done
                    ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    : <div className="w-5 h-5 rounded-full border-2 border-slate-300 mx-auto mb-1" />}
                  <p className={`text-xs font-medium ${done ? 'text-green-700' : 'text-slate-500'}`}>{label}</p>
                </div>
              );
            })}
          </div>
          {allUploaded && (
            <p className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              All documents uploaded — application is complete.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {allUploaded && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium text-sm rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : <><CheckCircle className="w-4 h-4" /> Submit Application</>}
            </button>
          )}
        </div>

      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full p-4 md:p-6 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            <div className="mt-6">
              {previewType === 'image'
                ? <img src={previewUrl} alt="Preview" className="w-full max-h-[70vh] object-contain rounded-lg" />
                : <iframe src={previewUrl} className="w-full h-[70vh] border rounded-lg" title="Preview" />}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete File</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Delete the <strong>{DOCUMENT_FIELDS.find(d => d.field === deleteModal.field)?.label}</strong> file? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal({ show: false, field: null })}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}