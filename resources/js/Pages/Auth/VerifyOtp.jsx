import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function VerifyOtp() {
  const { props } = usePage();
  const email = props.email || '';
  const maskedEmail = props.maskedEmail || email;
  const initialExpiresAt = props.expiresAt || null;
  const initialAttemptsLeft = props.attemptsLeft || 3;
  
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(initialAttemptsLeft);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [initialWait, setInitialWait] = useState(30);
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);

  // Calculate time left from backend expiration time
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(300);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expireTime = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expireTime - now) / 1000));

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

  // Initial wait timer (30 seconds before can resend)
  useEffect(() => {
    if (initialWait <= 0) return;
    
    const timer = setInterval(() => {
      setInitialWait((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [initialWait]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Validate OTP input - only digits, max 8
  const handleOtpChange = (e) => {
    const value = e.target.value;
    
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    const sanitized = value.slice(0, 8);
    setOtp(sanitized);
    
    if (error && sanitized.length > 0) {
      setError('');
    }
  };

  // Prevent multiple submissions
  const handleVerify = (e) => {
    if (verifying) {
      e?.preventDefault();
      return;
    }

    if (isExpired) {
      setError('OTP has expired. Please request a new one.');
      return;
    }

    if (!otp || otp.length !== 8) {
      setError('Please enter a valid 8-digit OTP');
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
      { 
        email, 
        otp 
      },
      {
        onError: (errors) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('OTP verification error:', errors);
          }
          
          setError(errors.message || 'Invalid OTP. Please try again.');
          
          // Decrement attempts on error
          if (attemptsLeft > 0 && !errors.message?.includes('Too many')) {
            setAttemptsLeft((prev) => Math.max(0, prev - 1));
          } else if (errors.message?.includes('Too many')) {
            setAttemptsLeft(0);
          }
          
          setVerifying(false);
        },
        onFinish: () => {
          // Don't reset here - redirect will happen on success
        },
      }
    );
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && otp.length === 8 && !verifying && !isExpired) {
      e.preventDefault();
      handleVerify();
    }
  };

  // Resend OTP using Inertia
  const resendOtp = () => {
    if (!email) {
      setError('Email not found. Please log in again.');
      return;
    }

    if (resending) {
      return;
    }

    setResending(true);
    setError('');
    setMessage('');

    router.post(
      '/resend-otp',
      { email },
      {
        onSuccess: (page) => {
          const expiresAt = page.props.expiresAt;
          const message = page.props.message;
          
          if (expiresAt) {
            setMessage(message || 'OTP resent successfully! Check your email.');
            setExpiresAt(expiresAt);
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
          console.error('Resend OTP error:', errors);
          setError(errors.message || 'Failed to resend OTP. Please try again.');
          setResending(false);
        },
      }
    );
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        {/* Header */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Mail size={32} className="text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">
          Verify Your Email
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          We've sent an <strong>8-digit code</strong> to <br />
          <strong className="text-gray-800">
            {maskedEmail}
          </strong>
        </p>

        {/* OTP Input */}
        <div className="mb-4">
          <label htmlFor="otp-input" className="sr-only">
            OTP Code
          </label>
          <input
            id="otp-input"
            type="text"
            inputMode="numeric"
            maxLength="8"
            className={`border-2 rounded-lg p-4 w-full text-center text-4xl tracking-widest font-bold transition-colors ${
              otp.length === 8
                ? 'border-green-500 focus:ring-2 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            } ${verifying || isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="00000000"
            value={otp}
            onChange={handleOtpChange}
            onKeyDown={handleKeyDown}
            disabled={verifying || isExpired}
            aria-label="OTP Code"
            autoComplete="off"
            spellCheck="false"
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            {otp.length}/8 digits
          </p>
        </div>

        {/* Attempts Left Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 font-medium">Attempts:</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < attemptsLeft 
                    ? 'bg-green-500 scale-100' 
                    : 'bg-gray-300 scale-75'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className={`text-sm font-bold ${
            attemptsLeft === 0 
              ? 'text-red-600' 
              : attemptsLeft === 1 
              ? 'text-orange-600' 
              : 'text-gray-700'
          }`}>
            {attemptsLeft}/3
          </span>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={verifying || otp.length !== 8 || attemptsLeft === 0 || isExpired}
          type="button"
          className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${
            verifying || otp.length !== 8 || attemptsLeft === 0 || isExpired
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
          aria-busy={verifying}
        >
          {verifying ? (
            <span className="flex items-center justify-center gap-2">
              <svg 
                className="animate-spin h-5 w-5" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify OTP'
          )}
        </button>

        {/* Timer */}
        {!isExpired && timeLeft > 0 ? (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Code expires in <strong>{minutes}:{seconds.toString().padStart(2, '0')}</strong>
          </p>
        ) : (
          <p className="text-red-600 mt-4 text-center font-semibold">
            ⏰ OTP expired. Please request a new one.
          </p>
        )}

        {/* Resend Button */}
        <button
          onClick={resendOtp}
          disabled={resending || resendCooldown > 0 || initialWait > 0 || verifying}
          type="button"
          className="text-blue-600 text-sm mt-4 underline block mx-auto disabled:text-gray-400 disabled:no-underline font-medium hover:text-blue-700 transition"
        >
          {resending
            ? 'Resending...'
            : initialWait > 0
            ? `Wait ${initialWait}s before resending`
            : resendCooldown > 0
            ? `Resend (${resendCooldown}s)`
            : 'Resend OTP'}
        </button>

        {/* Success Message */}
        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle 
              size={20} 
              className="text-green-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle 
              size={20} 
              className="text-red-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={() => router.get('/')}
              type="button"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

VerifyOtp.layout = null;