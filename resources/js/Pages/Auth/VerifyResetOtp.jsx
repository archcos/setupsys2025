import { useState, useRef, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

export default function VerifyResetOtp({ email, maskedEmail, expiresAt: initialExpiresAt, attemptsLeft, maxAttempts }) {
    const [otp, setOtp]                           = useState('');
    const [expiresAt, setExpiresAt]               = useState(initialExpiresAt);
    const [timeLeft, setTimeLeft]                 = useState(null);
    const [currentAttemptsLeft, setCurrentAttemptsLeft] = useState(attemptsLeft);
    const [isAttemptBlocked, setIsAttemptBlocked] = useState(attemptsLeft <= 0);
    const [customError, setCustomError]           = useState('');
    const [successMessage, setSuccessMessage]     = useState('');
    const [isSubmitting, setIsSubmitting]         = useState(false);
    const [isResending, setIsResending]           = useState(false);
    const [resendCooldown, setResendCooldown]     = useState(0);

    const errorTimerRef   = useRef(null);
    const successTimerRef = useRef(null);

    // -------------------------------------------------------------------------
    // Auto-dismiss helpers
    // -------------------------------------------------------------------------
    const showError = useCallback((msg) => {
        setCustomError(msg);
        clearTimeout(errorTimerRef.current);
        // Permanent errors (blocked / expired) should not auto-dismiss
        if (!msg.includes('Too many') && !msg.includes('expired')) {
            errorTimerRef.current = setTimeout(() => setCustomError(''), 4000);
        }
    }, []);

    const showSuccess = useCallback((msg) => {
        setSuccessMessage(msg);
        clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setSuccessMessage(''), 4000);
    }, []);

    useEffect(() => () => {
        clearTimeout(errorTimerRef.current);
        clearTimeout(successTimerRef.current);
    }, []);

    // -------------------------------------------------------------------------
    // Countdown — rebuilds whenever expiresAt changes (i.e. after resend)
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!expiresAt) return;

        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
            setTimeLeft(diff);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    // -------------------------------------------------------------------------
    // Resend cooldown ticker
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setInterval(() => setResendCooldown((p) => Math.max(0, p - 1)), 1000);
        return () => clearInterval(id);
    }, [resendCooldown]);

    // -------------------------------------------------------------------------
    // OTP input
    // -------------------------------------------------------------------------
    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
        setOtp(value);
        if (customError && !customError.includes('Too many') && !customError.includes('expired')) {
            setCustomError('');
        }
    };

    // -------------------------------------------------------------------------
    // Submit
    // -------------------------------------------------------------------------
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (isAttemptBlocked || currentAttemptsLeft <= 0) {
            showError('Too many failed attempts. Please request a new reset code.');
            return;
        }
        if (otp.length !== 8) {
            showError('Please enter an 8-digit OTP.');
            return;
        }

        setIsSubmitting(true);
        setCustomError('');

        fetch(route('password.reset.verify'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
            },
            body: JSON.stringify({ email, otp }),
        })
        .then(async (response) => {
            const result = await response.json();

            if (response.ok && result.success) {
                window.location.href = result.redirect;
                return;
            }

            if (result.attemptsLeft !== undefined) {
                setCurrentAttemptsLeft(result.attemptsLeft);
                if (result.attemptsLeft <= 0) {
                    setIsAttemptBlocked(true);
                    showError('Too many failed attempts. Please request a new reset code.');
                    return;
                }
            }

            showError(result.message || 'Invalid OTP. Please try again.');
        })
        .catch(() => showError('An error occurred. Please try again.'))
        .finally(() => setIsSubmitting(false));
    };

    // -------------------------------------------------------------------------
    // Resend
    // -------------------------------------------------------------------------
    const handleResend = async () => {
        if (isSubmitting || isResending || resendCooldown > 0) return;

        setIsResending(true);
        setCustomError('');

        try {
            const response = await fetch(route('password.reset.resend-otp'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok && result.expiresAt) {
                // Update expiresAt — triggers the countdown useEffect to reset the timer
                setExpiresAt(result.expiresAt);
                setCurrentAttemptsLeft(maxAttempts);
                setIsAttemptBlocked(false);
                setCustomError('');
                setOtp('');
                setResendCooldown(60);
                showSuccess(result.message || 'New code sent! Check your email.');
            } else {
                showError(result.message || 'Failed to resend OTP. Please try again.');
            }
        } catch {
            showError('Failed to resend OTP. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    // -------------------------------------------------------------------------
    // Derived state
    // -------------------------------------------------------------------------
    const isExpired    = timeLeft === 0;
    const isBlocked    = isAttemptBlocked || currentAttemptsLeft <= 0;
    const formatTime   = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const resendLabel = isResending
        ? null
        : resendCooldown > 0
        ? `Resend Code (${resendCooldown}s)`
        : 'Resend Code';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
            <Head title="Verify Reset OTP" />
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Code</h1>
                    <p className="text-gray-600 mb-6">
                        We sent an 8-digit code to <span className="font-semibold">{maskedEmail}</span>
                    </p>

                    {/* Timer */}
                    {timeLeft !== null && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
                            isExpired
                                ? 'bg-red-50 border border-red-200'
                                : timeLeft < 60
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-blue-50 border border-blue-200'
                        }`}>
                            <Clock className={`w-5 h-5 flex-shrink-0 ${
                                isExpired ? 'text-red-600' : timeLeft < 60 ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                            <div className="text-sm">
                                <p className={`font-semibold ${
                                    isExpired ? 'text-red-800' : timeLeft < 60 ? 'text-yellow-800' : 'text-blue-800'
                                }`}>
                                    {isExpired ? 'Code Expired' : 'Time Remaining'}
                                </p>
                                <p className={
                                    isExpired ? 'text-red-700' : timeLeft < 60 ? 'text-yellow-700' : 'text-blue-700'
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
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                placeholder="00000000"
                                value={otp}
                                onChange={handleOtpChange}
                                maxLength="8"
                                disabled={isExpired || isSubmitting || isBlocked}
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all font-mono disabled:bg-gray-100 disabled:text-gray-500"
                            />
                            <p className="mt-2 text-xs text-gray-500 text-center">{otp.length}/8 digits</p>
                        </div>

                        {/* Alerts */}
                        {customError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {customError}
                                </p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                                    {successMessage}
                                </p>
                            </div>
                        )}

                        {/* Attempts remaining */}
                        {!isBlocked && currentAttemptsLeft > 0 && (
                            <div className={`p-3 border rounded-lg ${
                                currentAttemptsLeft === 1
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-blue-50 border-blue-200'
                            }`}>
                                <p className={`text-sm ${
                                    currentAttemptsLeft === 1 ? 'text-yellow-800' : 'text-blue-800'
                                }`}>
                                    <span className="font-semibold">Attempts remaining:</span> {currentAttemptsLeft}
                                </p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting || otp.length !== 8 || isExpired || isBlocked}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Verifying...
                                </span>
                            ) : 'Verify Code'}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-3">Didn't receive the code?</p>
                        <button
                            onClick={handleResend}
                            disabled={isSubmitting || isResending || resendCooldown > 0}
                            className="flex items-center gap-2 mx-auto text-sm text-slate-600 hover:text-slate-900
                                       font-semibold disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isResending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : resendLabel}
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