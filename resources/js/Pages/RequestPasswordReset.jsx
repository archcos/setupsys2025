import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
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
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            {processing ? 'Sending Code...' : 'Send Reset Code'}
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

RequestPasswordReset.layout = null