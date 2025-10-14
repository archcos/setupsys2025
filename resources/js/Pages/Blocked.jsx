import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Home, Mail } from 'lucide-react';

export default function Blocked({ message, blockTime }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center px-4">
      <Head title="Access Blocked" />
      
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-red-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Status Code */}
          <h1 className="text-5xl font-bold text-red-600 text-center mb-2">WARNING!</h1>
          
          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-4">
            Access Blocked
          </h2>

          {/* Message Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Why:</strong> {message || "You've been temporarily blocked due to suspicious activity."}
            </p>
            {blockTime && (
              <p className="text-xs text-red-700 mt-2">
                <strong>Blocked until:</strong> {new Date(blockTime).toLocaleString()}
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            If you believe this is a mistake, please contact our support team.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
       
            
            <Link href="/contact">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Support
              </button>
            </Link>
          </div>

          {/* Footer Info */}
          <p className="text-xs text-gray-500 text-center mt-6">
            ! Access Forbidden !
          </p>
        </div>
      </div>
    </div>
  );
}

Blocked.layout = null;