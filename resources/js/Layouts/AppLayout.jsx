import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Head } from "@inertiajs/react";

export default function AppLayout({ children, title = "Dashboard" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 to-blue-400">
      <Head title={title} />

      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="sticky top-0 self-start min-h-screen">
            <Sidebar isOpen={sidebarOpen} />
          </aside>
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          <Header
            sidebarOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Scrollable Content */}
          <main className="flex-1 p-4 sm:p-6 space-y-6">
            {children}
          </main>

          {/* Footer */}
          <footer
            className={`bg-gray-800 text-white text-center py-4 transition-all duration-300 ${
              sidebarOpen ? "md:rounded-tl-2xl" : ""
            }`}
          >
            © {new Date().getFullYear()} DOST Northern Mindanao - SETUP. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
