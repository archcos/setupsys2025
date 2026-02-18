// components/Footer.jsx
import { Mail, Phone } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useTheme } from "../contexts/ThemeContext";

export default function Footer() {
  const { darkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`py-6 md:py-8 px-4 md:px-6 transition-colors duration-300 ${
      darkMode
        ? 'bg-slate-950 text-slate-300 border-t border-slate-700'
        : 'bg-gray-800 text-white'
    }`}>
      <div className="max-w-6xl mx-auto">

        {/* Mobile: Stacked Layout */}
        <div className={`md:hidden space-y-4 text-center text-sm ${
          darkMode ? 'text-slate-400' : 'text-gray-300'
        }`}>
          <div>
            <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-white'}`}>
              DOST Northern Mindanao
            </p>
            <p className="text-xs">Small Enterprise Technology Upgrading Program</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1">
              <Phone className="w-4 h-4" />
              <a href="tel:+63888561889" className={`hover:${darkMode ? 'text-slate-100' : 'text-white'}`}>
                +63 88 856-1889
              </a>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Mail className="w-4 h-4" />
              <a href="mailto:setup@region10.dost.gov.ph" className={`hover:${darkMode ? 'text-slate-100' : 'text-white'}`}>
                setup@region10.dost.gov.ph
              </a>
            </div>
          </div>

          <div className={`space-y-2 text-xs border-t pt-3 ${
            darkMode ? 'border-slate-700' : 'border-gray-700'
          }`}>
            <div>
              <a
                href="/contact"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 justify-center transition ${
                  darkMode ? 'hover:text-slate-100' : 'hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" /> Contact Us
              </a>
            </div>
            <div>
              <Link href="/about" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
                About SETUP
              </Link>
            </div>
            <div>
              <Link href="/privacy" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
                Privacy
              </Link>
              <span className={darkMode ? 'text-slate-600' : 'text-gray-500'}> | </span>
              <Link href="/terms" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
                Terms
              </Link>
            </div>
            <div className={darkMode ? 'text-slate-500' : 'text-gray-400'}>© {currentYear}</div>
          </div>
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className={`hidden md:flex items-center justify-between gap-6 text-sm flex-wrap lg:flex-nowrap ${
          darkMode ? 'text-slate-400' : 'text-gray-300'
        }`}>
          <div className="text-left">
            <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-white'}`}>
              DOST Northern Mindanao
            </p>
            <p>Small Enterprise Technology Upgrading Program</p>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <a href="tel:+63888561889" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
                +63 88 856-1889
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <a href="mailto:setup@region10.dost.gov.ph" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
                setup@region10.dost.gov.ph
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 text-right">
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}
            >
              <Mail className="w-4 h-4" /> Contact Us
            </a>
            <Link href="/about" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
              About SETUP
            </Link>
            <div>
              <Link href="/privacy" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
                Privacy
              </Link>
              <span className={darkMode ? 'text-slate-600' : 'text-gray-500'}> | </span>
              <Link href="/terms" className={`transition ${darkMode ? 'hover:text-slate-100' : 'hover:text-white'}`}>
                Terms
              </Link>
            </div>
            <span className={darkMode ? 'text-slate-500' : 'text-gray-400'}>© {currentYear}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}