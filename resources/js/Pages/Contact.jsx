import { useState, useEffect } from 'react';
import { useForm, Head, Link, usePage } from '@inertiajs/react';
import {
  Send,
  Mail,
  Clock,
  MessageCircle,
  User,
  CheckCircle,
  BookMarked,
  ArrowLeft,
  MapPin,
  Phone,
} from 'lucide-react';
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';

export default function ContactUs() {
  const [successMessage, setSuccessMessage] = useState('');
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [rateLimitTimer, setRateLimitTimer] = useState(0);
  const [localErrors, setLocalErrors] = useState({});
  const [showProcessing, setShowProcessing] = useState(false);

  const { flash, errors: pageErrors } = usePage().props;

  useEffect(() => {
    if (flash?.success) {
      setSuccessMessage(flash.success);
      setShowProcessing(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (flash?.rate_limit) {
      setRateLimitMessage(flash.rate_limit);
      setRateLimitTimer(flash?.rate_seconds || 60);
      setShowProcessing(false);
    }
  }, [flash]);

  useEffect(() => {
    if (rateLimitTimer <= 0) return;

    const interval = setInterval(() => {
      setRateLimitTimer((prev) => {
        if (prev <= 1) {
          setRateLimitMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  const validatePhoneNumber = (phone) => {
    if (!phone) return '';
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return 'Phone number must start with 09 and contain 11 digits (Philippine format)';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
    website: '',
  });

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setData('phone', value);

    if (localErrors.phone && value) {
      const error = validatePhoneNumber(value);
      if (!error) setLocalErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setData('email', value);

    if (localErrors.email && value) {
      const error = validateEmail(value);
      if (!error) setLocalErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const phoneError = validatePhoneNumber(data.phone);
    if (data.phone && phoneError) newErrors.phone = phoneError;

    const emailError = validateEmail(data.email);
    if (emailError) newErrors.email = emailError;

    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }

    setLocalErrors({});
    setShowProcessing(true);

    post('/contact', {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setLocalErrors({});
      },
      onError: (submitErrors) => {
        if (submitErrors.rate_seconds || submitErrors.rate_limit) {
          setRateLimitMessage(
            submitErrors.rate_limit || 'Please wait before sending another message.'
          );
          setRateLimitTimer(submitErrors.rate_seconds || 60);
        }
      },
      onFinish: () => {
        setTimeout(() => setShowProcessing(false), 500);
      },
    });
  };

  const InputError = ({ error }) =>
    error ? (
      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
        {error}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <Head title="Contact Us - DOST SETUP" />

      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      {showProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Send size={32} className="text-blue-600 animate-pulse" />
                    <Mail
                      size={16}
                      className="absolute -bottom-1 -right-1 text-green-500 animate-bounce"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 font-medium">Validating message...</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:150ms]"></div>
                  <span className="text-gray-600">Processing your request...</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse [animation-delay:300ms]"></div>
                  <span className="text-gray-500">Sending email...</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-loading-bar"></div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Please wait while we send your message
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img src={logo} alt="DOST Logo" className="w-12 h-12 object-contain" />
              <img src={setupLogo} alt="SETUP Logo" className="h-12 object-contain" />
            </div>
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about SETUP programs or need assistance? We're here to help.
            Contact us and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="order-2 lg:order-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[720px]">
              <iframe
              width="100%"
              height="100%"
              className="w-full h-full min-h-[720px]"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              allowFullScreen=""
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d488.1071438316753!2d124.62752!3d8.48229!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32fff8a9bb6d97ab%3A0x56a9a2c7b8df1d76!2sDOST%20Regional%20Office%20X!5e0!3m2!1sen!2sph!4v1713177938456!5m2!1sen!2sph"
              title="DOST Regional Office X Map"
            ></iframe>
          </div>

            <div className="order-1 lg:order-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-8">
              <Send className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Send Us a Message</h2>
            </div>

            {rateLimitTimer > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-xl mb-6 flex items-center gap-4 animate-pulse">
                <svg
                  className="w-6 h-6 text-yellow-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

                <div className="flex-1">
                  <p className="font-semibold text-lg">Rate Limit Reached!</p>
                  <p className="text-sm mt-1">{rateLimitMessage}</p>
                </div>

                <div className="flex flex-col items-center gap-2 bg-yellow-100 px-6 py-3 rounded-lg min-w-fit">
                  <div className="relative w-20 h-20">
                    <svg
                      className="w-20 h-20 transform -rotate-90"
                      viewBox="0 0 100 100"
                      style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' }}
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#fecaca"
                        strokeWidth="4"
                        opacity="0.5"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="4"
                        strokeDasharray={`${(rateLimitTimer / 60) * 282.7} 282.7`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s linear' }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-red-700">{rateLimitTimer}</span>
                        <p className="text-xs text-red-600 font-semibold">sec</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top">
                <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-lg">{successMessage}</p>
                </div>
              </div>
            )}

            {(pageErrors?.message ||
              Object.keys(errors).length > 0 ||
              Object.keys(localErrors).length > 0) && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl mb-6 flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">Unable to send message</p>
                  {pageErrors?.message && <p className="text-sm mt-1">{pageErrors.message}</p>}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      disabled={rateLimitTimer > 0 || showProcessing}
                      className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <InputError error={errors.name} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      value={data.email}
                      onChange={handleEmailChange}
                      disabled={rateLimitTimer > 0 || showProcessing}
                      className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  <InputError error={localErrors.email || errors.email} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <MessageCircle size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={handlePhoneChange}
                      disabled={rateLimitTimer > 0 || showProcessing}
                      className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="09XXXXXXXXX"
                      maxLength="11"
                    />
                  </div>
                  <InputError error={localErrors.phone || errors.phone} />
                  <p className="text-sm text-gray-500 mt-1">Format: 09 followed by 9 digits</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BookMarked size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={data.subject}
                      onChange={(e) => setData('subject', e.target.value)}
                      disabled={rateLimitTimer > 0 || showProcessing}
                      className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="What's this about?"
                      required
                    />
                  </div>
                  <InputError error={errors.subject} />
                </div>
              </div>

              <div style={{ display: 'none' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                  <input
                    type="text"
                    name="website"
                    value={data.website || ''}
                    onChange={(e) => setData('website', e.target.value)}
                    autoComplete="off"
                    tabIndex="-1"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageCircle size={18} className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    value={data.message}
                    onChange={(e) => setData('message', e.target.value)}
                    disabled={rateLimitTimer > 0 || showProcessing}
                    rows={8}
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Please describe your inquiry or provide details about how we can help you..."
                    required
                  />
                </div>
                <InputError error={errors.message} />
                <p className="text-sm text-gray-500 mt-1">
                  Please provide as much detail as possible to help us assist you better.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={showProcessing || rateLimitTimer > 0}
                  className={`inline-flex items-center gap-2 px-8 py-3 ${
                    showProcessing || rateLimitTimer > 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
                  } text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  {showProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : rateLimitTimer > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Wait {rateLimitTimer}s
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

<div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">
    Contact Information
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

    {/* Address */}
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition">
      <div className="p-2 bg-blue-50 rounded-lg">
        <MapPin className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Address</h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          DOST Regional Office X<br />
          Northern Mindanao<br />
          J.V. Seriña, Cagayan De Oro City
        </p>
      </div>
    </div>

    {/* Phone */}
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Phone className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Phone</h4>
        <p className="text-xs text-gray-600">
          0888 583 931
        </p>
      </div>
    </div>

    {/* Email */}
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Mail className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Email</h4>
        <p className="text-xs text-gray-600 break-all">
          setup@region10.dost.gov.ph<br />
          info@region10.dost.gov.ph
        </p>
      </div>
    </div>

    {/* Office Hours */}
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Clock className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Office Hours</h4>
        <p className="text-xs text-gray-600">
          Mon–Fri: 8:00 AM – 5:00 PM<br />
          Sat–Sun: Closed
        </p>
      </div>
    </div>

  </div>
</div>
      </div>
    </div>
  );
}

ContactUs.layout = null;