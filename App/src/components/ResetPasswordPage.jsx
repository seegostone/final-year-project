// frontend/src/pages/ResetPasswordPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import authService from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const validatePasswords = () => {
    if (!password || !confirmPassword) {
      setError('Please enter both passwords.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePasswords()) return;

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(token, password);
      if (result.success) {
        setIsSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(result.error || 'Failed to reset password.');
        toast.error('Reset failed');
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
              Password Reset
            </h2>
            <p className="text-[#475569] mb-2">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-[#64748b]">
              Redirecting to login...
            </p>
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
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center md:text-left"
          >
            <h1 className="text-lg md:text-xl m-0" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1e2937' }}>
              EstatesComplaint
            </h1>
            <p className="text-xs text-[#475569] mt-1 m-0">
              Makerere University Estates Department
            </p>
          </motion.div>
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
                <Lock className="w-6 h-6 text-[#7B1A1A]" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Merriweather, serif', color: '#1e2937' }}>
                Reset Password
              </h2>
            </div>
            <p className="text-[#475569] text-sm mb-8">
              Create a new password for your account
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
              <label htmlFor="resetPassword" className="block text-sm font-medium text-[#1e2937] mb-2">
                New Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="resetPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-[#e2e8f0] bg-white text-[#1e2937] focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e2937] cursor-pointer transition-colors"
                  style={{ background: 'none', border: 'none', padding: '4px' }}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </motion.button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="resetConfirmPassword" className="block text-sm font-medium text-[#1e2937] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="resetConfirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-[#e2e8f0] bg-white text-[#1e2937] focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e2937] cursor-pointer transition-colors"
                  style={{ background: 'none', border: 'none', padding: '4px' }}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </motion.button>
              </div>
              <p className="text-xs text-[#64748b] mt-2">Minimum 8 characters required</p>
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
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <Lock size={20} />
                  <span>Reset Password</span>
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </main>
    </div>
  );
}
