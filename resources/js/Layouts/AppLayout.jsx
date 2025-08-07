import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Head } from '@inertiajs/react';

export default function AppLayout({ children, title = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head title={title} />
      <div className="md:flex flex-1">
        {/* Sidebar should be inside md:flex container */}
        <Sidebar isOpen={sidebarOpen} />
        
        <div className="flex-1 flex flex-col">
          <Header sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
