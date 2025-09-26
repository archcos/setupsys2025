import { useState } from 'react';
import { useForm, Link, Head, usePage, router } from '@inertiajs/react';
import { Eye, EyeOff, User, Lock, AlertCircle,Megaphone } from 'lucide-react';
import logo from '../../assets/logo.png';
import setupLogo from '../../assets/SETUP_logo.png';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { props } = usePage();
  const announcements = props.announcements || [];

  const { data, setData, post, processing, errors } = useForm({
    username: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });

      post('/signin', {
        onError: (errors) => {
          console.error(errors.message);
        }
      });
    } catch (error) {
      console.error("CSRF refresh failed:", error);
    }
  };

  return (
    <>
      <Head title="Login - DOST SETUP" />
      {announcements.length > 0 && (
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 py-2 flex items-center">
          {/* 📢 Fixed Icon on Left */}
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
                    className={`w-full border pl-10 pr-4 py-3.5 rounded-xl transition-colors ${
                      errors.username 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
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
                    className={`w-full border pl-10 pr-12 py-3.5 rounded-xl transition-colors ${
                      errors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
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
                disabled={processing}
                className={`w-full ${
                  processing 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
                } text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
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
            <p>© 2025 DOST Northern Mindanao. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}

LoginPage.layout = null;
