import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import {
  ChevronLeft, ClipboardList, Building2, AlertCircle,
  Loader2, ChevronDown, Check, Search, X,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
 |  ProjectSelect
 |  - Searchable by project title
 |  - Sorted A→Z by project title (server also sorts, this is a safety net)
 |  - Only shows projects for the user's office (filtered server-side)
 ══════════════════════════════════════════════════════════════ */
function ProjectSelect({ projects, value, onChange, error }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const ref               = useRef(null);
  const searchRef         = useRef(null);

  const selected = projects.find(p => String(p.project_id) === String(value));

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* auto-focus search when dropdown opens; clear on close */
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else      setQuery('');
  }, [open]);

  /* filter by query, already sorted A→Z from server */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? projects.filter(p => p.project_title.toLowerCase().includes(q))
      : projects;
  }, [projects, query]);

  return (
    <div ref={ref} className="relative">

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm border rounded-lg bg-white text-left transition-all
          ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300 hover:border-slate-400'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-56 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs text-slate-400 hover:bg-slate-50 transition-colors"
              >
                — Select a project —
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-400">
                No projects match "{query}"
              </li>
            ) : (
              filtered.map((p) => {
                const isSelected = String(p.project_id) === String(value);
                return (
                  <li key={p.project_id}>
                    <button
                      type="button"
                      onClick={() => { onChange(String(p.project_id)); setOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-start gap-2
                        ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'invisible'}`} />
                      <span className={`leading-snug ${isSelected ? 'text-blue-700 font-medium' : 'text-slate-800'}`}>
                        {p.project_title}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer count */}
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

/* ══════════════════════════════════════════════════════════════
 |  Page
 ══════════════════════════════════════════════════════════════ */
export default function ApplyRestructCreate({ projects }) {
  const { props } = usePage();
  const { data, setData, post, processing, errors } = useForm({ project_id: '' });

  const handleSubmit = () => post(route('apply_restruct.store'));

  return (
    <div className="min-h-screen">
      <Head title="Apply for Restructuring" />

      <div className="max-w-xl mx-auto p-4 md:p-6 lg:p-8">

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
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Restructuring List
          </button>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Add New Application</h1>
              <p className="text-xs md:text-sm mt-1">
                Select a project to get started — you'll upload documents on the next screen.
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200/60 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Select Project</h2>
          </div>

          <div className="mb-5">
            <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">
              Project <span className="text-red-500">*</span>
            </label>
            <ProjectSelect
              projects={projects}
              value={data.project_id}
              onChange={(val) => setData('project_id', val)}
              error={errors.project_id}
            />
            {errors.project_id && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.project_id}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-2.5 text-sm text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing || !data.project_id}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : 'Create & Upload Documents'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}