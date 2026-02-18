import { useState, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function VerifyResetOtp({ email, maskedEmail, expiresAt, attemptsLeft, maxAttempts }) {
    const { data, setData, post, processing, errors, setError } = useForm({
        email: email,
        otp: '',
    });

    const [timeLeft, setTimeLeft] = useState(null);
    const [currentAttemptsLeft, setCurrentAttemptsLeft] = useState(attemptsLeft);
    const [isAttemptBlocked, setIsAttemptBlocked] = useState(attemptsLeft <= 0);
    const [customError, setCustomError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const otpInputRef = useRef(null);

    // Parse expiration time
    useEffect(() => {
        if (!expiresAt) return;

        const updateTimer = () => {
            const now = new Date();
            const expires = new Date(expiresAt);
            const diff = Math.max(0, Math.floor((expires - now) / 1000));

            setTimeLeft(diff);

            if (diff === 0) {
                clearInterval(timer);
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [expiresAt]);

    // Fetch OTP status for real-time updates
    const fetchOtpStatus = async () => {
        try {
            const response = await fetch(route('password.reset.otp-status'), {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });

            const result = await response.json();

            if (result.valid) {
                setCurrentAttemptsLeft(result.attemptsLeft);
                
                // If attempts are exhausted, block immediately
                if (result.attemptsLeft <= 0) {
                    setIsAttemptBlocked(true);
                    setCustomError('Too many failed attempts. Please request a new reset code.');
                } else {
                    setIsAttemptBlocked(false);
                }
                
                // Update timer
                if (result.expiresAt) {
                    const now = new Date();
                    const expires = new Date(result.expiresAt);
                    const diff = Math.max(0, Math.floor((expires - now) / 1000));
                    setTimeLeft(diff);
                }
            } else {
                setIsAttemptBlocked(true);
                setCustomError('Password reset code expired. Please request a new one.');
            }
        } catch (error) {
            console.error('Failed to fetch OTP status:', error);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
        setData('otp', value);
        // Clear any previous errors when user starts typing
        if (customError && !customError.includes('Too many')) {
            setCustomError('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prevent submission if already submitting
        if (isSubmitting) return;

        // Prevent submission if blocked
        if (isAttemptBlocked || currentAttemptsLeft <= 0) {
            setCustomError('Too many failed attempts. Please request a new reset code.');
            return;
        }

        if (data.otp.length !== 8) {
            setCustomError('Please enter an 8-digit OTP');
            return;
        }

        setIsSubmitting(true);
        setCustomError('');

        // Use fetch instead of Inertia's post() to handle JSON response
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        
        fetch(route('password.reset.verify'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({
                email: data.email,
                otp: data.otp,
            }),
        })
        .then(async (response) => {
            const result = await response.json();

            if (response.ok && result.success) {
                // Success - redirect to password reset form
                window.location.href = result.redirect;
            } else {
                // Error - display message and update attempts
                if (result.message) {
                    setCustomError(result.message);
                }

                // Update attempts count
                if (result.attemptsLeft !== undefined) {
                    setCurrentAttemptsLeft(result.attemptsLeft);
                    
                    // If attempts are now exhausted, block further attempts
                    if (result.attemptsLeft <= 0) {
                        setIsAttemptBlocked(true);
                        setCustomError('Too many failed attempts. Please request a new reset code.');
                    }
                }

                // Refresh OTP status
                setTimeout(() => {
                    fetchOtpStatus();
                }, 500);
            }
        })
        .catch((error) => {
            console.error('OTP verification error:', error);
            setCustomError('An error occurred. Please try again.');
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    const isExpired = timeLeft === 0;
    // Show blocked state when attempts are exhausted
    const isBlocked = isAttemptBlocked || currentAttemptsLeft <= 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Verify Your Code
                    </h1>
                    <p className="text-gray-600 mb-6">
                        We sent a 8-digit code to <span className="font-semibold">{maskedEmail}</span>
                    </p>

                    {/* Timer Warning */}
                    {timeLeft !== null && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
                            isExpired 
                                ? 'bg-red-50 border border-red-200' 
                                : timeLeft < 60 
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-blue-50 border border-blue-200'
                        }`}>
                            <Clock className={`w-5 h-5 flex-shrink-0 ${
                                isExpired 
                                    ? 'text-red-600' 
                                    : timeLeft < 60 
                                    ? 'text-yellow-600'
                                    : 'text-blue-600'
                            }`} />
                            <div className="text-sm">
                                <p className={`font-semibold ${
                                    isExpired 
                                        ? 'text-red-800' 
                                        : timeLeft < 60 
                                        ? 'text-yellow-800'
                                        : 'text-blue-800'
                                }`}>
                                    {isExpired ? 'Code Expired' : 'Time Remaining'}
                                </p>
                                <p className={
                                    isExpired 
                                        ? 'text-red-700' 
                                        : timeLeft < 60 
                                        ? 'text-yellow-700'
                                        : 'text-blue-700'
                                }>
                                    {isExpired ? 'Please request a new code' : formatTime(timeLeft)}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input */}
                        <div>
                            <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                                Enter OTP Code
                            </label>
                            <input
                                ref={otpInputRef}
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                placeholder="00000000"
                                value={data.otp}
                                onChange={handleOtpChange}
                                maxLength="8"
                                disabled={isExpired || isSubmitting || isBlocked}
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all font-mono disabled:bg-gray-100 disabled:text-gray-500"
                            />
                            <p className="mt-2 text-xs text-gray-500 text-center">
                                {data.otp.length}/8 digits
                            </p>
                        </div>

                        {/* Error Messages */}
                        {customError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {customError}
                                </p>
                            </div>
                        )}

                        {errors.otp && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {errors.otp}
                                </p>
                            </div>
                        )}

                        {errors.email && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {errors.email}
                                </p>
                            </div>
                        )}

                        {/* Attempts Left - Updated Dynamically */}
                        {!isBlocked && currentAttemptsLeft > 0 && (
                            <div className={`p-3 border rounded-lg ${
                                currentAttemptsLeft === 1 
                                    ? 'bg-yellow-50 border-yellow-200' 
                                    : 'bg-blue-50 border-blue-200'
                            }`}>
                                <p className={`text-sm ${
                                    currentAttemptsLeft === 1 
                                        ? 'text-yellow-800' 
                                        : 'text-blue-800'
                                }`}>
                                    <span className="font-semibold">Attempts remaining:</span> {currentAttemptsLeft}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || data.otp.length !== 8 || isExpired || isBlocked}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            {isSubmitting ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-3">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={async () => {
                                if (isSubmitting) return;
                                
                                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
                                
                                const response = await fetch(route('password.reset.resend-otp'), {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken,
                                    },
                                    body: JSON.stringify({ email }),
                                });

                                const result = await response.json();

                                if (response.ok) {
                                    alert('New OTP sent! Check your email.');
                                    // Reset attempts when new OTP is sent
                                    setCurrentAttemptsLeft(maxAttempts);
                                    setIsAttemptBlocked(false);
                                    setCustomError('');
                                    setData('otp', '');
                                    
                                    if (result.expiresAt) {
                                        const now = new Date();
                                        const expires = new Date(result.expiresAt);
                                        const diff = Math.max(0, Math.floor((expires - now) / 1000));
                                        setTimeLeft(diff);
                                    }
                                } else {
                                    alert(result.message || 'Failed to resend OTP');
                                }
                            }}
                            disabled={isSubmitting}
                            className="text-sm text-slate-600 hover:text-slate-900 font-semibold disabled:text-gray-400"
                        >
                            Resend Code
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <a
                            href={route('password.request')}
                            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                        >
                            Use different email
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

VerifyResetOtp.layout = null;