import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function VerifyOtp() {
  const { props } = usePage();
  const email               = props.email || '';
  const maskedEmail         = props.maskedEmail || email;
  const initialExpiresAt    = props.expiresAt || null;
  const initialAttemptsLeft = props.attemptsLeft ?? 3;

  const [otp, setOtp]                   = useState('');
  const [message, setMessage]           = useState('');
  const [error, setError]               = useState('');
  const [timeLeft, setTimeLeft]         = useState(300);
  const [resending, setResending]       = useState(false);
  const [verifying, setVerifying]       = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(initialAttemptsLeft);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [initialWait, setInitialWait]   = useState(30);
  const [isExpired, setIsExpired]       = useState(false);
  const [expiresAt, setExpiresAt]       = useState(initialExpiresAt);

  // Calculate time left from backend expiration time
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(300);
      return;
    }

    const calculateTimeLeft = () => {
      const now        = new Date().getTime();
      const expireTime = new Date(expiresAt).getTime();
      const remaining  = Math.max(0, Math.floor((expireTime - now) / 1000));

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Initial 30-second wait before resend is allowed
  useEffect(() => {
    if (initialWait <= 0) return;
    const timer = setInterval(() => {
      setInitialWait((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [initialWait]);

  // Cooldown after each resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Only allow digits, max 6
  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    const sanitized = value.slice(0, 6);
    setOtp(sanitized);
    if (error && sanitized.length > 0) setError('');
  };

  const handleVerify = (e) => {
    e?.preventDefault();

    if (verifying) return;

    if (isExpired) {
      setError('OTP has expired. Please request a new one.');
      return;
    }

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    if (attemptsLeft === 0) {
      setError('No attempts remaining. Please request a new OTP.');
      return;
    }

    setVerifying(true);
    setError('');
    setMessage('');

    router.post(
      '/verify-otp',
      { email, otp },
      {
        onError: (errors) => {
          setError(errors.message || 'Invalid OTP. Please try again.');

          if (attemptsLeft > 0 && !errors.message?.includes('Too many')) {
            setAttemptsLeft((prev) => Math.max(0, prev - 1));
          } else if (errors.message?.includes('Too many')) {
            setAttemptsLeft(0);
          }

          setVerifying(false);
        },
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && otp.length === 6 && !verifying && !isExpired) {
      e.preventDefault();
      handleVerify();
    }
  };

  const resendOtp = () => {
    if (!email || resending) return;

    setResending(true);
    setError('');
    setMessage('');

    router.post(
      '/resend-otp',
      { email },
      {
        onSuccess: (page) => {
          const newExpiresAt = page.props.expiresAt;
          const newMessage   = page.props.message;

          if (newExpiresAt) {
            setMessage(newMessage || 'OTP resent successfully! Check your email.');
            setExpiresAt(newExpiresAt);
            setIsExpired(false);
            setAttemptsLeft(3);
            setOtp('');
            setResendCooldown(30);
            setInitialWait(30);
          } else {
            setError('Failed to get OTP expiration time. Please try again.');
          }
          setResending(false);
        },
        onError: (errors) => {
          setError(errors.message || 'Failed to resend OTP. Please try again.');
          setResending(false);
        },
      }
    );
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300 flex items-center justify-center p-4">
      <Head title="Verify OTP" />
      
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-blue-100 p-6">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 mb-3">
            <Mail size={22} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Verify your email</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Enter the code sent to{' '}
            <span className="font-medium text-blue-600">{maskedEmail}</span>
          </p>
        </div>

        {/* Timer & Attempts */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < attemptsLeft ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
            <span className={`ml-1 font-mono text-xs ${
              attemptsLeft <= 1 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {attemptsLeft} left
            </span>
          </div>
          
          {!isExpired && (
            <span className={`font-mono tabular-nums ${
              timeLeft <= 60 ? 'text-orange-500' : 'text-gray-500'
            }`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          )}
        </div>

        {/* OTP Input */}
        <div className="mb-4">
          <input
            id="otp-input"
            type="text"
            inputMode="numeric"
            maxLength="6"
            className={`w-full px-4 py-3 text-center text-lg font-mono tracking-[0.3em] rounded-lg border-2 bg-white transition-all outline-none ${
              isExpired 
                ? 'border-red-200 bg-red-50/50 cursor-not-allowed' 
                : otp.length === 6
                ? 'border-blue-400 ring-2 ring-blue-100'
                : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
            }`}
            placeholder="000000"
            value={otp}
            onChange={handleOtpChange}
            onKeyDown={handleKeyDown}
            disabled={verifying || isExpired}
            autoComplete="one-time-code"
            spellCheck="false"
          />
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={verifying || otp.length !== 6 || attemptsLeft === 0 || isExpired}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
            verifying || otp.length !== 6 || attemptsLeft === 0 || isExpired
              ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm'
          }`}
        >
          {verifying ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify'
          )}
        </button>

        {/* Messages */}
        {isExpired && (
          <p className="text-xs text-red-500 text-center mt-3 font-medium">
            Code expired. Request a new one below.
          </p>
        )}

        {message && (
          <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <CheckCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Resend */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <button
            onClick={resendOtp}
            disabled={resending || resendCooldown > 0 || initialWait > 0 || verifying}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors font-medium"
          >
            {resending
              ? 'Sending...'
              : initialWait > 0
              ? `Resend available in ${initialWait}s`
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}

VerifyOtp.layout = null;