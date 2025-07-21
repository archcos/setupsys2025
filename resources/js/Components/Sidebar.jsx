import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import { Link, usePage } from '@inertiajs/react'; 

export default function Sidebar({ isOpen }) {
  const [dropdowns, setDropdowns] = useState({
    reports: true,
    analytics: true,
    user_company: true,
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
    <aside className="w-64 bg-blue-700 text-white p-6 transition-all duration-300">
      {/* Header with logo */}
      <Link href="/home" className="flex items-center justify-center gap-3 mb-6 hover:opacity-80">
        <img src={logo} alt="Logo" className="w-10 h-10" />
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900">SETUP</h2>
        </div>
      </Link>

      {/* Navigation */}
      
      <nav className="space-y-2">
      <Link href="/home" className="block hover:text-blue-200">Overview</Link>

        {/* Reports Dropdown */}

        {role === 'admin' &&
        <div>
          <button
            onClick={() => toggleDropdown('reports')}
            className="w-full text-left flex justify-between items-center hover:text-blue-200"
          >
            <span>MOA</span>
            <span className="text-sm">{dropdowns.reports ? '▲' : '▼'}</span>
          </button>
          {dropdowns.reports && (
            <div className="ml-4 mt-1 space-y-1">

{/* ...inside your component... */}
<Link
  href={route('docx.form')} // This points to the GET /docx route
  className="block text-sm hover:text-blue-300"
>
  Draft MOA
</Link>
              <a href="#" className="block text-sm hover:text-blue-300">MOA List</a>
              <a href="#" className="block text-sm hover:text-blue-300">Customers</a>
            </div>
          )}
        </div>}
        {role === 'admin' &&

        <div>
          <button
            onClick={() => toggleDropdown('analytics')}
            className="w-full text-left flex justify-between items-center hover:text-blue-200"
          >
            <span>Data Forms</span>
            <span className="text-sm">{dropdowns.analytics ? '▲' : '▼'}</span>
          </button>
          {dropdowns.analytics && (
            <div className="ml-4 mt-1 space-y-1">
              <Link href="/companies" className="block text-sm hover:text-blue-300">Companies</Link>
              <Link href="/projects" className="block text-sm hover:text-blue-300">Projects</Link>
              <Link href="/activities" className="block text-sm hover:text-blue-300">Activities</Link>
            </div>
          )}
        </div>}
        {role === 'user' &&
        <div>
          <button
            onClick={() => toggleDropdown('user_company')}
            className="w-full text-left flex justify-between items-center hover:text-blue-200"
          >
            <span>Add Companys</span>
            <span className="text-sm">{dropdowns.analytics ? '▲' : '▼'}</span>
          </button>
          {dropdowns.analytics && (
            <div className="ml-4 mt-1 space-y-1">
              <Link href="/companies" className="block text-sm hover:text-blue-300">Companies</Link>
              <Link href={role === 'user' ? '/project-list' : '/projects'} className="block text-sm hover:text-blue-300">Projects</Link>
              <Link href="/activities" className="block text-sm hover:text-blue-300">Activities</Link>
            </div>
          )}
        </div>}
      </nav>
    </aside>
  );
}
