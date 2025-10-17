import { useState } from 'react';
import { useForm, Link, Head, usePage, router } from '@inertiajs/react';
import { Eye, EyeOff, User, Lock, AlertCircle, Megaphone, Mail, Shield, CheckCircle } from 'lucide-react';
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';
import { v4 as uuidv4 } from 'uuid';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { props } = usePage();
  const announcements = props.announcements || [];
  const flash = props.flash || {};

  const { data, setData, post, processing, errors } = useForm({
    username: '',
    password: '',
  });

  function getDeviceId() {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = uuidv4(); // generate once per browser/device
      localStorage.setItem('device_id', id);
    }
    return id;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });

      post('/signin', {
        onError: (errors) => {
          console.error(errors.message);
          setIsAuthenticating(false);
        },
        onFinish: () => {
          // Keep animation running during redirect
        },
        headers: {
          'X-Device-ID': getDeviceId(),
        },
      });
    } catch (error) {
      console.error("CSRF refresh failed:", error);
      setIsAuthenticating(false);
    }
  };

  return (
    <>
      <Head title="Login - DOST SETUP" />
      
      {/* Loading Overlay */}
      {isAuthenticating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-6">
              {/* Animated Icon Sequence */}
              <div className="relative w-24 h-24">
                {/* Rotating Ring */}
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                
                {/* Center Icons with Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Shield 
                      size={32} 
                      className="text-blue-600 animate-pulse"
                    />
                    <Mail 
                      size={16} 
                      className="absolute -bottom-1 -right-1 text-green-500 animate-bounce"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="w-full space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 font-medium">Verifying credentials...</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                  <span className="text-gray-600">Generating OTP code...</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-300"></div>
                  <span className="text-gray-500">Sending email...</span>
                </div>
              </div>

              {/* Loading Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-loading-bar"></div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Please wait while we authenticate your account
              </p>
            </div>
          </div>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 py-2 flex items-center">
          <div className="flex items-center pl-4 pr-3 text-yellow-700">
            <Megaphone size={20} className="flex-shrink-0" />
          </div>

          <marquee
            behavior="scroll"
            direction="left"
            className="flex-1 cursor-pointer"
            onClick={() => router.visit('/announcements/view')}
          >
            {announcements.map((a) => (
              <span key={a.announce_id} className="mr-12">
                <strong className="font-semibold">{a.title}</strong>
                {a.office?.office_name && (
                  <span className="ml-2 text-gray-700">
                    — {a.office.office_name}
                  </span>
                )}
                {a.details && (
                  <span className="ml-2 text-gray-600 italic">
                    {a.details}
                  </span>
                )}
              </span>
            ))}
          </marquee>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center gap-4 mb-8">
              <div className="flex items-center justify-center gap-4">
                <img src={logo} alt="DOST Logo" className="w-12 h-12 object-contain" />
                <img src={setupLogo} alt="SETUP Logo" className="h-12 object-contain" />
              </div>

              <div className="flex flex-col items-center text-center">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  DOST - Northern Mindanao
                </h2>
                <h3 className="text-sm text-gray-600 font-medium leading-relaxed">
                  Small Enterprise Technology Upgrading Program
                </h3>
              </div>
            </div>

            <div className="text-center mb-2">
              <p className="text-gray-600">
                Sign in to your SETUP account
              </p>
            </div>

            {/* Success Message from Registration */}
            {flash.success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                <span>{flash.success}</span>
              </div>
            )}

            {errors.message && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <span>{errors.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    placeholder="Enter your username"
                    disabled={isAuthenticating}
                    className={`w-full border pl-10 pr-4 py-3.5 rounded-xl transition-colors ${
                      errors.username 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    required
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Enter your password"
                    disabled={isAuthenticating}
                    className={`w-full border pl-10 pr-12 py-3.5 rounded-xl transition-colors ${
                      errors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isAuthenticating}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/contact"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={processing || isAuthenticating}
                className={`w-full ${
                  processing || isAuthenticating
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
                } text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                {processing || isAuthenticating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p><span>© {new Date().getFullYear()} </span> DOST Northern Mindanao. All rights reserved.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </>
  );
}

LoginPage.layout = null;