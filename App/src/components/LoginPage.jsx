// frontend/src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import authService from '../services/api';
import { getRoleRedirectPath } from '../hooks/useRoleRedirect';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sessionExpired = searchParams.get('session') === 'expired';
  const loggedOut = searchParams.get('logout') === 'true';
  const redirectFrom = location.state?.from?.pathname || searchParams.get('redirect');
  const registerLink = redirectFrom ? `/register?redirect=${encodeURIComponent(redirectFrom)}` : '/register';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const role = authService.getUserRole();
      const redirectPath = redirectFrom || getRoleRedirectPath(role);
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectFrom]);

  // Show toast messages
  useEffect(() => {
    if (loggedOut) {
      toast.success('Logged out successfully. Please login again.');
    } else if (sessionExpired) {
      toast.error('Your session has expired. Please login again.');
    }
  }, [loggedOut, sessionExpired]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return false;
    }
    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Please use a valid @gmail.com email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(formData.email, formData.password);

      if (result.success) {
        setFailedAttempts(0);
        toast.success('Login successful!');
        const role = authService.getUserRole();
        const redirectPath = redirectFrom || getRoleRedirectPath(role);
        navigate(redirectPath, { replace: true });
      } else {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        if (result.type === 'UNAUTHORIZED') {
          const message = result.error || 'Invalid email or password. Please try again.';
          setError(message);
          toast.error(message === 'Invalid credentials' ? 'Invalid credentials' : message);
        } else if (result.type === 'NETWORK_ERROR') {
          setError('Cannot connect to server. Please check your internet connection.');
          toast.error('Network error');
        } else if (result.type === 'VALIDATION_ERROR') {
          setError(result.error || 'Please check your input and try again.');
          toast.error('Validation error');
        } else {
          setError(result.error || 'Login failed. Please try again.');
          toast.error('Login failed');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-[#e2e8f0] px-4 md:px-8 py-4 md:py-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <span className="text-xs md:text-sm text-[#1e2937]">New user?</span>
            <Link to={registerLink} className="text-xs md:text-sm text-[#7B1A1A] no-underline hover:text-[#5A1313] transition-colors font-medium">
              Create Account
            </Link>
          </motion.div>
        </div>
      </motion.header>

      <main className="py-8 md:py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-[480px] mx-auto bg-white border border-[#e2e8f0] p-6 md:p-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#fee2e2] rounded-lg flex items-center justify-center">
                <LogIn className="w-6 h-6 text-[#7B1A1A]" />
              </div>
              <h2 className="text-2xl md:text-[32px] m-0" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1e2937' }}>
                Welcome Back
              </h2>
            </div>
            <p className="text-sm text-[#475569] mb-8 md:mb-10 m-0">
              Sign in to your account to submit or track complaints
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 px-4 py-3 mb-6"
            >
              <p className="text-sm text-red-700 m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
              {failedAttempts >= 3 && (
                <p className="text-xs text-[#dc2626] mt-2 m-0">
                  Having trouble?{' '}
                  <Link to="/forgot-password" className="underline font-medium hover:no-underline">
                    Reset your password
                  </Link>
                </p>
              )}
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6">
              <label htmlFor="loginEmail" className="block text-sm text-[#1e2937] mb-2 font-medium">Email Address</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="loginEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-4 py-3 border border-[#e2e8f0] bg-white text-[#1e2937] focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label htmlFor="loginPassword" className="block text-sm text-[#1e2937] mb-2 font-medium">Password</label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="loginPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-[#e2e8f0] bg-white text-[#1e2937] focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
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

            <div className="flex justify-between items-center mb-8">
              <label htmlFor="loginRememberMe" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="loginRememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 accent-[#7B1A1A] cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-sm text-[#1e2937] cursor-pointer">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className={`text-sm text-[#7B1A1A] no-underline hover:text-[#5A1313] transition-colors ${
                  failedAttempts >= 3 ? 'font-semibold' : ''
                }`}
              >
                Forgot Password?
              </Link>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7B1A1A] text-white py-3 hover:bg-[#5A1313] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              style={{ border: 'none' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 pt-6 border-t border-[#e2e8f0]"
          >
            <p className="text-xs text-center text-[#475569] m-0">
              Having login issues?{' '}
              <a href="/support" className="text-[#7B1A1A] no-underline font-medium hover:underline">
                Contact IT Support
              </a>
            </p>
          </motion.div>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[#475569] m-0">
            © 2026 Makerere University Estates Department
          </p>
        </div>
      </main>
    </div>
  );
}