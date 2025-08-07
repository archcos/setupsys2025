import { useState, useEffect } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function UserManagement({ users, offices, filters }) {
  const [isConfirming, setIsConfirming] = useState(false); // 🔹 Add at the top with other state
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // ✅ Flash success message local state
  const [flashMessage, setFlashMessage] = useState(flash?.success || null);
  const [forceLogoutUserId, setForceLogoutUserId] = useState(null);
  const [confirmLogoutPassword, setConfirmLogoutPassword] = useState('');
  const [showLogoutPassword, setShowLogoutPassword] = useState(false);

  const handleForceLogout = (userId) => {
    setForceLogoutUserId(userId);
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

 const confirmAdminPassword = (e) => {
  e.preventDefault();
  setIsConfirming(true); // ⏳ Start loading

  const formWithAdminPassword = {
    ...form,
    admin_password: adminPassword,
  };

  router.put(`/admin/users/${editingUser}`, formWithAdminPassword, {
    onSuccess: () => {
      setEditingUser(null);
      setShowPasswordConfirm(false);
      setAdminPassword('');
      setIsConfirming(false); // ✅ Reset
    },
    onError: () => {
      setIsConfirming(false); // ❌ Reset on error too
    }
  });
};

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/admin/users', { search }, { preserveState: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

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

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Head title="User Management" />
        <main className="flex-1 p-6 overflow-y-auto">

          {/* ✅ Flash Success Message */}
          {flashMessage && (
            <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded shadow z-50">
              {flashMessage}
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">User Management</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 border rounded w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto border">
                <thead className="bg-gray-200 text-left">
                  <tr>
                    <th className="px-3 py-2 w-10">Status</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2">Office</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Login</th>
                    <th className="px-3 py-2">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((user) => (
                    <tr key={user.user_id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">
                     <span
                      className={`h-3 w-3 rounded-full inline-block ${
                        user.is_online ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      title={user.is_online ? 'Online' : 'Offline'}
                    ></span>

                    </td>
                      <td className="px-3 py-2">{user.first_name} {user.last_name}</td>
                      <td className="px-3 py-2">{user.username}</td>
                      <td className="px-3 py-2">
                        {offices.find(o => o.office_id === user.office_id)?.office_name}
                      </td>
                      <td className="px-3 py-2">{user.role}</td>
                      <td className="px-3 py-2">
                        {user.status === 'active' ? 'Allowed' : 'Disabled'}
                      </td>
                      <td className="px-3 py-2 flex gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleForceLogout(user.user_id)}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                      >
                        Force Logout
                      </button>
                      <button
                        onClick={() => setDeleteUserId(user.user_id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </td>

                    </tr>
                  ))}
                </tbody>
              </table>

              {users.links.length > 1 && (
                <div className="mt-4 flex justify-end space-x-2">
                  {users.links.map((link, i) => (
                    <button
                      key={i}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                     className={`px-3 py-1 text-sm rounded border ${
                        link.active
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              )}

              {users.data.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-4">No users found.</p>
              )}
            </div>

            {/* Edit Modal */}
            {editingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h2 className="text-lg font-bold mb-2">
                    Update User Data: {selectedUser?.first_name} {selectedUser?.last_name}
                  </h2>
                  <form onSubmit={updateUser}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium">Office:</label>
                      <select
                        value={form.office_id}
                        onChange={e => setForm({ ...form, office_id: e.target.value })}
                        className="w-full border p-2 rounded"
                      >
                        {offices.map((office) => (
                          <option key={office.office_id} value={office.office_id}>
                            {office.office_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium">Role:</label>
                      <select
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        className="w-full border p-2 rounded"
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="user">User</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium">Login:</label>
                      <select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                        className="w-full border p-2 rounded"
                      >
                        <option value="active">Allow</option>
                        <option value="inactive">Disable</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium">New Password (optional):</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password || ''}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full p-2 border rounded"
                          placeholder="New Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2 text-sm text-gray-600"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Admin Password Confirm Modal */}
            {showPasswordConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded shadow max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-3">Confirm Admin Password</h3>
                  <form onSubmit={confirmAdminPassword}>
                    <div className="relative mb-4">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-2 top-2 text-sm text-gray-600"
                      >
                        {showAdminPassword ? 'Hide' : 'Show'}
                      </button>

                      {errors?.admin_password && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.admin_password}
                        </p>
                      )}
                    </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordConfirm(false);
                        setAdminPassword('');
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      disabled={isConfirming}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded text-white ${
                        isConfirming ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      disabled={isConfirming}
                    >
                      {isConfirming ? 'Verifying...' : 'Confirm'}
                    </button>
                  </div>

                  </form>
                </div>
              </div>
            )}

            {deleteUserId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white p-6 rounded shadow max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-3 text-red-600">
                  Confirm Admin Password to Delete User
                </h3>
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
                  <div className="relative mb-4">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      value={confirmDeletePassword}
                      onChange={(e) => setConfirmDeletePassword(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-2 top-2 text-sm text-gray-600"
                    >
                      {showDeletePassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteUserId(null);
                        setConfirmDeletePassword('');
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Delete User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}


            {forceLogoutUserId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white p-6 rounded shadow max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-3">Confirm Admin Password to Logout User</h3>
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
                    <div className="relative mb-4">
                      <input
                        type={showLogoutPassword ? 'text' : 'password'}
                        value={confirmLogoutPassword}
                        onChange={(e) => setConfirmLogoutPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLogoutPassword(!showLogoutPassword)}
                        className="absolute right-2 top-2 text-sm text-gray-600"
                      >
                        {showLogoutPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setForceLogoutUserId(null);
                          setConfirmLogoutPassword('');
                        }}
                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Force Logout
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
