import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const UnpaidMonthsWarningModal = ({
  isOpen,
  onClose,
  unpaidMonths = [],
  message = '',
  action = '',
  projectTitle = '',
  refundInitial = '',
  refundEnd = '',
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  ⚠️ Unpaid Months Found
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {/* Main Message */}
            {message && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900">
                  {message}
                </p>
              </div>
            )}

            {/* Project Info */}
            {projectTitle && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                <p className="text-xs text-gray-600 mb-1">Project</p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {projectTitle}
                </p>
              </div>
            )}

            {/* Refund Period */}
            {(refundInitial || refundEnd) && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Refund Period</p>
                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <span>{refundInitial}</span>
                  <span className="text-gray-400">→</span>
                  <span>{refundEnd}</span>
                </div>
              </div>
            )}

            {/* Unpaid Months List */}
            {unpaidMonths && unpaidMonths.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Unpaid Months:
                </p>
                <div className="space-y-2">
                  {unpaidMonths.map((month, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                      <span className="text-sm text-gray-900 font-medium">
                        {month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Message */}
            {action && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-amber-900">
                  {action}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 rounded-b-2xl flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnpaidMonthsWarningModal;