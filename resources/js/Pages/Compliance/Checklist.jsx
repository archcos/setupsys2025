import React, { useState, useEffect, useRef } from "react";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { CheckCircle, Calendar, User, AlertTriangle, AlertCircle, X, ChevronLeft, Mail, Upload, FileText, Download, Eye } from "lucide-react";

export default function ComplianceChecklist({ project, compliance, errors, userRole, showEmailPrompt: initialShowEmailPrompt }) {
  const { flash } = usePage().props;
  
  const { data, setData, post, processing } = useForm({
    project_id: project.project_id,
    pp_file: null,
    fs_file: null,
  });

  const [linkErrors, setLinkErrors] = useState({});
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [denyRemark, setDenyRemark] = useState("");
  const [denyProcessing, setDenyProcessing] = useState(false);
  const [approveProcessing, setApproveProcessing] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  
  // PDF Viewer Modal state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const ppInputRef = useRef(null);
  const fsInputRef = useRef(null);

  // Debug log
  useEffect(() => {
    console.log('ComplianceChecklist mounted', {
      flash: flash,
      initialShowEmailPrompt: initialShowEmailPrompt,
      compliance: compliance
    });
  }, []);

  // Check for email prompt from multiple sources
  useEffect(() => {
    if (flash?.showEmailPrompt || initialShowEmailPrompt) {
      console.log('Showing email prompt!', {
        fromFlash: flash?.showEmailPrompt,
        fromProps: initialShowEmailPrompt
      });
      setShowEmailPrompt(true);
    }
  }, [flash?.showEmailPrompt, initialShowEmailPrompt]);

  // Close PDF modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowPdfModal(false);
        setShowDenyModal(false);
        setShowApproveConfirmModal(false);
        setShowEmailPrompt(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const validateFile = (file) => {
    if (!file) return null;
    
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return "File size must be less than 20MB";
    }
    
    if (file.type !== 'application/pdf') {
      return "Only PDF files are allowed";
    }
    
    return null;
  };

  const handleFileChange = (fileKey, file) => {
    setData(fileKey, file);
    
    const error = validateFile(file);
    if (error) {
      setLinkErrors({
        ...linkErrors,
        [fileKey]: error
      });
    } else {
      const newErrors = { ...linkErrors };
      delete newErrors[fileKey];
      setLinkErrors(newErrors);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (data.pp_file) {
      const error = validateFile(data.pp_file);
      if (error) newErrors.pp_file = error;
    }
    
    if (data.fs_file) {
      const error = validateFile(data.fs_file);
      if (error) newErrors.fs_file = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setLinkErrors(newErrors);
      return;
    }

    console.log('Submitting form...');
    post(route("compliance.store"), {
      forceFormData: true,
      onSuccess: () => {
        console.log('Form submitted successfully');
      },
      onError: (errors) => {
        console.log('Form submission errors:', errors);
      }
    });
  };

  const handleViewPdf = (type) => {
    setPdfLoading(true);
    setPdfUrl(route('compliance.view-file', { project_id: project.project_id, type: type }));
    setShowPdfModal(true);
  };

  const handleSendEmail = () => {
    setEmailSending(true);
    router.post(route('compliance.send-notification'), {
      project_id: project.project_id
    }, {
      onFinish: () => {
        setEmailSending(false);
        setShowEmailPrompt(false);
      }
    });
  };

  const handleSkipEmail = () => {
    setShowEmailPrompt(false);
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

  const hasPPFile = compliance?.pp_link || data.pp_file;
  const hasFSFile = compliance?.fs_link || data.fs_file;
  const filledCount = [hasPPFile, hasFSFile].filter(Boolean).length;
  const isCompleted = filledCount === 2;
  const isAlreadyApproved = compliance?.status === 'recommended' || compliance?.status === 'approved';

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
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Compliance Review List
            </button>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                  Project Compliance
                </h1>
                <p className="text-xs md:text-base mt-1 line-clamp-2">
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
                  {isCompleted ? 'Completed' : `${filledCount}/2`}
                </span>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl">
            <p className="text-xs md:text-sm text-blue-900 flex items-start gap-2">
              <span className="text-base md:text-lg flex-shrink-0">💡</span>
              <span>
                <span className="font-medium">Important:</span> Only PDF files are accepted. Maximum file size: 20MB.
              </span>
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg border border-gray-100 overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1.5 md:h-2 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${(filledCount / 2) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-4 md:p-8">
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="grid gap-3 md:gap-6">
                  {[
                    { 
                      key: 'pp_file', 
                      type: 'pp',
                      label: 'Project Proposal',
                      dbPath: compliance?.pp_link,
                      dateKey: 'pp_link_date',
                      addedByKey: 'pp_link_added_by',
                      inputRef: ppInputRef
                    },
                    { 
                      key: 'fs_file', 
                      type: 'fs',
                      label: 'Financial Statement',
                      dbPath: compliance?.fs_link,
                      dateKey: 'fs_link_date',
                      addedByKey: 'fs_link_added_by',
                      inputRef: fsInputRef
                    }
                  ].map(({ key, type, label, dbPath, dateKey, addedByKey, inputRef }) => {
                    const hasValue = dbPath || data[key];
                    const hasError = linkErrors[key] || errors?.[key];
                    const selectedFile = data[key];
                    const displayName = selectedFile 
                      ? selectedFile.name 
                      : dbPath || 'No file selected';

                    return (
                      <div
                        key={key}
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
                                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm md:text-base text-gray-900">{label}</h3>
                              <p className="text-xs text-gray-500">
                                {hasError ? 'Invalid File' : hasValue ? 'File Uploaded' : 'No File'}
                              </p>
                            </div>
                          </div>
                          {hasValue && !hasError && (
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>

                        {/* File Upload Area */}
                        <div className="px-4 md:px-6 py-3 md:py-4">
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-600 font-medium">Current file:</p>
                              {dbPath && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleViewPdf(type)}
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                  <a
                                    href={route('compliance.download-file', { project_id: project.project_id, type: type })}
                                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium"
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                              <p className="text-xs text-gray-700 truncate">{displayName}</p>
                            </div>
                          </div>

                          {(userRole !== 'rpmo' && !isAlreadyApproved) && (
                            <div>
                              <input
                                ref={inputRef}
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(key, e.target.files[0])}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-xs md:text-sm font-medium text-gray-600 hover:text-blue-600"
                              >
                                <Upload className="w-4 h-4" />
                                {dbPath ? 'Replace File (PDF only)' : 'Upload PDF File'}
                              </button>
                            </div>
                          )}
                          
                          {hasError && (
                            <div className="mt-2 flex items-center gap-1 text-red-600 text-xs md:text-sm">
                              <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              <span>{hasError}</span>
                            </div>
                          )}
                        </div>

                        {/* History */}
                        {dbPath && (
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
                    <span> of 2 files uploaded</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
                    {userRole === 'rpmo' && (
                      <>
                        <button
                          type="button"
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
                          type="button"
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
                        type="submit"
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
                          'Save Files'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showPdfModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4"
          onClick={() => setShowPdfModal(false)}
        >
          <div
            className="bg-white rounded-lg md:rounded-xl w-full h-[85vh] md:h-[90vh] shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPdfModal(false)}
              className="absolute top-2 md:top-3 right-2 md:right-3 p-1.5 md:p-2 bg-gray-200 rounded-full hover:bg-gray-300 z-50 transition"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            </button>
            {pdfLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-40">
                <div className="animate-spin rounded-full h-8 md:h-10 w-8 md:w-10 border-4 border-gray-300 border-t-blue-500" />
              </div>
            )}
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              frameBorder="0"
              onLoad={() => setPdfLoading(false)}
            />
          </div>
        </div>
      )}

      {/* Email Notification Prompt Modal */}
      {showEmailPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-md w-full">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Notify RPMO
              </h3>
              <button
                onClick={handleSkipEmail}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-900">
                      All compliance documents uploaded!
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">
                      Both Project Proposal and Financial Statement have been submitted. 
                      Would you like to notify the RPMO team?
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">Note:</span> You can still choose not to notify now. 
                    The documents are saved and can be notified later.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={handleSkipEmail}
                  className="flex-1 px-4 py-2 md:py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-xs md:text-sm"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending}
                  className={`flex-1 px-4 py-2 md:py-2.5 rounded-lg font-medium transition-all duration-200 text-xs md:text-sm ${
                    emailSending
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {emailSending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send Notification
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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