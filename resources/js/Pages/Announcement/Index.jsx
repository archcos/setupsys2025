import { Link, router, Head } from "@inertiajs/react";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Index({ announcements, userRole }) {
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleDelete = (id) => {
        router.delete(`/announcements/${id}`, {
            onSuccess: () => {
                setDeleteConfirm(null);
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <main className="flex-1 min-h-screen overflow-y-auto">
            <Head title="Announcements" />
            <div className="max-w-5xl mx-auto p-3 md:p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Announcements
                    </h1>

                    <Link
                        href="/announcements/create"
                        className="inline-flex items-center justify-center md:justify-start gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm md:text-base font-medium w-full md:w-fit"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        Add Announcement
                    </Link>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {userRole === "admin" && (
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Office
                                    </th>
                                )}
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Details
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Start Date
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    End Date
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {announcements.length > 0 ? (
                                announcements.map((a) => (
                                    <tr
                                        key={a.announce_id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {userRole === "admin" && (
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {a.office?.office_name ?? "N/A"}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                                            {a.title}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                                            {a.details}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDate(a.start_date)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDate(a.end_date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/announcements/${a.announce_id}/edit`}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteConfirm(a.announce_id)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={userRole === "admin" ? 6 : 5}
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <p className="text-sm">No announcements found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {announcements.length > 0 ? (
                        announcements.map((a, index) => (
                            <div
                                key={a.announce_id}
                                className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden"
                            >
                                <div className="p-3 space-y-2">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-500 mb-1">#{index + 1}</div>
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                {a.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                        {a.details}
                                    </p>

                                    {/* Office for admin */}
                                    {userRole === "admin" && a.office?.office_name && (
                                        <div className="text-xs text-gray-500">
                                            <span className="font-medium">Office:</span> {a.office.office_name}
                                        </div>
                                    )}

                                    {/* Dates Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                                        <div>
                                            <span className="text-gray-500 block">Start</span>
                                            <p className="font-medium text-gray-900">{formatDate(a.start_date)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">End</span>
                                            <p className="font-medium text-gray-900">{formatDate(a.end_date)}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                                        <Link
                                            href={`/announcements/${a.announce_id}/edit`}
                                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all text-xs font-medium"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => setDeleteConfirm(a.announce_id)}
                                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all text-xs font-medium"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg p-6 text-center">
                            <svg className="w-12 h-12 text-gray-400 mb-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <p className="text-sm text-gray-500">No announcements found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
                    <div className="bg-white rounded-lg md:rounded-xl shadow-xl max-w-sm w-full">
                        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">
                                Delete Announcement
                            </h3>
                        </div>

                        <div className="px-4 md:px-6 py-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">
                                        Are you sure you want to delete this announcement? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-2 md:gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}