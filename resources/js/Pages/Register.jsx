import { useState } from 'react';
import { Link, Head, useForm } from '@inertiajs/react'; 
import { Eye, EyeOff, User, Mail, Lock, Building2 } from 'lucide-react';
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';

const InputError = ({ error }) =>
  error ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1.5">
    <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
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
    company_url: '',
    phone_number: '',
    fax: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState('');

  const handleChange = (e) => {
    setData(e.target.name, e.target.value);
    setPasswordMismatchError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.password !== data.confirm_password) {
      setPasswordMismatchError('Passwords do not match');
      return;
    }
    setPasswordMismatchError('');
    post('/registration', { preserveScroll: true });
  };

  const inputClass = `w-full border border-gray-300 pl-9 pr-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`;
  const iconClass = `absolute left-3 top-2.5 text-gray-400`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        <Head title="Registration - DOST SETUP" />

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-4">

          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center gap-3">
              <img src={logo} alt="DOST Logo" className="w-9 h-9 object-contain" />
              <img src={setupLogo} alt="SETUP Logo" className="h-9 object-contain" />
            </div>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-base font-bold text-gray-900 tracking-tight">DOST - Northern Mindanao</h2>
              <h3 className="text-xs text-gray-500 font-medium leading-relaxed">
                Small Enterprise Technology Upgrading Program <br />Information Management System
              </h3>
            </div>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-lg font-bold text-gray-900 mb-0.5">Create Your Account</h1>
            <p className="text-xs text-gray-500">Join SETUP and get started with your projects</p>
          </div>

          {errors.message && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg mb-4 text-sm">
              {errors.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Honeypot fields */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <input type="text" name="phone_number" value={data.phone_number} onChange={handleChange} tabIndex="-1" autoComplete="off" />
            </div>
            <div style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }} aria-hidden="true">
              <input type="text" name="company_url" value={data.company_url} onChange={handleChange} tabIndex="-1" autoComplete="off" />
            </div>
            <div style={{ opacity: '0', position: 'absolute', pointerEvents: 'none', width: '0', height: '0' }} aria-hidden="true">
              <input type="text" name="fax" value={data.fax} onChange={handleChange} tabIndex="-1" autoComplete="off" />
            </div>

            {/* First Name & Middle Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="relative">
                  <User size={15} className={iconClass} />
                  <input
                    type="text"
                    name="first_name"
                    value={data.first_name}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="First Name"
                    disabled={processing}
                    className={inputClass}
                    required
                  />
                </div>
                <InputError error={errors.first_name} />
              </div>
              <div>
                <div className="relative">
                  <User size={15} className={iconClass} />
                  <input
                    type="text"
                    name="middle_name"
                    value={data.middle_name}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="Middle Name"
                    disabled={processing}
                    className={inputClass}
                  />
                </div>
                <InputError error={errors.middle_name} />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <div className="relative">
                <User size={15} className={iconClass} />
                <input
                  type="text"
                  name="last_name"
                  value={data.last_name}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="Last Name & Ext."
                  disabled={processing}
                  className={inputClass}
                  required
                />
              </div>
              <InputError error={errors.last_name} />
            </div>

            {/* Username */}
            <div>
              <div className="relative">
                <User size={15} className={iconClass} />
                <input
                  type="text"
                  name="username"
                  value={data.username}
                  onChange={handleChange}
                  placeholder="Username"
                  disabled={processing}
                  className={inputClass}
                  maxLength={12}
                  required
                />
              </div>
              <InputError error={errors.username} />
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail size={15} className={iconClass} />
                <input
                  type="email"
                  name="email"
                  value={data.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  disabled={processing}
                  className={inputClass}
                  required
                />
              </div>
              <InputError error={errors.email} />
            </div>

            {/* Office */}
            <div>
              <div className="relative">
                <Building2 size={15} className={`${iconClass} z-10`} />
                <select
                  name="office_id"
                  value={data.office_id}
                  onChange={handleChange}
                  disabled={processing}
                  className={`${inputClass} appearance-none bg-white`}
                  required
                >
                  <option value="">Select Your Office</option>
                  {offices.map((office) => (
                    <option key={office.office_id} value={office.office_id}>
                      {office.office_name}
                    </option>
                  ))}
                </select>
              </div>
              <InputError error={errors.office_id} />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock size={15} className={iconClass} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={data.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={processing}
                  className={`${inputClass} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={processing}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <InputError error={errors.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Lock size={15} className={iconClass} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={data.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  disabled={processing}
                  className={`${inputClass} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={processing}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <InputError error={errors.confirm_password} />
              {passwordMismatchError && <InputError error={passwordMismatchError} />}
            </div>

            <button
              type="submit"
              disabled={processing}
              className={`w-full ${
                processing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
              } text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} DOST Northern Mindanao. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

RegisterPage.layout = null;