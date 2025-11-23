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
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
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
      )}
    </div>
  );
}