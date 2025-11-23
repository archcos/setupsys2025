// components/ProfileDropdown.jsx
import { router } from "@inertiajs/react";

export default function ProfileDropdown({ dropdownOpen, onToggle, fullName, profile, auth }) {
  const handleLogout = (e) => {
    e.preventDefault();
    router.post('/logout');
  };

  const handleSettings = () => {
    router.visit(route('users.edit', auth.user.user_id));
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 focus:outline-none hover:bg-gray-200 rounded px-2 py-1 transition"
      >
        <img src={profile} alt="Profile" className="w-7 h-7 md:w-8 md:h-8 rounded-full" />
        <span className="hidden sm:inline font-medium text-gray-700 text-sm md:text-base truncate max-w-xs">
          {fullName}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
          <button
            onClick={handleSettings}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}