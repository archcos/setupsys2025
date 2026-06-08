import { Eye, Download } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function AllProjectsMobileCard({ project }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [toast, setToast] = useState(null);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleDownload = async () => {
        setIsDownloading(true);
        
        try {
            // Use window.location for direct download to avoid corruption
            const downloadUrl = `/refunds/${project.project_id}/download`;
            
            // Create a temporary anchor element
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `project_${project.project_id}_refunds.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            setToast({ type: 'success', message: 'Download started!' });
        } catch (error) {
            console.error('Download error:', error);
            setToast({ type: 'error', message: 'Failed to download file. Please try again.' });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            <div className="p-4 hover:bg-gray-50 transition-colors relative">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-medium border border-blue-100">
                        {project.project_id}
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">
                    {project.project_title}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                    {project.proponent?.company_name ?? '—'}
                </p>
                <div className="flex gap-2">
                    <Link
                        href={`/refunds/project/${project.project_id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                    </Link>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                            isDownloading 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                    >
                        {isDownloading ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                <span>Downloading...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-4 left-4 right-4 z-50 animate-slide-up ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    <span className="text-sm font-medium flex-1">{toast.message}</span>
                </div>
            )}

            {/* Loading Overlay for mobile */}
            {isDownloading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center gap-3 max-w-[80%]">
                        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-700 font-medium">Generating Excel file...</span>
                        <span className="text-xs text-gray-500">Please wait</span>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
}