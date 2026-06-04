import { Eye, Download } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function AllProjectsRow({ project }) {
    const handleDownload = () => {
        window.open(`/refunds/${project.project_id}/download`, '_blank');
    };

    return (
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
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Download All Data"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}