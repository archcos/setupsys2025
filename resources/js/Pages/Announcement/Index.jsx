import { Link, router, Head } from "@inertiajs/react";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function Index({ announcements, userRole }) {
    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this announcement?")) {
            router.delete(`/announcements/${id}`);
        }
    };

    return (
        <main className="flex-1 p-6 overflow-y-auto">
            <Head title="Announcements" />
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Announcements
                    </h1>

                    {/* ✅ Show Add button only for Admin */}
       
                        <Link
                            href="/announcements/create"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            Add Announcement
                        </Link>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* ✅ Show Office Name column only for Admin */}
                                {userRole === "admin" && (
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                                        Office
                                    </th>
                                )}
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                                    Details
                                </th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                                    Start Date
                                </th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                                    End Date
                                </th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.length > 0 ? (
                                announcements.map((a) => (
                                    <tr
                                        key={a.announce_id}
                                        className="border-t hover:bg-gray-50 transition-colors"
                                    >
                                        {/* ✅ Show Office Name only for Admin */}
                                        {userRole === "admin" && (
                                            <td className="px-6 py-4">
                                                {a.office?.office_name ?? "N/A"}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">{a.title}</td>
                                        <td className="px-6 py-4">{a.details}</td>
                                        <td className="px-6 py-4">{a.start_date}</td>
                                        <td className="px-6 py-4">{a.end_date}</td>
                                        <td className="px-6 py-4 flex gap-3">
                                            <Link
                                                href={`/announcements/${a.announce_id}/edit`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(a.announce_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={userRole === "admin" ? 6 : 5}
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        No announcements found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
