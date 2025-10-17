import { useState } from 'react';
import { Link, router, Head, useForm } from '@inertiajs/react'; 
import { Eye, EyeOff, User, Mail, Lock, Building2, CheckCircle } from 'lucide-react';
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';

const InputError = ({ error }) =>
  error ? <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
    {error}
  </p> : null;

export default function RegisterPage({ offices }) {
  const { data, setData, post, processing, errors } = useForm({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    office_id: '',
    website: '' 
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setData(e.target.name, e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (data.password !== data.confirm_password) {
      return;
    }

    post('/registration');
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Head title="Registration - DOST SETUP" />
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            {/* Logos */}
            <div className="flex items-center justify-center gap-4">
                <img src={logo} alt="DOST Logo" className="w-10 h-10 object-contain" />
                <img src={setupLogo} alt="SETUP Logo" className="h-10 object-contain" />
            </div>

            {/* Text below */}
            <div className="flex flex-col items-center text-center space-y-1">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">DOST - Northern Mindanao</h2>
              <h3 className="text-sm text-gray-600 font-medium leading-relaxed">
                Small Enterprise Technology Upgrading Program
              </h3>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">
              Join SETUP and get started with your projects
            </p>
          </div>

          {/* Error Messages */}
          {errors.message && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {errors.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* First Name */}
              <div>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="first_name"
                    value={data.first_name}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="First Name"
                    disabled={processing}
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <InputError error={errors.first_name} />
              </div>

              {/* Last Name */}
              <div>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    name="last_name"
                    value={data.last_name}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="Last Name & Ext."
                    disabled={processing}
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <InputError error={errors.last_name} />
              </div>
            </div>

            {/* Middle Name */}
            <div>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="middle_name"
                  value={data.middle_name}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="Middle Name (optional)"
                  disabled={processing}
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <InputError error={errors.middle_name} />
            </div>

            <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} aria-hidden="true">
              <input
                type="text"
                name="website"
                value={data.website}
                onChange={handleChange}
                tabIndex="-1"
                autoComplete="off"
                placeholder="Website"
              />
            </div>

            {/* Username */}
            <div>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={data.username}
                  onChange={handleChange}
                  placeholder="Username"
                  disabled={processing}
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  maxLength={12}
                  required
                />
              </div>
              <InputError error={errors.username} />
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={data.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  disabled={processing}
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <InputError error={errors.email} />
            </div>

            {/* Office */}
            <div>
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-3 text-gray-400 z-10" />
                <select
                  name="office_id"
                  value={data.office_id}
                  onChange={handleChange}
                  disabled={processing}
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select Your Office</option>
                  {offices.map((office) => (
                    <option key={office.office_id} value={office.office_id}>
                      {office.office_name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <InputError error={errors.office_id} />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={data.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={processing}
                  className="w-full border border-gray-300 pl-10 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={processing}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <InputError error={errors.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={data.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  disabled={processing}
                  className="w-full border border-gray-300 pl-10 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={processing}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <InputError error={errors.confirm_password} />
            </div>

            <button
              type="submit"
              disabled={processing}
              className={`w-full ${
                processing 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
              } text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
            <p><span>© {new Date().getFullYear()} </span> DOST Northern Mindanao. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

RegisterPage.layout = null