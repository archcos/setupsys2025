import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import profile from '../../assets/profile.png';

export default function Header({ sidebarOpen, toggleSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { auth } = usePage().props;

  const handleLogout = (e) => {
    e.preventDefault();
    router.post('/logout');
  };

  const fullName = auth?.user
    ? `${auth.user.first_name} ${auth.user.last_name}`
    : 'User';

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
      <button
        onClick={toggleSidebar}
        className="text-gray-600 hover:text-gray-900 focus:outline-none mr-4"
      >
        {sidebarOpen ? '☰' : '☰'}
      </button>

      <h1 className="text-xl font-semibold text-gray-800">Welcome Back</h1>

      <div className="flex items-center space-x-4 relative">
        {/* Notification Button */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            className="relative text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Notification Dot */}
            <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-600 rounded-full"></span>
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">
                Notifications
              </div>
              <ul className="text-sm text-gray-600 max-h-60 overflow-y-auto">
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">🔔 You have a new message</li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">📌 Task deadline coming up</li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">✅ Your profile was updated</li>
              </ul>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <img
              src={profile}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium text-gray-700">{fullName}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Settings
              </a>
              <a
                onClick={handleLogout}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
