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
      onSuccess: () => reset('password', 'password_confirmation'),
    });
  }

  const InputError = ({ error }) =>
    error ? (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={13} className="flex-shrink-0" />
        {error}
      </p>
    ) : null;

  const inputClass = (hasError) =>
    `w-full border ${hasError ? 'border-red-500' : 'border-gray-300'} pl-9 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`;

  return (
    <div className="min-h-screen">
      <Head title="Account Settings" />

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-sm text-gray-500">Manage your profile information</p>
            </div>
          </div>
          <Link 
            href={route('user.dashboard')} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Flash / Error banners */}
        {flash?.success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl mb-4 flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            {flash.success}
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-xl mb-4">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Please fix the following errors:</p>
                <ul className="mt-1 text-xs space-y-0.5 list-disc list-inside">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <form onSubmit={handleSubmit}>

            {/* Personal Information */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="text" value={data.first_name} onChange={e => setData('first_name', e.target.value)}
                      className={inputClass(errors.first_name)} placeholder="First name" />
                  </div>
                  <InputError error={errors.first_name} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Middle Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="text" value={data.middle_name} onChange={e => setData('middle_name', e.target.value)}
                      className={inputClass(errors.middle_name)} placeholder="Middle name" />
                  </div>
                  <InputError error={errors.middle_name} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="text" value={data.last_name} onChange={e => setData('last_name', e.target.value)}
                      className={inputClass(errors.last_name)} placeholder="Last name" />
                  </div>
                  <InputError error={errors.last_name} />
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Account Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="text" value={data.username} onChange={e => setData('username', e.target.value)}
                      className={inputClass(errors.username)} placeholder="Username" />
                  </div>
                  <InputError error={errors.username} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                      className={inputClass(errors.email)} placeholder="Email address" />
                  </div>
                  <InputError error={errors.email} />
                </div>
              </div>
            </div>

            {/* Office Information */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Office Information</h2>
              </div>
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Office</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-2.5 text-gray-400 z-10" />
                  <select value={data.office_id} onChange={e => setData('office_id', e.target.value)}
                    className={`${inputClass(errors.office_id)} pr-8 appearance-none bg-white`}>
                    <option value="">Select your office</option>
                    {offices.map(office => (
                      <option key={office.office_id} value={office.office_id}>{office.office_name}</option>
                    ))}
                  </select>
                </div>
                <InputError error={errors.office_id} />
              </div>
            </div>

            {/* Password */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
                <span className="text-sm text-gray-400">(leave blank to keep current)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} value={data.password}
                      onChange={e => setData('password', e.target.value)}
                      className={`${inputClass(errors.password)} pr-10`} placeholder="New password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <InputError error={errors.password} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation}
                      onChange={e => setData('password_confirmation', e.target.value)}
                      className={`${inputClass(errors.password_confirmation)} pr-10`} placeholder="Confirm password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <InputError error={errors.password_confirmation} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
              <Link href={route('user.dashboard')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors text-sm font-medium">
                Cancel
              </Link>
              <button type="submit" disabled={processing}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 ${
                  processing ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
                } text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md`}>
                {processing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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