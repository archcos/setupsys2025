import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Dashboard Content</h2>
            <p className="text-gray-600">Progress</p>
          </div>
        </main>
      </div>
    </div>
  );
}
