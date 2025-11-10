import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { CheckCircle, Calendar, User, ArrowLeft, AlertTriangle } from "lucide-react";

export default function Checklist({ project, checklist, errors }) {
  const { data, setData, post, processing } = useForm({
    project_id: project.project_id,
    links: {
      link_1: checklist?.link_1 || "",
      link_2: checklist?.link_2 || "",
      link_3: checklist?.link_3 || "",
      link_4: checklist?.link_4 || "",
    },
  });

  const [linkErrors, setLinkErrors] = useState({});

  const isValidCloudLink = (url) => {
    if (!url || url.trim() === "") return true; // Allow empty
    
    const lower = url.toLowerCase().trim();
    return lower.includes('drive.google.com') || 
           lower.includes('onedrive.live.com') || 
           lower.includes('1drv.ms');
  };

  const handleLinkChange = (linkKey, value) => {
    setData("links", {
      ...data.links,
      [linkKey]: value,
    });

    // Validate on change
    if (value.trim() && !isValidCloudLink(value)) {
      setLinkErrors({
        ...linkErrors,
        [linkKey]: "Only Google Drive and OneDrive links are allowed"
      });
    } else {
      const newErrors = { ...linkErrors };
      delete newErrors[linkKey];
      setLinkErrors(newErrors);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validation before submit
    const newErrors = {};
    Object.entries(data.links).forEach(([key, value]) => {
      if (value.trim() && !isValidCloudLink(value)) {
        newErrors[key] = "Only Google Drive and OneDrive links are allowed";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setLinkErrors(newErrors);
      return;
    }

    post(route("checklist.store"));
  };

  const filledCount = Object.values(data.links).filter(link => link.trim()).length;
  const isCompleted = filledCount === 4;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Project Checklist
              </h1>
              <p className="text-gray-600 mt-2">
                {project.project_title}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isCompleted 
                ? 'bg-green-100 text-green-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium text-sm">
                {isCompleted ? 'Completed' : `${filledCount}/4 Links`}
              </span>
            </div>
          </div>
        </div>

                {/* Info Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>
              <span className="font-medium">Important:</span> Only Google Drive and OneDrive links are accepted. 
              Please ensure all URLs are from drive.google.com, onedrive.live.com, or 1drv.ms
            </span>
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-100">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${(filledCount / 4) * 100}%` }}
            />
          </div>

          <div className="p-8">
            <div className="grid gap-6">
              {[1, 2, 3, 4].map((i) => {
                const linkKey = `link_${i}`;
                const dateKey = `link_${i}_date`;
                const addedByKey = `link_${i}_added_by`;
                const hasValue = data.links[linkKey]?.trim();
                const hasHistory = checklist?.[linkKey];
                const hasError = linkErrors[linkKey] || errors?.[`links.${linkKey}`];

                return (
                  <div
                    key={i}
                    className={`border-2 rounded-xl transition-all duration-200 ${
                      hasError
                        ? 'border-red-300 bg-red-50/30'
                        : hasValue
                        ? 'border-green-300 bg-green-50/30'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          hasError 
                            ? 'bg-red-200 text-red-700'
                            : hasValue 
                            ? 'bg-green-200 text-green-700' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {hasError ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Link {i}</h3>
                          <p className="text-xs text-gray-500">
                            {hasError ? 'Invalid Link' : hasValue ? 'Completed' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      {hasValue && !hasError && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    {/* Input Section */}
                    <div className="px-6 py-4">
                      <input
                        type="url"
                        value={data.links[linkKey]}
                        onChange={(e) => handleLinkChange(linkKey, e.target.value)}
                        placeholder="Enter Google Drive or OneDrive URL"
                        className={`w-full border-2 rounded-lg px-4 py-3 focus:outline-none transition-all duration-200 text-sm ${
                          hasError
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                      />
                      {hasError && (
                        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{hasError}</span>
                        </div>
                      )}
                    </div>

                    {/* History Section */}
                    {hasHistory && (
                      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Added by:</span>
                            <span>{checklist[addedByKey] || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Date:</span>
                            <span>{formatDate(checklist[dateKey])}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Section */}
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{filledCount}</span>
                <span> of 4 links completed</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={processing || Object.keys(linkErrors).length > 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 transform ${
                  processing || Object.keys(linkErrors).length > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Checklist'
                )}
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}