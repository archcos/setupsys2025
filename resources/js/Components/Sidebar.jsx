import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Sidebar({ isOpen }) {
  const [dropdowns, setDropdowns] = useState({
    moa: true,
    data: true,
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
    <aside className="w-64 bg-blue-800 text-white p-6 transition-all duration-300 h-full shadow-md">
      {/* Logo + Title */}
      <Link href="/home" className="flex items-center justify-center gap-3 mb-8 hover:opacity-90">
        <img src={logo} alt="Logo" className="w-10 h-10" />
        <h2 className="text-2xl font-bold text-white">SETUP</h2>
      </Link>

      {/* Navigation */}
      <nav className="space-y-4">
        <Link href="/home" className="block hover:text-blue-300 font-medium">
          🏠 Overview
        </Link>

        {/* Admin Only: MOA Section */}
        {role === 'admin' && (
          <Dropdown
            title="📄 MOA"
            isOpen={dropdowns.moa}
            onToggle={() => toggleDropdown('moa')}
            links={[
              { label: 'Draft MOA', href: route('docx.form') },
              { label: 'MOA List', href: '/moa' },
            ]}
          />
        )}

        {/* Admin Only: Data Forms */}
        {role === 'admin' && (
          <Dropdown
            title="📊 Data Forms"
            isOpen={dropdowns.data}
            onToggle={() => toggleDropdown('data')}
            links={[
              { label: 'Companies', href: '/companies' },
              { label: 'Projects', href: '/projects' },
              { label: 'Activities', href: '/activities' },
            ]}
          />
        )}

        {/* User Only: Company Add */}
        {role === 'user' && (
          <Dropdown
            title="🏢 Manage Company"
            isOpen={dropdowns.user}
            onToggle={() => toggleDropdown('user')}
            links={[
              { label: 'Companies', href: '/companies' },
              { label: 'Projects', href: '/project-list' },
              { label: 'Activities', href: '/activities' },
            ]}
          />
        )}
      </nav>
    </aside>
  );
}

// 🔽 Reusable Dropdown Component
function Dropdown({ title, isOpen, onToggle, links }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center font-medium hover:text-blue-300"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className="ml-4 mt-2 space-y-1">
          {links.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="block text-sm hover:text-blue-200"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
