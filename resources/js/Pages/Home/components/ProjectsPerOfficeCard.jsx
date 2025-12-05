import { Building2, MapPin } from 'lucide-react';

export default function ProjectsPerOfficeCard({ projectsPerOffice, selectedYear }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="p-1 md:p-1.5 bg-blue-100 rounded-md">
          <Building2 className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">Projects Per Office</h2>
          <p className="text-xs text-gray-600">Distribution for {selectedYear}</p>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(projectsPerOffice).map(([office, count]) => (
          <div key={office} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <h3 className="font-medium text-gray-900 text-xs md:text-sm truncate">{office}</h3>
            </div>
            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex-shrink-0">
              {count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}