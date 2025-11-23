// layouts/AppLayout.jsx
import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { Head } from "@inertiajs/react";

export default function AppLayout({ children, title = "Dashboard" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 to-blue-400">
      <Head title={title} />

      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex flex-col flex-1 w-full">
          <Header
            sidebarOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}