import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import { Link, usePage } from '@inertiajs/react';
import {
  ChevronDown,
  ChevronUp,
  Building,
  FileText,
  ClipboardList,
  List,
  Settings,
  LayoutDashboard,
  Users,
  FileSignature,
  FileSearch,
} from 'lucide-react';

export default function Sidebar({ isOpen }) {
  const [dropdowns, setDropdowns] = useState({
    development: true,
    implementation: true,
    user: true,
  });

  const toggleDropdown = (key) => {
    setDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const { auth } = usePage().props;
  const role = auth?.user?.role;

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-white text-gray-800 p-6 transition-all duration-300 h-full shadow-md">
      <Link
        href={role === 'user' ? '/dashboard' : '/home'}
        className="flex items-center justify-center gap-3 mb-8 hover:opacity-90"
      >
        <img src={logo} alt="Logo" className="w-10 h-10" />
        <h2 className="text-2xl font-bold text-gray-800">SETUP</h2>
      </Link>

      <nav className="space-y-4">
        <Link
          href={role === 'user' ? '/dashboard' : '/home'}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:shadow hover:bg-gray-100 transition"
        >
          <LayoutDashboard size={18} />
          {role === 'user' ? 'Dashboard' : 'Overview'}
        </Link>

        {role === 'admin' && (
          <Dropdown
            title="Development"
            icon={<Building size={18} />}
            isOpen={dropdowns.development}
            onToggle={() => toggleDropdown('development')}
            links={[
              { label: '1.0 Companies', href: '/companies', icon: <Users size={16} /> },
              { label: '1.1 Projects', href: '/projects', icon: <ClipboardList size={16} /> },
              { label: '1.2 Activities', href: '/activities', icon: <List size={16} /> },
              { label: '1.3 Draft MOA', href: '/draft-moa', icon: <FileSignature size={16} /> },
              { label: '1.4 MOA List', href: '/moa', icon: <FileText size={16} /> },
            ]}
          />
        )}

        {role === 'admin' && (
          <Dropdown
            title="Implementation"
            icon={<Settings size={18} />}
            isOpen={dropdowns.implementation}
            onToggle={() => toggleDropdown('implementation')}
            links={[
              { label: '2.0 Check List', href: `/implementation`, icon: <ClipboardList size={16} /> },
              { label: '2.1 Refund Monitoring', href: '/refunds', icon: <FileSearch size={16} /> },
              { label: '2.2 Implementation', href: '/activities', icon: <List size={16} /> },
            ]}
          />
        )}

        {role === 'staff' && (
          <Dropdown
            title="Development"
            icon={<Building size={18} />}
            isOpen={dropdowns.development}
            onToggle={() => toggleDropdown('development')}
            links={[
              { label: '1.0 Companies', href: '/companies', icon: <Users size={16} /> },
              { label: '1.1 Projects', href: '/projects', icon: <ClipboardList size={16} /> },
              { label: '1.2 Activities', href: '/activities', icon: <List size={16} /> },
              { label: 'MOA List', href: '/moa', icon: <FileText size={16} /> },
            ]}
          />
        )}

        {role === 'user' && (
          <Dropdown
            title="Manage Company"
            icon={<Building size={18} />}
            isOpen={dropdowns.user}
            onToggle={() => toggleDropdown('user')}
            links={[
              { label: 'Companies', href: '/companies', icon: <Users size={16} /> },
              { label: 'Projects', href: '/project-list', icon: <ClipboardList size={16} /> },
              { label: 'Activities', href: '/activities', icon: <List size={16} /> },
            ]}
          />
        )}
      </nav>
    </aside>
  );
}

// 🔽 Reusable Dropdown Component
function Dropdown({ title, icon, isOpen, onToggle, links }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center px-3 py-2 rounded-md hover:shadow hover:bg-gray-100 transition font-medium"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="ml-6 mt-2 space-y-1">
          {links.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:shadow hover:bg-gray-100 transition"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
