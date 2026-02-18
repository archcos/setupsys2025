import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export default function RequestPasswordReset() {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('password.reset.request'), {
            onSuccess: () => {
                setSubmitted(true);
                reset();
                // Redirect to verify form after showing success message briefly
                setTimeout(() => {
                    window.location.href = route('password.reset.verify-form');
                }, 2000);
            },
        });
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 rounded-full p-3">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            Check Your Email
                        </h1>

                        <p className="text-center text-gray-600 mb-6">
                            If an account exists with that email or username, you will receive a password reset code shortly.
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">Didn't receive the code?</span>
                                <br />
                                Check your spam folder or request a new code after a few minutes.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setSubmitted(false);
                                reset();
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Request Another Code
                        </button>

                        <div className="mt-4 text-center">
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

    return (
        <>
            {/* Loading Overlay */}
            {processing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
                        <div className="flex flex-col items-center gap-6">
                            {/* Animated Icon Sequence */}
                            <div className="relative w-24 h-24">
                                {/* Rotating Ring */}
                                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-slate-300 rounded-full animate-spin"></div>

                                {/* Center Icons with Animation */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        <Shield
                                            size={32}
                                            className="text-slate-300 animate-pulse"
                                        />
                                        <Mail
                                            size={16}
                                            className="absolute -bottom-1 -right-1 text-slate-400 animate-bounce"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Progress Steps */}
                            <div className="w-full space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
                                    <span className="text-slate-200 font-medium">Verifying account...</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                    <span className="text-slate-400">Generating reset code...</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                    <span className="text-slate-500">Sending email...</span>
                                </div>
                            </div>

                            {/* Loading Bar */}
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-slate-400 to-slate-200 rounded-full animate-loading-bar"></div>
                            </div>

                            <p className="text-sm text-slate-400 text-center">
                                Please wait while we process your request
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Reset Your Password
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Enter your email or username and we'll send you a code to reset your password.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="login" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email or Username
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        id="login"
                                        type="text"
                                        placeholder="Enter your email or username"
                                        value={data.login}
                                        onChange={(e) => setData('login', e.target.value)}
                                        disabled={processing}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                {errors.login && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.login}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                            >
                                Send Reset Code
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
        </>
    );
}

RequestPasswordReset.layout = null;