import React, { useState } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { CheckCircle, Calendar, User, AlertTriangle, AlertCircle, X, ChevronLeft } from "lucide-react";

export default function Compliance({ project, compliance, errors, userRole }) {
  const { data, setData, post, processing } = useForm({
    project_id: project.project_id,
    links: {
      link_1: compliance?.link_1 || "",
      link_2: compliance?.link_2 || "",
      link_3: compliance?.link_3 || "",
      link_4: compliance?.link_4 || "",
    },
  });

  const [linkErrors, setLinkErrors] = useState({});
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [denyRemark, setDenyRemark] = useState("");
  const [denyProcessing, setDenyProcessing] = useState(false);
  const [approveProcessing, setApproveProcessing] = useState(false);

  const isValidCloudLink = (url) => {
    if (!url || url.trim() === "") return true;
    
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

    post(route("compliance.store"));
  };

  const handleApproveClick = () => {
    setShowApproveConfirmModal(true);
  };

  const handleApproveConfirm = () => {
    setApproveProcessing(true);
    router.post(route("compliance.approve"), {
      project_id: project.project_id
    }, {
      onFinish: () => {
        setApproveProcessing(false);
        setShowApproveConfirmModal(false);
      }
    });
  };

  const handleDenySubmit = () => {
    if (!denyRemark.trim()) {
      alert("Please provide a remark for denial");
      return;
    }

    if (denyRemark.trim().length < 5) {
      alert("Remark must be at least 5 characters");
      return;
    }

    setDenyProcessing(true);
    router.post(route("compliance.deny"), {
      project_id: project.project_id,
      remark: denyRemark
    }, {
      onFinish: () => {
        setDenyProcessing(false);
        setShowDenyModal(false);
        setDenyRemark("");
      }
    });
  };

  const filledCount = Object.values(data.links).filter(link => link.trim()).length;
  const isCompleted = filledCount === 4;
  const isAlreadyApproved = compliance?.status === 'raised' || compliance?.status === 'approved';

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
    <>
      <div className="min-h-screen">
        <Head title={`Review - ${project.project_title}`} />
        
        <div className="max-w-4xl mx-auto p-3 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-4 md:mb-8">
            <Link
              href="/compliance"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to List
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Project Compliance
                </h1>
                <p className="text-xs md:text-base text-gray-600 mt-1 line-clamp-2">
                  {project.project_title}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 ${
                isCompleted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium text-xs md:text-sm">
                  {isCompleted ? 'Completed' : `${filledCount}/4`}
                </span>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl">
            <p className="text-xs md:text-sm text-blue-900 flex items-start gap-2">
              <span className="text-base md:text-lg flex-shrink-0">💡</span>
              <span>
                <span className="font-medium">Important:</span> Only Google Drive and OneDrive links accepted.
              </span>
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg border border-gray-100 overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1.5 md:h-2 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${(filledCount / 4) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-4 md:p-8">
              <div className="grid gap-3 md:gap-6">
                {[1, 2, 3, 4].map((i) => {
                  const linkKey = `link_${i}`;
                  const dateKey = `link_${i}_date`;
                  const addedByKey = `link_${i}_added_by`;
                  const hasValue = data.links[linkKey]?.trim();
                  const hasHistory = compliance?.[linkKey];
                  const hasError = linkErrors[linkKey] || errors?.[`links.${linkKey}`];

                  return (
                    <div
                      key={i}
                      className={`border-2 rounded-lg md:rounded-xl transition-all duration-200 overflow-hidden ${
                        hasError
                          ? 'border-red-300 bg-red-50/30'
                          : hasValue
                          ? 'border-green-300 bg-green-50/30'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      {/* Header */}
                      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            hasError 
                              ? 'bg-red-200 text-red-700'
                              : hasValue 
                              ? 'bg-green-200 text-green-700' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {hasError ? (
                              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                            ) : (
                              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-base text-gray-900">Link {i}</h3>
                            <p className="text-xs text-gray-500">
                              {hasError ? 'Invalid Link' : hasValue ? 'Completed' : 'Pending'}
                            </p>
                          </div>
                        </div>
                        {hasValue && !hasError && (
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="px-4 md:px-6 py-3 md:py-4">
                        <input
                          type="url"
                          value={data.links[linkKey]}
                          onChange={(e) => handleLinkChange(linkKey, e.target.value)}
                          placeholder="Enter Google Drive or OneDrive URL"
                          disabled={userRole === 'rpmo' || isAlreadyApproved}
                          className={`w-full border-2 rounded-lg px-3 md:px-4 py-2 md:py-3 focus:outline-none transition-all duration-200 text-xs md:text-sm ${
                            userRole === 'rpmo' || isAlreadyApproved
                              ? 'bg-gray-50 cursor-not-allowed text-gray-600 border-gray-200'
                              : hasError
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                        />
                        {userRole === 'rpmo' && data.links[linkKey] && (
                          <a
                            href={data.links[linkKey]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium"
                          >
                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Open Link
                          </a>
                        )}
                        {hasError && (
                          <div className="mt-2 flex items-center gap-1 text-red-600 text-xs md:text-sm">
                            <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span>{hasError}</span>
                          </div>
                        )}
                      </div>

                      {/* History */}
                      {hasHistory && (
                        <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50/50 border-t border-gray-100">
                          <div className="space-y-1 md:space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">Added by:</span>
                              <span className="truncate">{compliance[addedByKey] || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium">Date:</span>
                              <span>{formatDate(compliance[dateKey])}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                <div className="text-xs md:text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{filledCount}</span>
                  <span> of 4 links completed</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
                  {userRole === 'rpmo' && (
                    <>
                      <button
                        onClick={() => setShowDenyModal(true)}
                        disabled={isAlreadyApproved}
                        className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all duration-200 border-2 text-sm md:text-base ${
                          isAlreadyApproved
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-red-600 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        Deny
                      </button>
                      <button
                        onClick={handleApproveClick}
                        disabled={!isCompleted || approveProcessing || isAlreadyApproved}
                        className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all duration-200 transform text-sm md:text-base ${
                          !isCompleted || approveProcessing || isAlreadyApproved
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-lg hover:scale-105'
                        }`}
                      >
                        {approveProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Recommending...
                          </span>
                        ) : (
                          'Recommend'
                        )}
                      </button>
                    </>
                  )}
                  
                  {userRole !== 'rpmo' && (
                    <button
                      onClick={handleSubmit}
                      disabled={processing || Object.keys(linkErrors).length > 0 || isAlreadyApproved}
                      className={`flex-1 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all duration-200 transform text-sm md:text-base ${
                        processing || Object.keys(linkErrors).length > 0 || isAlreadyApproved
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        'Save Compliance'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-md w-full">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Deny Project</h3>
              <button
                onClick={() => {
                  setShowDenyModal(false);
                  setDenyRemark("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-gray-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Please provide a reason for denying this project compliance.</span>
                </p>
              </div>

              <div className="mb-4 md:mb-6">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Remark <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={denyRemark}
                  onChange={(e) => setDenyRemark(e.target.value)}
                  placeholder="Enter reason (min 5 characters)..."
                  className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition-all duration-200 resize-none text-xs md:text-sm"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {denyRemark.length}/500 characters
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => {
                    setShowDenyModal(false);
                    setDenyRemark("");
                  }}
                  className="flex-1 px-4 py-2 md:py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDenySubmit}
                  disabled={denyProcessing || !denyRemark.trim() || denyRemark.trim().length < 5}
                  className={`flex-1 px-4 py-2 md:py-2.5 rounded-lg font-medium transition-all duration-200 text-xs md:text-sm ${
                    denyProcessing || !denyRemark.trim() || denyRemark.trim().length < 5
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {denyProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Denying...
                    </span>
                  ) : (
                    'Confirm Denial'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-md w-full">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Recommend to RD</h3>
              <button
                onClick={() => setShowApproveConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-gray-700 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Are you sure you want to recommend this project to the Regional Director for approval? 
                    Once submitted, you cannot make further changes.
                  </span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => setShowApproveConfirmModal(false)}
                  className="flex-1 px-4 py-2 md:py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveConfirm}
                  disabled={approveProcessing}
                  className={`flex-1 px-4 py-2 md:py-2.5 rounded-lg font-medium transition-all duration-200 text-xs md:text-sm ${
                    approveProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  }`}
                >
                  {approveProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Recommending...
                    </span>
                  ) : (
                    'Confirm Recommendation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}