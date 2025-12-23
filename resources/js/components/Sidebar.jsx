// components/Sidebar.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';
import SidebarMenuItems from "./SidebarMenuItems";

export default function Sidebar({ isOpen, onClose }) {
  const [dropdowns, setDropdowns] = useState({
    development: false,
    implementation: false,
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

  const { auth } = usePage().props;
  const role = auth?.user?.role;

  const getHomePage = () => {
    if (role === 'user') return '/dashboard';
    if (['irtec', 'ertec', 'rd'].includes(role)) return '/rd-dashboard';
    return '/home';
  };

  return (
    <>
      {/* Mobile overlay - only show on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed lg:sticky lg:translate-x-0 left-0 top-0 z-50 w-64 bg-white text-gray-800 p-6 shadow-md h-screen lg:max-h-screen overflow-y-auto transition-all duration-300 lg:duration-0`}>
        
        {/* Close button for mobile and tablet */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded"
        >
          <X size={20} />
        </button>

        <div className="mt-10 lg:mt-0">
          {/* Logo */}
          <Link
            href={getHomePage()}
            className="flex items-center justify-center gap-3 mb-8 hover:opacity-90"
            onClick={onClose}
          >
            <img src={logo} alt="Logo" className="w-10 h-10" />
            <img src={setupLogo} alt="SETUP Logo" className="h-10 object-contain" />
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