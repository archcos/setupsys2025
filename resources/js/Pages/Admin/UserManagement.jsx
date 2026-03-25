import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import {
  Users, Search, Edit, LogOut, Trash2, Eye, EyeOff,
  CheckCircle, XCircle, Shield, Building2, Loader2,
  AlertTriangle, UserCheck, RotateCcw, ChevronLeft,
  ChevronRight, X, SlidersHorizontal
} from 'lucide-react';

export default function UserManagement({ users, offices, filters, stats }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [roleFilter, setRoleFilter] = useState(filters?.role || '');
  const [officeFilter, setOfficeFilter] = useState(filters?.office_id || '');
  const [statusFilter, setStatusFilter] = useState(filters?.status || '');
  const [accessFilter, setAccessFilter] = useState(filters?.access || '');
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({ office_id: '', role: '', status: '', password: '' });
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [confirmDeletePassword, setConfirmDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [forceLogoutUserId, setForceLogoutUserId] = useState(null);
  const [confirmLogoutPassword, setConfirmLogoutPassword] = useState('');
  const [showLogoutPassword, setShowLogoutPassword] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);

  const { flash, errors } = usePage().props;
  const selectedUser = users.data.find(u => u.user_id === editingUser);
  const hasActiveFilters = search || roleFilter || officeFilter || statusFilter || accessFilter;

  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const t = setTimeout(() => setFlashMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [flash]);

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/admin/users', {
        search, role: roleFilter, office_id: officeFilter,
        status: statusFilter, access: accessFilter,
      }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search, roleFilter, officeFilter, statusFilter, accessFilter]);

  const resetFilters = () => {
    setSearch(''); setRoleFilter(''); setOfficeFilter('');
    setStatusFilter(''); setAccessFilter('');
    router.get('/admin/users', {}, { preserveState: true, replace: true });
  };

  const startEdit = (user) => {
    setEditingUser(user.user_id);
    setForm({ office_id: user.office_id, role: user.role, status: user.status, password: '' });
  };

  const updateUser = (e) => { e.preventDefault(); setShowPasswordConfirm(true); };

  const confirmAdminPassword = (e) => {
    e.preventDefault();
    setIsConfirming(true);
    router.put(`/admin/users/${editingUser}`, { ...form, admin_password: adminPassword }, {
      onSuccess: () => { setEditingUser(null); setShowPasswordConfirm(false); setAdminPassword(''); setIsConfirming(false); },
      onError: () => setIsConfirming(false),
    });
  };

  const restoreUser = (userId) => {
    if (!confirm('Restore this user?')) return;
    router.put(`/admin/users/${userId}/restore`, {}, {
      onSuccess: () => setFlashMessage('User restored successfully.'),
    });
  };

  const getRoleBadge = (role) => {
    const map = {
      admin: { label: 'Admin', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
      rpmo: { label: 'RPMO', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
      rd: { label: 'RD', cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
      head: { label: 'Head', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
      au: { label: 'Accounting', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
      staff: { label: 'Staff', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
      user: { label: 'User', cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
    };
    return map[role] || map.user;
  };

  const getInitials = (first, last) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  const avatarColors = [
    'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-indigo-100 text-indigo-700',
  ];

  const getAvatarColor = (name) => {
    const idx = (name?.charCodeAt(0) || 0) % avatarColors.length;
    return avatarColors[idx];
  };

  return (
    <main className="min-h-screen">
      <Head title="User Management" />

      {/* Toast */}
      {flashMessage && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-top-2">
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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm mt-1">Manage accounts, roles, and access control</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          {[
            { label: 'Total Users', value: stats.total, icon: Users, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: 'Active Users', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Online Now', value: stats.online, icon: Shield, color: 'text-sky-600', bg: 'bg-sky-100' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
          <div className="flex items-center gap-3 p-3 md:p-4 border-b border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or username…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilters || hasActiveFilters ? 'bg-sky-50 border-sky-200 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />}
            </button>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 md:p-4 bg-gray-50/50">
              {[
                {
                  value: roleFilter, onChange: setRoleFilter,
                  options: [['', 'All Roles'], ['rpmo', 'RPMO'], ['rd', 'Regional Director'], ['head', 'Head'], ['au', 'Accounting'], ['staff', 'Staff'], ['user', 'User']]
                },
                {
                  value: officeFilter, onChange: setOfficeFilter,
                  options: [['', 'All Offices'], ...offices.map(o => [o.office_id, o.office_name])]
                },
                {
                  value: statusFilter, onChange: setStatusFilter,
                  options: [['', 'All Status'], ['online', 'Online'], ['offline', 'Offline']]
                },
                {
                  value: accessFilter, onChange: setAccessFilter,
                  options: [['', 'All Access'], ['active', 'Login Allowed'], ['inactive', 'Login Disabled']]
                },
              ].map(({ value, onChange, options }, i) => (
                <select
                  key={i}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white outline-none transition-colors"
                >
                  {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Office</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Access</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.data.map((user, index) => {
                  const badge = getRoleBadge(user.role);
                  const avatarCls = getAvatarColor(user.first_name);
                  return (
                    <tr key={user.user_id} className={`hover:bg-gray-50/70 transition-colors ${user.deleted_at ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {(users.current_page - 1) * users.per_page + index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarCls} flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
                            {getInitials(user.first_name, user.last_name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {offices.find(o => o.office_id === user.office_id)?.office_name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" /> Allowed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
                            <XCircle className="w-3.5 h-3.5" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span className={user.is_online ? 'text-emerald-700' : 'text-gray-400'}>
                            {user.is_online ? 'Online' : 'Offline'}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {!user.deleted_at ? (
                            <>
                              <button onClick={() => startEdit(user)} title="Edit" className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => setForceLogoutUserId(user.user_id)} title="Force Logout" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                <LogOut className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteUserId(user.user_id)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => restoreUser(user.user_id)} title="Restore" className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {users.data.map((user) => {
              const badge = getRoleBadge(user.role);
              const avatarCls = getAvatarColor(user.first_name);
              return (
                <div key={user.user_id} className={`p-4 ${user.deleted_at ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full ${avatarCls} flex items-center justify-center text-xs font-semibold flex-shrink-0 relative`}>
                        {getInitials(user.first_name, user.last_name)}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${user.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!user.deleted_at ? (
                        <>
                          <button onClick={() => startEdit(user)} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setForceLogoutUserId(user.user_id)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><LogOut className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteUserId(user.user_id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <button onClick={() => restoreUser(user.user_id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><UserCheck className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${badge.cls}`}>{badge.label}</span>
                    <span className="text-xs text-gray-400">{offices.find(o => o.office_id === user.office_id)?.office_name || '—'}</span>
                    {user.status !== 'active' && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3 h-3" /> Disabled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {users.data.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">No users found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination */}
          {users.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Showing {(users.current_page - 1) * users.per_page + 1}–{Math.min(users.current_page * users.per_page, users.total)} of {users.total}
              </p>
              <div className="flex gap-1">
                {users.links.map((link, i) => {
                  if (link.label === '&laquo; Previous') return (
                    <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url, { data: { search, role: roleFilter, office_id: officeFilter, status: statusFilter, access: accessFilter }, preserveScroll: true, preserveState: true })}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  );
                  if (link.label === 'Next &raquo;') return (
                    <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url, { data: { search, role: roleFilter, office_id: officeFilter, status: statusFilter, access: accessFilter }, preserveScroll: true, preserveState: true })}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                  return (
                    <button key={i} disabled={!link.url} onClick={() => link.url && router.visit(link.url, { data: { search, role: roleFilter, office_id: officeFilter, status: statusFilter, access: accessFilter }, preserveScroll: true, preserveState: true })}
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

      {/* ── Edit Modal ── */}
      {editingUser && (
        <Modal onClose={() => setEditingUser(null)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Edit className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
              <p className="text-xs text-gray-500">{selectedUser?.first_name} {selectedUser?.last_name}</p>
            </div>
          </div>

          <form onSubmit={updateUser} className="space-y-4">
            <FormField label="Office" icon={<Building2 className="w-3.5 h-3.5" />}>
              <select value={form.office_id} onChange={e => setForm({ ...form, office_id: e.target.value })} className={selectCls}>
                {offices.map(o => <option key={o.office_id} value={o.office_id}>{o.office_name}</option>)}
              </select>
            </FormField>
            <FormField label="Role" icon={<Shield className="w-3.5 h-3.5" />}>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={selectCls}>
                <option value="head">Head / Admin</option>
                <option value="rd">Regional Director</option>
                <option value="rpmo">RPMO Staff</option>
                <option value="au">Accounting Staff</option>
                <option value="staff">Staff</option>
                <option value="user">User</option>
              </select>
            </FormField>
            <FormField label="Login Access" icon={<UserCheck className="w-3.5 h-3.5" />}>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={selectCls}>
                <option value="active">Allow Login</option>
                <option value="inactive">Disable Login</option>
              </select>
            </FormField>
            <FormField label="New Password (optional)">
              <PasswordInput value={form.password} onChange={v => setForm({ ...form, password: v })} show={showPassword} toggle={() => setShowPassword(!showPassword)} placeholder="Leave blank to keep current" />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className={cancelBtn}>Cancel</button>
              <button type="submit" className={primaryBtn}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Admin Password Confirm ── */}
      {showPasswordConfirm && (
        <Modal onClose={() => { setShowPasswordConfirm(false); setAdminPassword(''); }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Confirm Identity</h2>
              <p className="text-xs text-gray-500">Enter your admin password to save changes</p>
            </div>
          </div>
          <form onSubmit={confirmAdminPassword} className="space-y-4">
            <PasswordInput value={adminPassword} onChange={setAdminPassword} show={showAdminPassword} toggle={() => setShowAdminPassword(!showAdminPassword)} placeholder="Your admin password" required />
            {errors?.admin_password && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{errors.admin_password}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowPasswordConfirm(false); setAdminPassword(''); }} disabled={isConfirming} className={cancelBtn}>Cancel</button>
              <button type="submit" disabled={isConfirming} className={`${primaryBtn} min-w-[90px]`}>
                {isConfirming ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteUserId && (
        <Modal onClose={() => { setDeleteUserId(null); setConfirmDeletePassword(''); }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Delete User</h2>
              <p className="text-xs text-gray-500">This will soft-delete the account</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-5 bg-red-50 border border-red-100 rounded-lg p-3">
            The user will be deactivated and their sessions terminated. You can restore them later.
          </p>
          <form onSubmit={e => { e.preventDefault(); router.post(`/admin/users/${deleteUserId}/delete`, { admin_password: confirmDeletePassword }, { onSuccess: () => { setDeleteUserId(null); setConfirmDeletePassword(''); }, onError: () => {} }); }} className="space-y-4">
            <PasswordInput value={confirmDeletePassword} onChange={setConfirmDeletePassword} show={showDeletePassword} toggle={() => setShowDeletePassword(!showDeletePassword)} placeholder="Your admin password" required />
            {errors?.admin_password && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{errors.admin_password}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setDeleteUserId(null); setConfirmDeletePassword(''); }} className={cancelBtn}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">Delete User</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Force Logout Modal ── */}
      {forceLogoutUserId && (
        <Modal onClose={() => { setForceLogoutUserId(null); setConfirmLogoutPassword(''); }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Force Logout</h2>
              <p className="text-xs text-gray-500">Terminate all active sessions for this user</p>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); router.post(`/admin/users/${forceLogoutUserId}/logout`, { admin_password: confirmLogoutPassword }, { onSuccess: () => { setForceLogoutUserId(null); setConfirmLogoutPassword(''); }, onError: () => {} }); }} className="space-y-4">
            <PasswordInput value={confirmLogoutPassword} onChange={setConfirmLogoutPassword} show={showLogoutPassword} toggle={() => setShowLogoutPassword(!showLogoutPassword)} placeholder="Your admin password" required />
            {errors?.admin_password && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{errors.admin_password}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setForceLogoutUserId(null); setConfirmLogoutPassword(''); }} className={cancelBtn}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors">Force Logout</button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}

// ── Shared styles ──
const selectCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white outline-none transition-colors";
const cancelBtn = "px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors";
const primaryBtn = "px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors";

// ── Sub-components ──
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 relative animate-in zoom-in-95 duration-150">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, show, toggle, placeholder, required }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white outline-none transition-colors"
      />
      <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}