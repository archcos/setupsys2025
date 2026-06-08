import { Eye, Download } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function AllProjectsRow({ project }) {
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
            // Fetch the file as a blob
            const response = await fetch(`/refunds/${project.project_id}/download`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });
            
            if (!response.ok) {
                throw new Error('Download failed');
            }
            
            // Get the blob from response
            const blob = await response.blob();
            
            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Extract filename from Content-Disposition header if available, or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `project_${project.project_id}.xlsx`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Show success toast
            setToast({ type: 'success', message: 'File downloaded successfully!' });
        } catch (error) {
            console.error('Download error:', error);
            // Show error toast
            setToast({ type: 'error', message: 'Failed to download file. Please try again.' });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-gray-700">
                    {project.project_id}
                </td>
                <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                        {project.project_title}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    {project.proponent?.company_name ?? '—'}
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Link
                            href={`/refunds/project/${project.project_id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`p-2 rounded-lg transition-all ${
                                isDownloading 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Download All Data"
                        >
                            {isDownloading ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </td>
            </tr>

            {/* Loading Overlay */}
            {isDownloading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-700">Generating Excel file...</span>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 animate-slide-up ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px]`}>
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Add these styles to your global CSS or component */}
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