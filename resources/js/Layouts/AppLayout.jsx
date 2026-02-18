// layouts/AppLayout.jsx
import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { Head } from "@inertiajs/react";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { GlobalDarkModeStyles } from "../components/GlobalDarkModeStyles"; // ADD THIS LINE

function LayoutShell({ children, title }) {
  const { darkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode
        ? 'bg-slate-800'
        : 'bg-gradient-to-br from-slate-100 to-blue-400'
    }`}>
      <Head title={title} />
      
      {/* ADD THIS LINE */}
      <GlobalDarkModeStyles />

      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex flex-col flex-1 w-full">
          <Header
            sidebarOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className={`flex-1 p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto transition-colors duration-300 ${
            darkMode ? 'text-slate-100' : 'text-gray-900'
          }`}>
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children, title = "Dashboard" }) {
  return (
    <ThemeProvider>
      <LayoutShell title={title}>{children}</LayoutShell>
    </ThemeProvider>
  );
}