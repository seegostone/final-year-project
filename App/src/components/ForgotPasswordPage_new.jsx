// frontend/src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import authService from '../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email) {
      setError('Please enter your email address.');
      return false;
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Please use a valid @gmail.com email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      if (result.success) {
        setIsSuccess(true);
        toast.success('Password reset link sent to your email!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Failed to send reset link. Please try again.');
        toast.error('Failed to send reset link');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-[#e2e8f0] p-6 md:p-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-16 h-16 bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Merriweather, serif', color: '#1e2937' }}>
              Check Your Email
            </h2>
            <p className="text-[#475569] mb-6">
              We've sent a password reset link to <span className="font-medium text-[#1e2937]">{email}</span>
            </p>
            <p className="text-sm text-[#64748b] mb-8">
              The link will expire in 24 hours. If you don't see it, check your spam folder.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="w-full bg-[#7B1A1A] text-white py-3 hover:bg-[#5A1313] transition-all font-medium"
            >
              Back to Login
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-[#e2e8f0] px-4 md:px-8 py-4 md:py-6"
      >
        <div className="max-w-7xl mx-auto flex items-center">
          <Link
            to="/login"
            className="flex items-center gap-2 text-[#7B1A1A] no-underline hover:text-[#5A1313] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Login</span>
          </Link>
        </div>
      </motion.header>

      <main className="py-8 md:py-20 px-4 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full bg-white border border-[#e2e8f0] p-6 md:p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-50 flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#7B1A1A]" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Merriweather, serif', color: '#1e2937' }}>
                Reset Password
              </h2>
            </div>
            <p className="text-[#475569] text-sm mb-8">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 px-4 py-3 mb-6"
            >
              <p className="text-sm text-red-700 m-0">{error}</p>
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6">
              <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-[#1e2937] mb-2">
                Email Address
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="forgotPasswordEmail"
                name="email"
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#e2e8f0] bg-white text-[#1e2937] focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all"
                required
                autoComplete="email"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7B1A1A] text-white py-3 hover:bg-[#5A1313] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail size={20} />
                  <span>Send Reset Link</span>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 pt-6 border-t border-[#e2e8f0] text-center"
          >
            <p className="text-sm text-[#475569]">
              Remember your password?{' '}
              <Link to="/login" className="text-[#7B1A1A] font-medium hover:underline no-underline">
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
