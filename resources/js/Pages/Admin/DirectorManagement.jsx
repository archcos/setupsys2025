import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import { Users, Search, Edit, CheckCircle, Building2, User, Mail, Award, Briefcase, X } from 'lucide-react';

export default function DirectorManagement({ directors, offices, filters }) {
  const { flash } = usePage().props;
  const [search, setSearch] = useState(filters?.search || '');
  const [editingDirector, setEditingDirector] = useState(null);
  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    title: '',
    honorific: '',
    office_id: '',
  });

  const selectedDirector = directors.data.find(d => d.director_id === editingDirector);

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const timer = setTimeout(() => {
        setFlashMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/admin/directors', { search }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const startEdit = (director) => {
    setEditingDirector(director.director_id);
    setForm({
      first_name: director.first_name || '',
      middle_name: director.middle_name || '',
      last_name: director.last_name || '',
      email: director.email || '',
      title: director.title || '',
      honorific: director.honorific || '',
      office_id: director.office_id || null,
    });
  };

  const updateDirector = () => {
    router.put(`/admin/directors/${editingDirector}`, form, {
      onSuccess: () => {
        setEditingDirector(null);
        setFlashMessage('Director updated successfully!');
      },
    });
  };

  return (
    <main className="flex-1 min-h-screen">
      <Head title="Director Management" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">

        {/* Flash Success Message */}
        {flashMessage && (
          <div className="fixed top-4 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 md:w-auto bg-gradient-to-r from-green-500 to-green-600 text-white px-4 md:px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{flashMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="p-2 md:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">Director Management</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1 hidden sm:block">Manage regional and provincial directors</p>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-100 p-3 md:p-6 mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search directors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Office</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {directors.data.map((d, index) => (
                <tr key={d.director_id} className={`border-b border-gray-100 hover:bg-green-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {d.honorific} {d.first_name} {d.middle_name} {d.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm">{d.title}</td>
                  <td className="px-6 py-4">
                    {d.email ? (
                      <span className="text-gray-700 text-sm">{d.email}</span>
                    ) : (
                      <span className="text-gray-400 italic text-sm">No email</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 text-sm">{d.office?.office_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => startEdit(d)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      title="Edit Director"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {directors.data.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No directors found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {directors.data.length > 0 ? (
            directors.data.map((d) => (
              <div key={d.director_id} className="bg-white rounded-lg shadow border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm break-words">
                      {d.honorific} {d.first_name} {d.middle_name} {d.last_name}
                    </p>
                    {d.title && <p className="text-xs text-gray-600 mt-1">{d.title}</p>}
                  </div>
                  <button
                    onClick={() => startEdit(d)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex-shrink-0"
                    title="Edit Director"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {d.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3 h-3 flex-shrink-0 text-gray-400" />
                      <span className="break-all">{d.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    <span>{d.office?.office_name || 'No office'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">No directors found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      {editingDirector && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 md:px-8 py-4 md:py-6 rounded-t-xl md:rounded-t-2xl sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                  <Edit className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-2xl font-bold text-white">Edit Director</h2>
                  <p className="text-blue-100 text-xs md:text-sm mt-1 truncate">
                    {selectedDirector?.first_name} {selectedDirector?.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDirector(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Honorific & Names Section */}
              <div className="bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                      Honorific
                    </label>
                    <input
                      type="text"
                      value={form.honorific || ''}
                      onChange={e => setForm({ ...form, honorific: e.target.value })}
                      placeholder="e.g., Dr., Engr."
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.first_name || ''}
                      onChange={e => setForm({ ...form, first_name: e.target.value })}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={form.middle_name || ''}
                      onChange={e => setForm({ ...form, middle_name: e.target.value })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.last_name || ''}
                      onChange={e => setForm({ ...form, last_name: e.target.value })}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  Professional Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2 flex items-center gap-2">
                      <Award className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title || ''}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Regional Director"
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2 flex items-center gap-2">
                      <Mail className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="director@example.com"
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Office Assignment Section */}
              <div className="bg-gray-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  Office Assignment
                </h3>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                    Assigned Office
                  </label>
                  <select
                    value={form.office_id || ''}
                    onChange={e => setForm({ ...form, office_id: e.target.value || null })}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Select office</option>
                    {offices.map(o => (
                      <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 pt-4 md:pt-6 mt-4 md:mt-6 border-t border-gray-200">
                <button
                  onClick={() => setEditingDirector(null)}
                  className="px-4 md:px-6 py-2 md:py-3 border-2 border-gray-300 text-gray-700 font-semibold text-sm md:text-base rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={updateDirector}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm md:text-base rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}