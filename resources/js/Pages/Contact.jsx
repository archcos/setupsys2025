import { useState, useEffect } from 'react';
import { useForm, Head, Link, usePage, router } from '@inertiajs/react';
import { 
  Send, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  User,
  CheckCircle,
  BookMarked
} from 'lucide-react';
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';

export default function ContactUs() {
  const [successMessage, setSuccessMessage] = useState('');
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [rateLimitTimer, setRateLimitTimer] = useState(0);

  const { flash, errors: pageErrors } = usePage().props;

  useEffect(() => {
    if (flash?.success) {
      setSuccessMessage(flash.success);
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (flash?.rate_limit) {
      setRateLimitMessage(flash.rate_limit);
      setRateLimitTimer(flash?.rate_seconds || 60);
    }
  }, [flash]);

  // Countdown timer effect
  useEffect(() => {
    if (rateLimitTimer <= 0) return;

    const interval = setInterval(() => {
      setRateLimitTimer(prev => {
        if (prev <= 1) {
          setRateLimitMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: ''
  });

const handleSubmit = (e) => {
  e.preventDefault();

  router.post('/contact', data, {
    preserveScroll: true,
    onSuccess: () => {
      reset();
    },
    onError: (errors, response) => {
      // ✅ Catch rate-limit (429)
    if (response?.status === 429) {
      const msg = response?.props?.flash?.rate_limit || 'Too many requests.';
      const secs = response?.props?.flash?.rate_seconds || 60;

      setRateLimitMessage(msg);
      setRateLimitTimer(secs);
    }
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

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      details: [
        'DOST Regional Office X',
        'Northern Mindanao',
        'Cagayan de Oro City, Philippines'
      ]
    },
    {
      icon: Phone,
      title: 'Phone',
      details: [
        '+63 88 856-1889',
        '+63 88 856-1890'
      ]
    },
    {
      icon: Mail,
      title: 'Email',
      details: [
        'setup@region10.dost.gov.ph',
        'info@region10.dost.gov.ph'
      ]
    },
    {
      icon: Clock,
      title: 'Office Hours',
      details: [
        'Monday - Friday: 8:00 AM - 5:00 PM',
        'Saturday - Sunday: Closed'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <Head title="Contact Us - DOST SETUP" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
              </div>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-semibold text-lg mb-3">Need Immediate Help?</h3>
              <p className="text-blue-100 mb-4 text-sm">
                For urgent matters, please call our main office during business hours.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>+63 88 856-1889</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-8">
                <Send className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Send Us a Message</h2>
              </div>

              {/* Rate Limit Message with Timer */}
              {rateLimitTimer > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium">Warning: Limit Reached!</p>
                    <p className="text-sm mt-1">{rateLimitMessage}</p>
                  </div>
                  <div className="bg-yellow-100 px-3 py-1 rounded-lg text-center min-w-fit">
                    <p className="font-bold text-yellow-900">{rateLimitTimer}s</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {(pageErrors?.message || Object.keys(errors).length > 0) && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Unable to send message</p>
                    {pageErrors?.message && (
                      <p className="text-sm mt-1">{pageErrors.message}</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email Row */}
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
                        onChange={e => setData('name', e.target.value)}
                        disabled={rateLimitTimer > 0}
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
                        onChange={e => setData('email', e.target.value)}
                        disabled={rateLimitTimer > 0}
                        className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    <InputError error={errors.email} />
                  </div>
                </div>

                {/* Phone and Subject Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="tel"
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                        disabled={rateLimitTimer > 0}
                        className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <InputError error={errors.phone} />
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
                        onChange={e => setData('subject', e.target.value)}
                        disabled={rateLimitTimer > 0}
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

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageCircle size={18} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={data.message}
                      onChange={e => setData('message', e.target.value)}
                      disabled={rateLimitTimer > 0}
                      rows={6}
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

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={processing || rateLimitTimer > 0}
                    className={`inline-flex items-center gap-2 px-8 py-3 ${
                      processing || rateLimitTimer > 0
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
                    } text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
                  >
                    {processing ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Message...
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
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              About DOST SETUP Program
            </h3>
            <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
              The Small Enterprise Technology Upgrading Program (SETUP) is a technology intervention program 
              of the Department of Science and Technology (DOST) that provides assistance to micro, small, 
              and medium enterprises (MSMEs) to adopt technology innovations to improve their operations, 
              increase productivity, and enhance competitiveness in both local and international markets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

ContactUs.layout = null;