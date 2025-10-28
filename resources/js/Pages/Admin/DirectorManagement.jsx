import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import { Users, Search, Edit, CheckCircle, Building2, User, Mail, Award, Briefcase } from 'lucide-react';

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

  const updateDirector = (e) => {
    e.preventDefault();
    router.put(`/admin/directors/${editingDirector}`, form, {
      onSuccess: () => {
        setEditingDirector(null);
        setFlashMessage('Director updated successfully!');
      },
    });
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="Director Management" />
      <div className="max-w-7xl mx-auto">

        {/* Flash Success Message */}
        {flashMessage && (
          <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            {flashMessage}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Director Management</h1>
            <p className="text-gray-600 mt-1">Manage regional and provincial directors</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search directors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
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
                <tr key={d.director_id} className={`border-b border-gray-100 hover:bg-purple-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {d.honorific} {d.first_name} {d.middle_name} {d.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{d.title}</td>
                  <td className="px-6 py-4">
                    {d.email ? (
                      <span className="text-gray-700">{d.email}</span>
                    ) : (
                      <span className="text-gray-400 italic">No email</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700">{d.office?.office_name || 'N/A'}</span>
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
      </div>

      {/* Enhanced Edit Modal */}
      {editingDirector && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Director</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedDirector?.first_name} {selectedDirector?.last_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={updateDirector} className="p-8">
              <div className="space-y-6">
                {/* Honorific & Names Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Honorific
                      </label>
                      <input
                        type="text"
                        value={form.honorific || ''}
                        onChange={e => setForm({ ...form, honorific: e.target.value })}
                        placeholder="e.g., Dr., Engr."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.first_name || ''}
                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={form.middle_name || ''}
                        onChange={e => setForm({ ...form, middle_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.last_name || ''}
                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Title
                      </label>
                      <input
                        type="text"
                        value={form.title || ''}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g., Regional Director"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email || ''}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="director@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Office Assignment Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Office Assignment
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assigned Office
                    </label>
                    <select
                      value={form.office_id || ''}
                      onChange={e => setForm({ ...form, office_id: e.target.value || null })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">Select office</option>
                      {offices.map(o => (
                        <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingDirector(null)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}