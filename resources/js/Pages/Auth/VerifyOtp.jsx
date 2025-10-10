import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function VerifyOtp() {
  const { props } = usePage();
  const email = props.email || '';
  const maskedEmail = props.maskedEmail || email; // Use masked email from backend
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [initialWait, setInitialWait] = useState(30); // 30 second initial wait

  // OTP expiration countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial wait timer (first 30 seconds)
  useEffect(() => {
    if (initialWait > 0) {
      const timer = setInterval(() => {
        setInitialWait((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [initialWait]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleVerify = () => {
    setVerifying(true);
    setError('');
    setMessage('');

    router.post('/verify-otp', { email, otp }, {
      onError: (errors) => {
        setError(errors.message || 'Invalid OTP.');
        // Decrement attempts left on error
        if (attemptsLeft > 0) {
          setAttemptsLeft(prev => prev - 1);
        }
      },
      onFinish: () => setVerifying(false),
    });
  };

  const resendOtp = async () => {
    setResending(true);
    setError('');
    setMessage('');

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      
      const res = await fetch('/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let data;
      const contentType = res.headers.get('content-type');
      
      // Check if response is JSON
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // Handle non-JSON response (like HTML error pages)
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Invalid response format');
      }

      if (res.ok || res.status === 200) {
        setMessage(data.message || 'OTP resent to your email.');
        setTimeLeft(300);
        setAttemptsLeft(3);
        setResendCooldown(30);
        setInitialWait(0);
      } else if (res.status === 429) {
        setError(data.error || 'Please wait before requesting another OTP.');
      } else {
        setError(data.error || data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Unable to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-indigo-300 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Email Verification</h2>
        <p className="text-gray-600 mb-4 text-center">
          We've sent a 6-digit code to <strong>{maskedEmail}</strong>.
        </p>

        <input
          type="text"
          maxLength={6}
          className="border rounded-md p-3 w-full text-center text-lg tracking-widest mb-2 focus:ring focus:ring-blue-200"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        {/* Attempts Left Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {attemptsLeft > 0 ? (
            <>
              <span className="text-sm text-gray-600">Attempts remaining:</span>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < attemptsLeft ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-sm font-semibold ${
                attemptsLeft === 1 ? 'text-red-500' : 'text-gray-700'
              }`}>
                {attemptsLeft}
              </span>
            </>
          ) : (
            <span className="text-sm text-red-500 font-semibold">
              No attempts left. Please resend OTP.
            </span>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying || !otp || attemptsLeft === 0}
          className={`w-full py-2 rounded-md text-white ${
            verifying || attemptsLeft === 0
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition`}
        >
          {verifying ? 'Verifying...' : 'Verify OTP'}
        </button>

        {timeLeft > 0 ? (
          <p className="text-sm text-gray-500 mt-4 text-center">
            OTP expires in {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        ) : (
          <p className="text-red-500 mt-4 text-center">OTP expired. Please resend.</p>
        )}

        <button
          onClick={resendOtp}
          disabled={resending || resendCooldown > 0 || initialWait > 0}
          className="text-blue-600 text-sm mt-4 underline block mx-auto disabled:text-gray-400 disabled:no-underline"
        >
          {resending
            ? 'Resending...'
            : initialWait > 0
            ? `Wait ${initialWait}s before resending`
            : resendCooldown > 0
            ? `Resend OTP (wait ${resendCooldown}s)`
            : 'Resend OTP'}
        </button>

        {message && <p className="text-green-600 mt-3 text-center">{message}</p>}
        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}

VerifyOtp.layout = null;