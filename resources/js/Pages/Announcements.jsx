import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Megaphone, Building2, ArrowLeft, Clock, Calendar } from "lucide-react";
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';

export default function Announcements({ announcements = [], old_announcements = [], offices = [] }) {
  const [selectedOffice, setSelectedOffice] = useState("");
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

  const getDateRange = (announcement) => {
    const start = formatDate(announcement.start_date);
    const end = formatDate(announcement.end_date);
    if (start && end) return `${start} - ${end}`;
    return start || end || "No date";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Head title="Announcements" />

      {/* Header */}
      <div className="relative px-4 py-6 sm:py-8 border-b border-gray-200/50">
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

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

      <div className="w-full px-4 pb-6 sm:pb-8 sm:max-w-6xl sm:mx-auto">
        {/* Header with filter & toggle */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8 mt-6 sm:mt-8">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl shadow-md flex-shrink-0">
              <Megaphone className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {showOld ? "Past Announcements" : "Announcements"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {showOld
                  ? "Browse announcements that have already ended"
                  : "Stay updated with the latest news and updates"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 sm:w-auto">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="">All Offices</option>
                {offices.map((office) => (
                  <option key={office.office_id} value={office.office_id}>
                    {office.office_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowOld(!showOld)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
            >
              <Clock className="w-4 h-4 text-gray-600" />
              <span>{showOld ? "View Current" : "View Past"}</span>
            </button>
          </div>
        </div>

        {/* Announcements List */}
        {filteredAnnouncements.length > 0 ? (
          <div className="space-y-4 sm:space-y-5">
            {filteredAnnouncements.map((a, index) => (
              <div
                key={a.announce_id}
                className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
                style={{
                  animation: `slideIn 0.4s ease-out ${index * 0.05}s both`
                }}
              >
                <div className="flex flex-col gap-3">
                  {/* Title and Office Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 break-words group-hover:text-blue-600 transition-colors">
                      {a.title}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-700 bg-blue-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-200 whitespace-nowrap flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{getOfficeName(a.office_id)}</span>
                    </div>
                  </div>

                  {/* Details Box */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-lg p-3 sm:p-4 border border-gray-200 group-hover:bg-gray-100 transition-colors">
                    <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                      {a.details}
                    </p>
                  </div>

                  {/* Date Range */}
                  {getDateRange(a) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{getDateRange(a)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <Megaphone className="w-8 sm:w-10 h-8 sm:h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm sm:text-base text-gray-600">
              {showOld
                ? "No past announcements available."
                : "No active announcements right now."}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

Announcements.layout = null;