import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Head, Link } from "@inertiajs/react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function AppLayout({ children, title = "Dashboard" }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
<footer className={`bg-gray-800 text-white py-4 px-6 transition-all duration-300 ${sidebarOpen ? "md:rounded-tl-2xl" : ""}`}>
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 text-sm text-gray-300">

    {/* Left: Organization Info */}
    <div className="text-center md:text-left">
      <p className="font-semibold text-white">DOST Northern Mindanao</p>
      <p>Small Enterprise Technology Upgrading Program</p>
    </div>

    {/* Center: Contact Info */}
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-center">
      <div className="flex items-center gap-1">
        <Phone className="w-4 h-4" /> +63 88 856-1889
      </div>
      <div className="flex items-center gap-1">
        <Mail className="w-4 h-4" /> setup@region10.dost.gov.ph
      </div>
    </div>

    {/* Right: Links */}
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-right">
      <a href="/contact" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white">
        <Mail className="w-4 h-4" /> Contact Us
      </a>
      <Link href="/about" className="hover:text-white">About SETUP</Link>
      <div className="flex items-center gap-1">
        <Link href="/privacy" className="hover:text-white">Privacy</Link>
        <span className="text-gray-500">|</span>
        <Link href="/terms" className="hover:text-white">Terms</Link>
      </div>
      <span className="text-gray-400">© {new Date().getFullYear()} </span>
    </div>
  </div>
</footer>


        </div>
      </div>
    </div>
  );
}