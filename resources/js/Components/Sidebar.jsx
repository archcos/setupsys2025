import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import setupLogo from '../../assets/SETUP_logo.png';
import { Link, usePage } from '@inertiajs/react';
import {
  ChevronDown,
  ChevronUp,
  Building,
  FileText,
  ClipboardList,
  List,
  LayoutDashboard,
  Users,
  FileSignature,
  FileSearch,
  User,
  ShieldUser,
  Building2,
  ListTodo,
  PencilRuler,
  ChartNoAxesCombined,
  SquareKanban,
  HandCoins,
  ArrowBigLeft,
  ArrowLeftRight,
  Banknote,
  FileDiff,
  Megaphone,
  FilePlus2
} from 'lucide-react';

export default function Sidebar({ isOpen }) {
  const [dropdowns, setDropdowns] = useState({
    development: true,
    implementation: true,
    reports: true,
    user: true,
    transaction: true,
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

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-white text-gray-800 p-6 transition-all duration-300 min-h-screen shadow-md">
      <Link
        href={role === 'user' ? '/dashboard' : '/home'}
        className="flex items-center justify-center gap-3 mb-8 hover:opacity-90"
      >
        <img src={logo} alt="Logo" className="w-10 h-10" />
        <img src={setupLogo} alt="SETUP Logo" className="h-10 object-contain" />
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
            icon={<ChartNoAxesCombined size={18} />}
            isOpen={dropdowns.development}
            onToggle={() => toggleDropdown('development')}
            links={[
              { label: '1.0 Companies', href: '/companies', icon: <Building2 size={16} /> },
              { label: '1.1 Projects', href: '/projects', icon: <ClipboardList size={16} /> },
              { label: '1.2 Activities', href: '/activities', icon: <SquareKanban size={16} /> },
              { label: '1.3 Draft MOA', href: '/draft-moa', icon: <FileSignature size={16} /> },
              { label: '1.4 MOA List', href: '/moa', icon: <FileText size={16} /> },
            ]}
          />
        )}

        {role === 'admin' && (
          <Dropdown
            title="Implementation"
            icon={<PencilRuler size={18} />}
            isOpen={dropdowns.implementation}
            onToggle={() => toggleDropdown('implementation')}
            links={[
              { label: 'Phase One', href: `/implementation`, icon: <ListTodo size={16} /> },
              { label: 'Phase Two', href: '/refunds', icon: <FileSearch size={16} /> },
              // { label: 'Phase Two(CSV)', href: '/refunds', icon: <FileSearch size={16} /> },
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
              { label: 'Companies', href: '/companies', icon: <Users size={16} /> },
              { label: 'Projects', href: '/projects', icon: <ClipboardList size={16} /> },
              { label: 'Activities', href: '/activities', icon: <List size={16} /> },
              { label: 'MOA List', href: '/moa', icon: <FileText size={16} /> },
            ]}
          />
        )}

        {(role === 'staff' || role === 'admin')  && (
          <Dropdown
            title="Reports"
            icon={<Building size={18} />}
            isOpen={dropdowns.reports}
            onToggle={() => toggleDropdown('reports')}
            links={[
              { label: 'Quarterly Reports', href: '/reports', icon: <ClipboardList size={16} /> },
            ]}
          />
        )}

      <Dropdown
          title="Announcements"
          icon={<Megaphone size={18} />}
          isOpen={dropdowns.announce}
          onToggle={() => toggleDropdown('announce')}
          links={[
            ...((role === 'admin' || role === 'staff')
              ? [{ label: 'Manage Announcement', href: '/announcements', icon: <FilePlus2 size={16} /> }]
              : []),
            {
              label: 'Check Announcements',
              href: '/announcements/view',
              icon: <FilePlus2 size={16} />,
              target: '_blank', // 👈 This makes it open in a new tab
            },
          ]}
        />

        {role === 'admin' && (
          <Dropdown
            title="Admin Panel"
            icon={<ShieldUser size={18} />}
            isOpen={dropdowns.adminpanel}
            onToggle={() => toggleDropdown('adminpanel')}
            links={[
              { label: 'User Management', href: `/admin/users`, icon: <User size={16} /> },
                // { label: '2.2 Implementation', href: '/activities', icon: <List size={16} /> },
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
              { label: 'Activities', href: '/activity-list', icon: <SquareKanban size={16} /> },
            ]}
          />
        )}

        {role === 'user' && (
          <Dropdown
            title="My Transactions"
            icon={<ArrowLeftRight size={18} />}
            isOpen={dropdowns.transaction}
            onToggle={() => toggleDropdown('transaction')}
            links={[
              { label: 'Repayment History', href: '/my-refunds', icon: <HandCoins size={16} /> },
              { label: 'Quarterly Report', href: '/reports', icon: <FileDiff size={16} /> },
              // { label: 'Repayment History', href: route('refunds.history'), icon: <HandCoins size={16} /> },
            ]}
          />
        )}
      </nav>
    </aside>
  );
}

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
          {links.map((link, idx) =>
            link.target === "_blank" ? (
              <a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:shadow hover:bg-gray-100 transition"
              >
                {link.icon}
                {link.label}
              </a>
            ) : (
              <Link
                key={idx}
                href={link.href}
                className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:shadow hover:bg-gray-100 transition"
              >
                {link.icon}
                {link.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

