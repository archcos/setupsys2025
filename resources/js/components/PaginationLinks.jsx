import { router } from '@inertiajs/react';

/**
 * Reusable pagination component that safely decodes HTML entities
 * without using dangerouslySetInnerHTML
 * 
 * Props:
 *   - links: array of pagination link objects from Inertia
 *   - from: starting record number
 *   - to: ending record number
 *   - total: total number of records
 */
export default function PaginationLinks({ links, from, to, total }) {
  if (!links || links.length <= 1) return null;

  // Safe HTML entity decoder - no XSS risk
  const decodeHTML = (html) => {
    if (!html) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  };

  return (
    <div className="bg-gray-50/50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Info Text */}
        <div className="text-xs md:text-sm text-gray-600">
          Showing {from || 1} to {to || 0} of {total || 0}
        </div>

        {/* Pagination Buttons */}
        <div className="flex gap-1 overflow-x-auto">
          {links.map((link, index) => (
            <PaginationButton
              key={index}
              link={link}
              label={decodeHTML(link.label)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual pagination button component
 */
function PaginationButton({ link, label }) {
  const isDisabled = !link.url;
  const isActive = link.active;

  const baseClasses = 'px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm rounded-lg border transition-all';
  
  let colorClasses;
  if (isActive) {
    colorClasses = 'bg-blue-500 text-white border-transparent font-semibold';
  } else if (isDisabled) {
    colorClasses = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
  } else {
    colorClasses = 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 cursor-pointer';
  }

  return (
    <button
      disabled={isDisabled}
      onClick={() => link.url && router.visit(link.url)}
      className={`${baseClasses} ${colorClasses}`}
      aria-label={`Navigate to page: ${label}`}
      title={isDisabled ? 'Disabled' : label}
    >
      {label}
    </button>
  );
}