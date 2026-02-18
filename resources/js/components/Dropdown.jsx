// components/Dropdown.jsx
import { ChevronDown } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useTheme } from "../contexts/ThemeContext";

export default function Dropdown({ title, icon, isOpen, onToggle, links, onClose }) {
  const { darkMode } = useTheme();

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex justify-between items-center px-3 py-2 rounded-md transition font-medium ${
          darkMode
            ? 'text-slate-100 hover:bg-slate-700 hover:shadow-md'
            : 'text-gray-800 hover:bg-gray-100 hover:shadow'
        }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <div className={`transform transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <ChevronDown size={16} />
        </div>
      </button>

      {/* Animated dropdown content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-6 mt-2 space-y-1">
          {links.map((link, idx) =>
            link.target === "_blank" ? (
              <a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition ${
                  darkMode
                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.icon}
                {link.label}
              </a>
            ) : (
              <Link
                key={idx}
                href={link.href}
                className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition ${
                  darkMode
                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={onClose}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}