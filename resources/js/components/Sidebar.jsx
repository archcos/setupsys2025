// components/Sidebar.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';
import SidebarMenuItems from "./SidebarMenuItems";
import { useTheme } from "../contexts/ThemeContext";

export default function Sidebar({ isOpen, onClose }) {
  const { auth } = usePage().props;
  const role = auth?.user?.role;
  const { darkMode } = useTheme();
  const [dropdowns, setDropdowns] = useState({
    development: false,
    implementation: role === 'rd' ? true : false,
    reports: false,
    user: true,
    transaction: true,
    review: false,
    announce: false,
    adminpanel: false
  });

  const toggleDropdown = (key) => {
    setDropdowns((prev) => {
      const isCurrentlyOpen = prev[key];
      const allClosed = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
      return { ...allClosed, [key]: !isCurrentlyOpen };
    });
  };

  const getHomePage = () => {
    if (role === 'user') return '/dashboard';
    if (['irtec', 'ertec', 'rd'].includes(role)) return '/rd/dashboard';
    return '/home';
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 z-50
        w-56 sm:w-60 md:w-64 lg:w-64 xl:w-64
        shadow-md h-screen flex flex-col
        transition-transform duration-300
        text-sm sm:text-sm md:text-base
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0
        ${darkMode
          ? 'bg-slate-900 text-slate-100 border-r border-slate-700'
          : 'bg-white text-gray-800'
        }
      `}>

        {/* Fixed header section */}
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex-shrink-0">
          <button
            onClick={onClose}
            className={`xl:hidden absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded transition ${
              darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={18} className="sm:hidden" />
            <X size={20} className="hidden sm:block" />
          </button>

          <div className="mt-8 xl:mt-0">
            <Link
              href={getHomePage()}
              className="flex items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-6 md:mb-8 hover:opacity-90"
              onClick={onClose}
            >
              <img
                src={logo}
                alt="Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10"
                style={darkMode ? { filter: 'drop-shadow(0 0 2px rgb(211, 211, 211))' } : {}}
              />
              <img
                src={setupLogo}
                alt="SETUP Logo"
                className="h-7 sm:h-8 md:h-10 object-contain"
                style={darkMode ? { filter: 'drop-shadow(0 0 3px rgb(0, 0, 0))' } : {}}
              />
            </Link>
          </div>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 sm:px-4 md:px-5 lg:px-6 pb-4 sm:pb-5 md:pb-6 space-y-2 sm:space-y-3 md:space-y-4">
          <SidebarMenuItems
            role={role}
            dropdowns={dropdowns}
            toggleDropdown={toggleDropdown}
            onClose={onClose}
            getHomePage={getHomePage}
          />
        </nav>

      </aside>
    </>
  );
}