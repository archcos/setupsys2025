import { useState } from 'react';
import { useForm, Link, Head, usePage } from '@inertiajs/react';
import { 
  Save, 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Building2, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

export default function SettingsPage({ user, offices }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { flash } = usePage().props;

  const { data, setData, put, processing, errors, reset } = useForm({
    first_name: user.first_name || '',
    middle_name: user.middle_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    email: user.email || '',
    password: '',
    password_confirmation: '',
    office_id: user.office_id || '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    put(route('users.update', user.user_id), {
      preserveScroll: true,
      onSuccess: () => {
        // Clear password fields after successful update
        reset('password', 'password_confirmation');
      }
    });
  }

  const InputError = ({ error }) =>
    error ? (
      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
        <AlertCircle size={14} className="flex-shrink-0" />
        {error}
      </p>
    ) : null;

  return (
    <div className="min-h-screen">
      <Head title="Account Settings" />

      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600">Manage your profile information</p>
              </div>
            </div>
            <Link 
              href={route('user.dashboard')} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {flash?.success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            {flash.success}
          </div>
        )}

        {/* Error Summary (if multiple errors) */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Please fix the following errors:</p>
                <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Main Settings Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={data.first_name}
                      onChange={e => setData('first_name', e.target.value)}
                      className={`w-full border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="Enter first name"
                    />
                  </div>
                  <InputError error={errors.first_name} />
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={data.middle_name}
                      onChange={e => setData('middle_name', e.target.value)}
                      className={`w-full border ${errors.middle_name ? 'border-red-500' : 'border-gray-300'} pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="Enter middle name"
                    />
                  </div>
                  <InputError error={errors.middle_name} />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={data.last_name}
                      onChange={e => setData('last_name', e.target.value)}
                      className={`w-full border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="Enter last name"
                    />
                  </div>
                  <InputError error={errors.last_name} />
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="border-t pt-8">
              <div className="flex items-center gap-2 mb-6">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={data.username}
                      onChange={e => setData('username', e.target.value)}
                      className={`w-full border ${errors.username ? 'border-red-500' : 'border-gray-300'} pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="Enter username"
                    />
                  </div>
                  <InputError error={errors.username} />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      value={data.email}
                      onChange={e => setData('email', e.target.value)}
                      className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="Enter email address"
                    />
                  </div>
                  <InputError error={errors.email} />
                </div>
              </div>
            </div>

            {/* Office Information Section */}
            <div className="border-t pt-8">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Office Information</h2>
              </div>

              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office
                </label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3 top-3 text-gray-400 z-10" />
                  <select
                    value={data.office_id}
                    onChange={e => setData('office_id', e.target.value)}
                    className={`w-full border ${errors.office_id ? 'border-red-500' : 'border-gray-300'} pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white`}
                  >
                    <option value="">Select your office</option>
                    {offices.map(office => (
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
            </div>

            {/* Password Section */}
            <div className="border-t pt-8">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <span className="text-sm text-gray-500">(leave blank to keep current)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={data.password}
                      onChange={e => setData('password', e.target.value)}
                      className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} pl-10 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <InputError error={errors.password} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={data.password_confirmation}
                      onChange={e => setData('password_confirmation', e.target.value)}
                      className={`w-full border ${errors.password_confirmation ? 'border-red-500' : 'border-gray-300'} pl-10 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <InputError error={errors.password_confirmation} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-8 flex flex-col sm:flex-row gap-4 justify-end">
              <Link
                href={route('user.dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${
                  processing 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
                } text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}