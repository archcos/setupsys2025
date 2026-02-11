// components/Dropdown.jsx
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function Dropdown({ title, icon, isOpen, onToggle, links, onClose }) {
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