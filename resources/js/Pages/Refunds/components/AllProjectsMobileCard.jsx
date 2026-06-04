import { Eye, Download } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function AllProjectsMobileCard({ project }) {
    const handleDownload = () => {
        window.open(`/refunds/${project.project_id}/download`, '_blank');
    };

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors">
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
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download
                </button>
            </div>
        </div>
    );
}