import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import { Users, Search, Edit, CheckCircle, Building2, User, Mail, Award, Briefcase, X, ChevronLeft, ChevronRight } from 'lucide-react';

const getInitials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

const avatarColors = [
  'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700', 'bg-indigo-100 text-indigo-700',
];
const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white outline-none transition-colors";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

export default function DirectorManagement({ directors, offices, filters }) {
  const { flash } = usePage().props;
  const [search, setSearch] = useState(filters?.search || '');
  const [editingDirector, setEditingDirector] = useState(null);
  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [form, setForm] = useState({
    first_name: '', middle_name: '', last_name: '',
    email: '', title: '', honorific: '', office_id: '',
  });

  const selectedDirector = directors.data.find(d => d.director_id === editingDirector);

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const t = setTimeout(() => setFlashMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [flash]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/admin/directors', { search }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const startEdit = (d) => {
    setEditingDirector(d.director_id);
    setForm({
      first_name: d.first_name || '', middle_name: d.middle_name || '',
      last_name: d.last_name || '', email: d.email || '',
      title: d.title || '', honorific: d.honorific || '',
      office_id: d.office_id || '',
    });
  };

  const updateDirector = () => {
    router.put(`/admin/directors/${editingDirector}`, form, {
      onSuccess: () => { setEditingDirector(null); setFlashMessage('Director updated successfully!'); },
    });
  };

  const fullName = (d) => [d.honorific, d.first_name, d.middle_name, d.last_name].filter(Boolean).join(' ');

  return (
    <main className="min-h-screen">
      <Head title="Director Management" />

      {/* Toast */}
      {flashMessage && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          {flashMessage}
          <button onClick={() => setFlashMessage(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Director Management</h1>
          <p className="text-sm mt-1">Manage regional and provincial directors</p>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search directors…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Director', 'Title', 'Email', 'Office', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-center' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {directors.data.length > 0 ? directors.data.map((d) => {
                  const avatarCls = getAvatarColor(d.first_name);
                  return (
                    <tr key={d.director_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarCls} flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
                            {getInitials(d.first_name, d.last_name)}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{fullName(d)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{d.title || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {d.email || <span className="text-gray-300 italic text-xs">No email</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {d.office?.office_name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => startEdit(d)}
                          className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Edit Director"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">No directors found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {directors.data.length > 0 ? directors.data.map((d) => {
              const avatarCls = getAvatarColor(d.first_name);
              return (
                <div key={d.director_id} className="px-4 py-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full ${avatarCls} flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5`}>
                    {getInitials(d.first_name, d.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{fullName(d)}</p>
                    {d.title && <p className="text-xs text-gray-500 mt-0.5">{d.title}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      {d.email && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{d.email}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />{d.office?.office_name || 'No office'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(d)}
                    className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No directors found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {directors.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Showing {(directors.current_page - 1) * directors.per_page + 1}–{Math.min(directors.current_page * directors.per_page, directors.total)} of {directors.total}
              </p>
              <div className="flex gap-1">
                {directors.links.map((link, i) => {
                  if (link.label === '&laquo; Previous') return (
                    <button key={i} disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url, { data: { search }, preserveScroll: true, preserveState: true })}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  );
                  if (link.label === 'Next &raquo;') return (
                    <button key={i} disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url, { data: { search }, preserveScroll: true, preserveState: true })}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                  return (
                    <button key={i} disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url, { data: { search }, preserveScroll: true, preserveState: true })}
                      className={`min-w-[2rem] h-8 px-2 text-xs rounded-lg border transition-colors ${link.active ? 'bg-gray-900 border-gray-900 text-white font-medium' : 'border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40'}`}>
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingDirector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setEditingDirector(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Edit Director</h2>
                  <p className="text-xs text-gray-500">{selectedDirector?.first_name} {selectedDirector?.last_name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDirector(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">

              {/* Personal Information */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Honorific</label>
                    <input type="text" value={form.honorific} onChange={e => setForm({ ...form, honorific: e.target.value })}
                      placeholder="e.g., Dr., Engr." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>First Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })}
                      required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Middle Name</label>
                    <input type="text" value={form.middle_name} onChange={e => setForm({ ...form, middle_name: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })}
                      required className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Professional Details */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Professional Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}><Award className="w-3 h-3 inline mr-1" />Title</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Regional Director" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}><Mail className="w-3 h-3 inline mr-1" />Email Address</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="director@example.com" className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Office Assignment */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Office Assignment</h3>
                </div>
                <div>
                  <label className={labelCls}>Assigned Office</label>
                  <select value={form.office_id} onChange={e => setForm({ ...form, office_id: e.target.value || null })}
                    className={inputCls}>
                    <option value="">Select office</option>
                    {offices.map(o => (
                      <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                    ))}
                  </select>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setEditingDirector(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateDirector}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}