import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import { Users, Search, Edit, LogOut, Trash2, Eye, EyeOff, CheckCircle, XCircle, Shield, Building2, Loader2, AlertTriangle, UserCheck, Menu, X, RotateCcw } from 'lucide-react';

export default function UserManagement({ users, offices, filters, stats }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [roleFilter, setRoleFilter] = useState(filters?.role || '');
  const [officeFilter, setOfficeFilter] = useState(filters?.office_id || '');
  const [statusFilter, setStatusFilter] = useState(filters?.status || '');
  const [showFilters, setShowFilters] = useState(false);
const [accessFilter, setAccessFilter] = useState(filters?.access || '');
  const [form, setForm] = useState({
    office_id: '',
    role: '',
    status: '',
    password: ''
  });
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [confirmDeletePassword, setConfirmDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const { flash, errors } = usePage().props;
  const selectedUser = users.data.find(u => u.user_id === editingUser);

  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [forceLogoutUserId, setForceLogoutUserId] = useState(null);
  const [confirmLogoutPassword, setConfirmLogoutPassword] = useState('');
  const [showLogoutPassword, setShowLogoutPassword] = useState(false);
  const hasActiveFilters = search || roleFilter || officeFilter || statusFilter || accessFilter;

  const handleForceLogout = (userId) => {
    setForceLogoutUserId(userId);
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setOfficeFilter('');
    setStatusFilter('');
    setAccessFilter('');
    router.get('/admin/users', {}, { preserveState: true, replace: true });
  };


  useEffect(() => {
    if (flash?.success) {
      setFlashMessage(flash.success);
      const timer = setTimeout(() => {
        setFlashMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const restoreUser = (userId) => {
    if (!confirm('Are you sure you want to restore this user?')) return;

    router.put(`/admin/users/${userId}/restore`, {}, {
      onSuccess: () => {
        setFlashMessage('User restored successfully.');
      },
    });
  };

  const confirmAdminPassword = (e) => {
    e.preventDefault();
    setIsConfirming(true);

    const formWithAdminPassword = {
      ...form,
      admin_password: adminPassword,
    };

    router.put(`/admin/users/${editingUser}`, formWithAdminPassword, {
      onSuccess: () => {
        setEditingUser(null);
        setShowPasswordConfirm(false);
        setAdminPassword('');
        setIsConfirming(false);
      },
      onError: () => {
        setIsConfirming(false);
      }
    });
  };

useEffect(() => {
  const delay = setTimeout(() => {
    router.get('/admin/users', {
      search,
      role: roleFilter,
      office_id: officeFilter,
      status: statusFilter,
      access: accessFilter,
    }, { preserveState: true, replace: true });
  }, 400);
  return () => clearTimeout(delay);
}, [search, roleFilter, officeFilter, statusFilter, accessFilter]);

  const startEdit = (user) => {
    setEditingUser(user.user_id);
    setForm({
      office_id: user.office_id,
      role: user.role,
      status: user.status,
      password: ''
    });
  };

  const updateUser = (e) => {
    e.preventDefault();
    setShowPasswordConfirm(true);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      rpmo: 'bg-purple-100 text-purple-700',
      rd: 'bg-indigo-100 text-indigo-700',
      head: 'bg-blue-100 text-blue-700',
      staff: 'bg-green-100 text-green-700',
      user: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <main className="flex-1 min-h-screen">
      <Head title="User Management" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Flash Success Message */}
        {flashMessage && (
          <div className="fixed top-4 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 md:w-auto bg-gradient-to-r from-green-500 to-green-600 text-white px-4 md:px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{flashMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">User Management</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1 hidden sm:block">Manage user accounts, roles, and permissions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
          <div className="bg-white rounded-lg md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg md:rounded-xl flex-shrink-0">
                <UserCheck className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex-shrink-0">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">Online Now</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.online}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg md:rounded-xl flex-shrink-0">
                <Shield className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

{/* Search and Filters */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full flex items-center justify-between font-semibold text-gray-900 mb-4"
          >
            <span>Filters</span>
            {showFilters ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-3 md:space-y-0`}>
            <div className="md:grid md:grid-cols-5 md:gap-4 md:items-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 md:px-3 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              >
                <option value="">All Roles</option>
                <option value="rpmo">RPMO Staff</option>
                <option value="rd">Regional Director</option>
                <option value="head">Head</option>
                <option value="staff">Staff</option>
                <option value="user">User</option>
              </select>

              <select
                value={officeFilter}
                onChange={(e) => setOfficeFilter(e.target.value)}
                className="w-full px-3 md:px-3 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              >
                <option value="">All Offices</option>
                {offices.map(o => (
                  <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 md:px-3 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              >
                <option value="">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>

              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="w-full px-3 md:px-3 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              >
                <option value="">All Access</option>
                <option value="active">Allow Login</option>
                <option value="inactive">Disable Login</option>
              </select>
            </div>

            <br />
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full md:w-auto mt-3 md:mt-3 flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-red-100 hover:bg-red-200 text-red-700 font-medium text-sm rounded-lg md:rounded-xl transition-colors ml-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User Details</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Office</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role & Access</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((user, index) => (
                <tr key={user.user_id} className={`border-b border-gray-100 hover:bg-purple-50/50 transition-all ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs font-medium ${user.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                        {user.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 text-sm">{offices.find(o => o.office_id === user.office_id)?.office_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <div className="flex items-center gap-2">
                        {user.status === 'active' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {user.status === 'active' ? 'Login Allowed' : 'Login Disabled'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {!user.deleted_at ? (
                        <>
                          <button
                            onClick={() => startEdit(user)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleForceLogout(user.user_id)}
                            className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                            title="Force Logout"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteUserId(user.user_id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => restoreUser(user.user_id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Restore User"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.data.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {users.data.length > 0 ? (
            users.data.map((user) => (
              <div key={user.user_id} className="bg-white rounded-lg shadow border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p className="font-semibold text-gray-900 text-sm break-words">{user.first_name} {user.last_name}</p>
                    </div>
                    <p className="text-xs text-gray-600">@{user.username}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!user.deleted_at ? (
                      <>
                        <button
                          onClick={() => startEdit(user)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleForceLogout(user.user_id)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                          title="Logout"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteUserId(user.user_id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => restoreUser(user.user_id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="Restore"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span>{offices.find(o => o.office_id === user.office_id)?.office_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full font-medium ${getRoleColor(user.role)}`}>{user.role}</span>
                    {user.status === 'active' ? (
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {users.links.length > 1 && (
          <div className="flex justify-center md:justify-end gap-2 mt-6 flex-wrap px-4 md:px-0">
            {users.links.map((link, i) => (
              <button
                key={i}
                disabled={!link.url}
                onClick={() => {
                  if (link.url) {
                    router.visit(link.url, {
                      data: { search, role: roleFilter, office_id: officeFilter, status: statusFilter },
                      preserveScroll: true,
                      preserveState: true,
                      replace: true,
                    });
                  }
                }}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg border transition-colors ${
                  link.active
                    ? 'bg-purple-600 text-white border-purple-600'
                    : link.url 
                      ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-8 w-full max-w-md border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Edit className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Edit User</h2>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  {selectedUser?.first_name} {selectedUser?.last_name}
                </p>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Office
                </label>
                <select
                  value={form.office_id}
                  onChange={e => setForm({ ...form, office_id: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  {offices.map((office) => (
                    <option key={office.office_id} value={office.office_id}>
                      {office.office_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="admin">Admin</option>
                  <option value="rpmo">RPMO Staff</option>
                  <option value="rd">Regional Director</option>
                  <option value="head">Head</option>
                  <option value="staff">Staff</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  Login Access
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="active">Allow Login</option>
                  <option value="inactive">Disable Login</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  New Password (optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 pr-12 text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 pt-4 md:pt-6">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 font-medium text-sm md:text-base rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUser}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm md:text-base rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Confirm Modal */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 max-w-sm w-full border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Shield className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Admin Verification</h3>
                        <p className="text-sm text-gray-600">Confirm your password to continue</p>
                      </div>
                    </div>

                    <form onSubmit={confirmAdminPassword}>
                      <div className="relative mb-6">
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white pr-12"
                          placeholder="Enter your admin password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {errors?.admin_password && (
                          <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {errors.admin_password}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordConfirm(false);
                            setAdminPassword('');
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                          disabled={isConfirming}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isConfirming
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg'
                          }`}
                          disabled={isConfirming}
                        >
                          {isConfirming ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verifying...
                            </div>
                          ) : (
                            'Confirm'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {deleteUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-600">Delete User</h3>
                        <p className="text-sm text-gray-600">This action cannot be undone</p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        router.post(`/admin/users/${deleteUserId}/delete`, {
                          admin_password: confirmDeletePassword,
                        }, {
                          onSuccess: () => {
                            setDeleteUserId(null);
                            setConfirmDeletePassword('');
                          },
                          onError: () => {},
                        });
                      }}
                    >
                      <div className="relative mb-6">
                        <input
                          type={showDeletePassword ? 'text' : 'password'}
                          value={confirmDeletePassword}
                          onChange={(e) => setConfirmDeletePassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white pr-12"
                          placeholder="Enter your admin password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeletePassword(!showDeletePassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteUserId(null);
                            setConfirmDeletePassword('');
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                        >
                          Delete User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Force Logout Modal */}
              {forceLogoutUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <LogOut className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Force User Logout</h3>
                        <p className="text-sm text-gray-600">Confirm your password to proceed</p>
                      </div>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      router.post(`/admin/users/${forceLogoutUserId}/logout`, {
                        admin_password: confirmLogoutPassword,
                      }, {
                        onSuccess: () => {
                          setForceLogoutUserId(null);
                          setConfirmLogoutPassword('');
                        },
                        onError: () => {},
                      });
                    }}>
                      <div className="relative mb-6">
                        <input
                          type={showLogoutPassword ? 'text' : 'password'}
                          value={confirmLogoutPassword}
                          onChange={(e) => setConfirmLogoutPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white pr-12"
                          placeholder="Enter your admin password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLogoutPassword(!showLogoutPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showLogoutPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setForceLogoutUserId(null);
                            setConfirmLogoutPassword('');
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg"
                        >
                          Force Logout
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
          </main>
    );
  }