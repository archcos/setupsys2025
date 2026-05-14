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
    setDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getHomePage = () => {
    if (role === 'user') return '/dashboard';
    if (['irtec', 'ertec', 'rd'].includes(role)) return '/rd/dashboard';
    return '/home';
  };

  return (
    <>
      {/* Overlay — shown on all viewports when sidebar is open (below xl) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={onClose}
        />
      )}

      {/*
        Sidebar is ALWAYS fixed-positioned so it never participates in
        document flow and cannot stretch the page.

        On xl+ it is always visible (translate-x-0).
        Below xl it slides in/out based on `isOpen`.
      */}
      <aside className={`
        fixed left-0 top-0 z-50
        w-64 p-6 shadow-md
        h-screen overflow-y-auto
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0
        ${darkMode
          ? 'bg-slate-900 text-slate-100 border-r border-slate-700'
          : 'bg-white text-gray-800'
        }
      `}>

        {/* Close button — visible below xl */}
        <button
          onClick={onClose}
          className={`xl:hidden absolute top-4 right-4 p-2 rounded transition ${
            darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X size={20} />
        </button>

        <div className="mt-10 xl:mt-0">
          {/* Logo */}
          <Link
            href={getHomePage()}
            className="flex items-center justify-center gap-3 mb-8 hover:opacity-90"
            onClick={onClose}
          >
            <img
              src={logo}
              alt="Logo"
              className="w-10 h-10"
              style={darkMode ? { filter: 'drop-shadow(0 0 2px rgb(211, 211, 211))' } : {}}
            />
            <img
              src={setupLogo}
              alt="SETUP Logo"
              className="h-10 object-contain"
              style={darkMode ? { filter: 'drop-shadow(0 0 3px rgb(0, 0, 0))' } : {}}
            />
          </Link>

          {/* Navigation Menu */}
          <nav className="space-y-4">
            <SidebarMenuItems
              role={role}
              dropdowns={dropdowns}
              toggleDropdown={toggleDropdown}
              onClose={onClose}
              getHomePage={getHomePage}
            />
          </nav>
        </div>
      </aside>
    </>
  );
}