import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { AlertCircle, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ResetPassword({ email, maskedEmail }) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Password strength calculation
    const getPasswordStrength = () => {
        const password = data.password;
        let strength = 0;

        if (password.length >= 12) strength++;
        if (password.length >= 16) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;

        return strength;
    };

    const strength = getPasswordStrength();
    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent'];
    const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-yellow-400', 'bg-yellow-500', 'bg-green-400', 'bg-green-500', 'bg-green-600'];

    const passwordRequirements = [
        { met: data.password.length >= 12, text: 'At least 12 characters' },
        { met: /[a-z]/.test(data.password), text: 'Lowercase letter' },
        { met: /[A-Z]/.test(data.password), text: 'Uppercase letter' },
        { met: /\d/.test(data.password), text: 'Number' },
        { met: /[@$!%*?&]/.test(data.password), text: 'Special character (@$!%*?&)' },
        { met: data.password === data.password_confirmation && data.password !== '', text: 'Passwords match' },
    ];

    const allRequirementsMet = passwordRequirements.every(req => req.met);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('password.reset'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Create New Password
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Enter a strong password for <span className="font-semibold">{maskedEmail}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your new password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Password Strength */}
                        {data.password && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">Password Strength</span>
                                        <span className={`font-semibold ${
                                            strength <= 2 ? 'text-red-600' : strength <= 4 ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                            {strengthText[strength]}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${strengthColors[strength]}`}
                                            style={{ width: `${((strength + 1) / 7) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div className="grid grid-cols-1 gap-2">
                                    {passwordRequirements.map((req, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            {req.met ? (
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                            )}
                                            <span className={req.met ? 'text-green-700 font-medium' : 'text-gray-500'}>
                                                {req.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Confirm your new password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        {/* Password Mismatch Warning */}
                        {data.password && data.password_confirmation && data.password !== data.password_confirmation && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    Passwords do not match
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing || !allRequirementsMet}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-6"
                        >
                            {processing ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a
                            href={route('login')}
                            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                        >
                            Back to Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
ResetPassword.layout = null;