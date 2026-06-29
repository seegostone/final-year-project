// frontend/src/components/VerifyEmailModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRoleRedirectPath } from '../hooks/useRoleRedirect';
import authService from '../services/api';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { verificationToken } = useParams();
  const [status, setStatus] = useState(verificationToken ? 'pending' : 'idle');
  const [message, setMessage] = useState(
    verificationToken
      ? 'Verifying your email...'
      : 'Enter the verification code sent to your email.'
  );
  const [tokenValue, setTokenValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!verificationToken) return;

      try {
        const result = await authService.verifyEmail(verificationToken);

        if (result.success) {
          const token = result.data.token;
          const user = result.data.user;

          if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            try {
              const expiry = authService.getTokenExpiry(token);
              if (expiry) localStorage.setItem('tokenExpiry', expiry);
            } catch {
              // ignore expiry calculation errors
            }
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');

          setTimeout(() => {
            const role = user?.role || authService.getUserRole();
            const redirectPath = getRoleRedirectPath(role);
            navigate(redirectPath, { replace: true });
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Invalid or expired verification token.');
        }
      } catch {
        setStatus('error');
        setMessage('Unable to verify your email at this time. Please try again later.');
      }
    };

    verify();
  }, [verificationToken, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setInputError('');
    setIsSubmitting(true);

    const code = tokenValue.trim();
    if (!code) {
      setInputError('Verification code cannot be empty.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await authService.verifyEmail(code);

      if (result.success) {
        const token = result.data.token;
        const user = result.data.user;

        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          try {
            const expiry = authService.getTokenExpiry(token);
            if (expiry) localStorage.setItem('tokenExpiry', expiry);
          } catch {
            // ignore expiry calculation errors
          }
        }

        setStatus('success');
        setMessage('Email verified successfully! Redirecting...');

        setTimeout(() => {
          const role = user?.role || authService.getUserRole();
          const redirectPath = getRoleRedirectPath(role);
          navigate(redirectPath, { replace: true });
        }, 2000);
      } else {
        setInputError(result.error || 'Invalid or expired verification token.');
      }
    } catch {
      setInputError('Unable to verify your email at this time. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-lg w-full bg-white border border-[#e2e8f0] p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Merriweather, serif', color: '#1e2937' }}>
          Email Verification
        </h1>
        <p className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-[#475569]'}`}>
          {message}
        </p>
        {!verificationToken && status !== 'success' && (
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-4 text-left">
              <label htmlFor="verificationTokenInput" className="block text-sm font-medium text-slate-700 mb-2">
                Verification code
              </label>
              <input
                id="verificationTokenInput"
                type="text"
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                placeholder="Enter verification code"
                className="w-full px-4 py-3 border border-[#e2e8f0] bg-white text-[#1F2937] focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all"
                disabled={isSubmitting}
                autoComplete="one-time-code"
              />
              {(inputError || status === 'error') && (
                <p className="text-xs text-red-700 mt-2">{inputError || message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#7B1A1A] text-white py-3 rounded-lg hover:bg-[#5A1313] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}
        {verificationToken && status === 'error' && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-3 bg-[#7B1A1A] text-white rounded-lg hover:bg-[#5A1313] transition-all"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailModal({ email, isOpen, onClose, onSuccess}) {
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setError('Verification code has expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    const trimmedToken = verificationToken.trim();
    if (!trimmedToken) {
      setError('Verification code cannot be empty.');
      setIsVerifying(false);
      return;
    }

    try {
      const result = await authService.verifyEmail(trimmedToken);
      console.log(trimmedToken);

      if (result.success) {
        // Store token using the same key `authService` expects
        localStorage.setItem('token', result.data.token);
        // Also set token expiry so isAuthenticated() can validate immediately
        try {
          const expiry = authService.getTokenExpiry(result.data.token);
          if (expiry) localStorage.setItem('tokenExpiry', expiry);
        } catch {
          // ignore expiry calculation errors
        }
        localStorage.setItem('user', JSON.stringify(result.data.user));
        onSuccess(result.data.user);
        onClose();
      } else {
        setError(result.error || 'Invalid or expired verification token');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (timeRemaining > 0) return;

    setResendLoading(true);
    setError('');
    setResendMessage('');

    try {
      const result = await authService.resendVerificationEmail(email);
      console.log(result);
      
      if (result.success) {
        setTimeRemaining(5 * 60); // Reset timer to 5 minutes
        setResendMessage('New verification code sent! Check your email.');
        setTimeout(() => setResendMessage(''), 5000);
      } else {
        setError(result.error || 'Failed to resend verification code');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
      <div className="max-w-md w-full bg-white border border-[#e2e8f0] p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#7B1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl text-center m-0 mb-3" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1F2937' }}>
          Verify Your Email
        </h2>

        <p className="text-sm text-center text-[#6B7280] mb-2">
          We've sent a verification code to:
        </p>

        <p className="text-sm font-medium text-center text-[#1F2937] mb-6" style={{ fontFamily: 'monospace' }}>
          {email}
        </p>

        {/* Timer always shows when modal is open and timeRemaining > 0 */}
        {timeRemaining > 0 && (
          <div className="mb-4 p-2 bg-slate-50 border border-slate-200">
            <p className="text-xs text-center text-[#6B7280] m-0">
              Code expires in: <span className="font-bold text-[#7B1A1A]">{formatTime(timeRemaining)}</span>
            </p>
          </div>
        )}

        {resendMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200">
            <p className="text-xs text-emerald-700 m-0 text-center">{resendMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200">
            <p className="text-xs text-red-700 m-0 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="mb-5">
            <label htmlFor="verificationToken" className="block text-sm font-medium text-slate-700 mb-2">Verification code</label>
            <input
              id="verificationToken"
              name="verificationToken"
              type="text"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
              placeholder="Enter verification code"
              className="w-full px-4 py-3 border border-[#e2e8f0] bg-white text-[#1F2937] text-center text-lg tracking-wider focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all"
              required
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-[#7B1A1A] text-white py-3 hover:bg-[#5A1313] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            style={{ border: 'none' }}
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading || timeRemaining > 0}
            className="w-full bg-white text-[#7B1A1A] border border-[#7B1A1A] py-3 hover:bg-[#7B1A1A] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid #7B1A1A' }}
          >
            {resendLoading 
              ? 'Sending...' 
              : timeRemaining > 0 
                ? `Resend Code (${formatTime(timeRemaining)})` 
                : 'Resend Code'}
          </button>
        </form>

        <p className="text-xs text-center text-[#6B7280] mt-6 m-0">
          Check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
}