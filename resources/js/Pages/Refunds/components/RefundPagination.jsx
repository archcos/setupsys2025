// components/RefundPagination.jsx
import React, { useCallback } from 'react';
import { router } from '@inertiajs/react';

const RefundPagination = React.memo(({ links, from, to, total, data }) => {
  const getLabel = useCallback((label) => {
    if (label === "&laquo; Previous") return "←";
    if (label === "Next &raquo;") return "→";
    return label;
  }, []);

  const handlePaginationClick = useCallback((url) => {
    if (url) {
      router.visit(url);
    }
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-50/50 to-white px-3 md:px-6 py-3 md:py-4 border-t border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
        <div className="text-xs md:text-sm text-gray-600">
          Showing {from || 1} to {to || data?.length || 0} of {total || data?.length || 0} results
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {links.map((link, index) => (
            <button
              key={index}
              disabled={!link.url}
              onClick={() => handlePaginationClick(link.url)}
              className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg border transition-all duration-200 flex-shrink-0 ${
                link.active
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent shadow-md'
                  : link.url
                  ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              {getLabel(link.label)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

RefundPagination.displayName = 'RefundPagination';

export default RefundPagination;