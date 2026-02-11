// components/SidebarMenuItems.jsx
import { Link } from "@inertiajs/react";
import { LayoutDashboard, Building, Users, FileSignature, FileText, ClipboardList, SquareKanban, HandCoins, ArrowLeftRight, FileDiff, Megaphone, Eye, AlertCircle, Settings, Zap, CheckCircle, Pencil, Search, ClipboardCheck, Award, BookOpen, FilePlus2, Hammer, ShieldAlert, AudioLines, Logs, FileCheck, FileClock, FileBadge, FileSymlink, Stamp, PencilRuler, FileCheck2 } from "lucide-react";

import Dropdown from "./Dropdown";

export default function SidebarMenuItems({ role, dropdowns, toggleDropdown, onClose, getHomePage }) {
    console.log('Current role:', role); // Check what role is being passed

  return (
    
    <>
      {/* Dashboard Link */}
      <Link
        href={getHomePage()}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:shadow hover:bg-gray-100 transition"
        onClick={onClose}
      >
        <LayoutDashboard size={18} />
        {role === 'user' ? 'Dashboard' : 
         ['rd'].includes(role) ? 'Dashboard' : 
         'Overview'}
      </Link>

      {/* Admin Panel - Head Only */}
      {role === 'head' && (
        <Dropdown
          title="Admin Panel"
          icon={<ShieldAlert size={18} />}
          isOpen={dropdowns.adminpanel}
          onToggle={() => toggleDropdown('adminpanel')}
          links={[
            { label: 'User Management', href: `/admin/users`, icon: <Users size={16} /> },
            { label: 'Director Management', href: `/admin/directors`, icon: <Settings size={16} /> },
            { label: 'Blocking Management', href: `/blocked-ips`, icon: <AlertCircle size={16} /> },
            { label: 'Login Frequency', href: `/login-frequency`, icon: <AudioLines size={16} /> },
            { label: 'Logs Management', href: `/logs`, icon: <Logs size={16} /> },
          ]}
          onClose={onClose}
        />
      )}

      {/* Development - RPMO/Staff */}
      {(role === 'rpmo' || role === 'staff') && (
        <Dropdown
          title="Development"
          icon={<Zap size={18} />}
          isOpen={dropdowns.development}
          onToggle={() => toggleDropdown('development')}
          links={[
            { label: 'Proponents', href: '/proponents', icon: <Building size={16} /> },
            { label: 'Projects', href: '/projects', icon: <ClipboardList size={16} /> },
            { label: 'Activities', href: '/activities', icon: <SquareKanban size={16} /> },
          ]}
          onClose={onClose}
        />
      )}

      {/* Review & Approval - RPMO/Staff */}
      {(role === 'rpmo' || role === 'staff') && (
        <Dropdown
          title="Review & Approval"
          icon={<CheckCircle size={18} />}
          isOpen={dropdowns.review}
          onToggle={() => toggleDropdown('review')}
          links={[
            { label: 'Draft MOA', href: '/draft-moa', icon: <FileSignature size={16} /> },
            { label: 'MOA List', href: '/moa', icon: <FileText size={16} /> },
            { label: 'Project Compliance', href: '/compliance', icon: <ClipboardCheck size={16} /> },
            { label: 'Approved Project', href: `/approved-projects`, icon: <Award size={16} /> },
          ]}
          onClose={onClose}
        />
      )}

    {/* Implementation - Staff/RPMO/RD */}
    {(role === 'staff' || role === 'rpmo' || role === 'rd' || role === 'au') && (
      <Dropdown
        title="Implementation"
        icon={<PencilRuler size={18} />}
        isOpen={role === 'rd' ? true : dropdowns.implementation}        
        onToggle={() => toggleDropdown('implementation')}
        links={[
          // Phase One & Two visible to staff and rpmo (and rd if needed)
          ...(role === 'staff' || role === 'rpmo' || role === 'au'
            ? [
                { label: 'Phase One', href: '/implementation', icon: <Hammer size={16} /> },
                { label: 'Phase Two', href: '/refunds', icon: <HandCoins size={16} /> },
              ]
            : []),

          ...(role === 'staff'
            ? [
                { label: 'Apply for Restructuring', href: '/apply-restructuring', icon: <BookOpen size={16} /> },
              ]
            : []),

          ...(role === 'rpmo' || role === 'rd'
            ? [
                { label: 'Verify Restructure', href: '/verify-restructure', icon: <Stamp size={16} /> },
              ]
            : []),
        ]}
        onClose={onClose}
      />
    )}


      {/* Reports - Staff/RPMO */}
      {(role === 'staff' || role === 'rpmo') && (
        <Dropdown
          title="Reports"
          icon={<FileSymlink size={18} />}
          isOpen={dropdowns.reports}
          onToggle={() => toggleDropdown('reports')}
          links={[
            { label: 'Quarterly Reports', href: '/reports', icon: <FileClock size={16} /> },
            { label: 'Review Reports', href: '/review-reports', icon: <FileCheck2 size={16} /> },
            // { label: 'Completion Report', href: '/completion-report', icon: <FileBadge size={16} /> },
          ]}
          onClose={onClose}
        />
      )}

      {/* Announcements - All Roles */}
      <Dropdown
        title="Announcements"
        icon={<Megaphone size={18} />}
        isOpen={dropdowns.announce}
        onToggle={() => toggleDropdown('announce')}
        links={[
          ...((role === 'rpmo' || role === 'head' || role === 'staff')
            ? [{ label: 'Manage Announcement', href: '/announcements', icon: <FilePlus2 size={16} /> }]
            : []),
          {
            label: 'Check Announcements',
            href: '/announcements/view',
            icon: <Eye size={16} />,
            target: '_blank',
          },
        ]}
        onClose={onClose}
      />

      {/* Manage Company - User Only */}
      {role === 'user' && (
        <Dropdown
          title="Manage Information"
          icon={<Building size={18} />}
          isOpen={dropdowns.user}
          onToggle={() => toggleDropdown('user')}
          links={[
            { label: 'Proponents', href: '/proponents', icon: <Building size={16} /> },
            { label: 'Projects', href: '/project-list', icon: <ClipboardList size={16} /> },
            { label: 'Activities', href: '/activity-list', icon: <SquareKanban size={16} /> },
          ]}
          onClose={onClose}
        />
      )}

      {/* My Transactions - User Only */}
      {role === 'user' && (
        <Dropdown
          title="My Transactions"
          icon={<ArrowLeftRight size={18} />}
          isOpen={dropdowns.transaction}
          onToggle={() => toggleDropdown('transaction')}
          links={[
            { label: 'Repayment Summary', href: '/my-refunds', icon: <HandCoins size={16} /> },
            { label: 'Quarterly Report', href: '/reports', icon: <FileDiff size={16} /> },
          ]}
          onClose={onClose}
        />
      )}
    </>
  );
}