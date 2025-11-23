import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Megaphone, Building2, Filter, Calendar, AlertCircle, ArrowLeft, Clock } from "lucide-react";
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';

export default function Announcements({ announcements = [], old_announcements = [], offices = [] }) {
  const [selectedOffice, setSelectedOffice] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showOld, setShowOld] = useState(false);

  // Filter based on office and whether we are showing old or current announcements
  const filteredAnnouncements = (showOld ? old_announcements : announcements)
    .filter((a) => selectedOffice === "" || a.office_id === parseInt(selectedOffice));

  const getOfficeName = (officeId) => {
    const office = offices.find(o => o.office_id === officeId);
    return office?.office_name || "General";
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300">
      <Head title="Announcements" />

      {/* Header */}
      <div className="relative px-4 py-6 sm:py-8">
        <Link
          href="/"
          className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>

        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-4 hover:scale-105 transition-transform">
            <img src={logo} alt="DOST Logo" className="w-10 sm:w-12 h-10 sm:h-12 object-contain" />
            <img src={setupLogo} alt="SETUP Logo" className="h-10 sm:h-12 object-contain" />
          </Link>
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">DOST - Northern Mindanao</h2>
            <h3 className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Small Enterprise Technology Upgrading Program
            </h3>
          </div>
        </div>
      </div>

      <div className="w-full px-4 pb-6 sm:pb-0 sm:max-w-6xl sm:mx-auto">
        {/* Header with filter & old toggle */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex-shrink-0">
              <Megaphone className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent break-words">
                {showOld ? "Past Announcements" : "Announcements"}
              </h1>
              <p className="text-xs sm:text-base text-gray-600 mt-1 line-clamp-2">
                {showOld
                  ? "Browse announcements that have already ended"
                  : "Stay updated with the latest news and updates"}
              </p>
            </div>
          </div>

          {/* Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm shadow hover:shadow-md transition"
            >
              <option value="">🏢 All Offices</option>
              {offices.map((office) => (
                <option key={office.office_id} value={office.office_id}>
                  {office.office_name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowOld(!showOld)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition text-xs sm:text-sm font-medium"
            >
              <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span>{showOld ? "View Current" : "View Past"}</span>
            </button>
          </div>
        </div>

        {/* Announcements List */}
        {filteredAnnouncements.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {filteredAnnouncements.map((a) => (
              <div
                key={a.announce_id}
                className="bg-white rounded-xl sm:rounded-2xl shadow border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 break-words">{a.title}</h2>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-700 bg-blue-50 px-2 sm:px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap flex-shrink-0">
                      <Building2 className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{getOfficeName(a.office_id)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-4 border-blue-500">
                    <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{a.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <Megaphone className="w-8 sm:w-12 h-8 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600">
              {showOld
                ? "No past announcements available."
                : "No active announcements right now."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

Announcements.layout = null;