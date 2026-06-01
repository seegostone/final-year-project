// frontend/src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import authService from '../services/api';
import { getRoleRedirectPath } from '../hooks/useRoleRedirect';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';
  const loggedOut = searchParams.get('logout') === 'true';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(
    loggedOut ? { type: 'success', text: 'Logged out successfully. Please login again to access your account.' } : 
    sessionExpired ? { type: 'error', text: 'Your session has expired. Please login again.' } : 
    null
  );
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const role = authService.getUserRole();
      const redirectPath = getRoleRedirectPath(role);
      navigate(redirectPath);
    }
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
    if (message) setMessage(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return false;
    }
    if (!formData.email.endsWith('@mak.ac.ug')) {
      setError('Please use a valid @mak.ac.ug email address.');
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
        const role = authService.getUserRole();
        const redirectPath = getRoleRedirectPath(role);
        navigate(redirectPath);
      } else {
        setMessage(null);
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        if (result.type === 'UNAUTHORIZED') {
          setError('Invalid email or password. Please try again.');
        } else if (result.type === 'NETWORK_ERROR') {
          setError('Cannot connect to server. Please check your internet connection.');
        } else if (result.type === 'VALIDATION_ERROR') {
          setError(result.error || 'Please check your input and try again.');
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="bg-white border-b border-[rgba(0,0,0,0.1)] px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <div className="text-center md:text-left">
            <h1 className="text-lg md:text-xl m-0" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700 }}>
              EstatesComplaint
            </h1>
            <p className="text-xs text-[#6B7280] mt-1 m-0">
              Makerere University Estates Department
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm text-[#1F2937]">New user?</span>
            <Link to="/register" className="text-xs md:text-sm text-[#7B1A1A] no-underline hover:text-[#5A1313] transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="py-8 md:py-20 px-4">
        <div className="max-w-[480px] mx-auto bg-white border border-[rgba(0,0,0,0.1)] p-6 md:p-12" style={{ borderRadius: '0px' }}>
          <h2 className="text-2xl md:text-[32px] m-0 mb-2" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1F2937' }}>
            Welcome Back
          </h2>
          <p className="text-sm text-[#6B7280] mb-8 md:mb-10 m-0">
            Sign in to your account to submit or track complaints
          </p>

          {message && (
            <div className={`px-4 py-3 mb-6 border ${
              message.type === 'success' 
                ? 'bg-[#DCFCE7] border-[#22C55E]' 
                : 'bg-[#FEE2E2] border-[#FF5733]'
            }`} style={{ borderRadius: '0px' }}>
              <p className={`text-sm m-0 ${
                message.type === 'success' ? 'text-[#16A34A]' : 'text-[#FF5733]'
              }`} style={{ fontFamily: 'monospace' }}>
                {message.text}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-[#FEE2E2] border border-[#FF5733] px-4 py-3 mb-6" style={{ borderRadius: '0px' }}>
              <p className="text-sm text-[#FF5733] m-0" style={{ fontFamily: 'monospace' }}>
                {error}
              </p>
              {failedAttempts >= 3 && (
                <p className="text-xs text-[#FF5733] mt-2 m-0">
                  Having trouble?{' '}
                  <Link to="/forgot-password" className="underline">
                    Reset your password
                  </Link>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm text-[#1F2937] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@mak.ac.ug"
                className="w-full px-4 py-3 border border-[rgba(0,0,0,0.1)] bg-white text-[#1F2937] focus:outline-none focus:border-[#7B1A1A]"
                style={{ borderRadius: '0px' }}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#1F2937] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-[rgba(0,0,0,0.1)] bg-white text-[#1F2937] focus:outline-none focus:border-[#7B1A1A]"
                  style={{ borderRadius: '0px' }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
                  style={{ background: 'none', border: 'none', padding: '4px' }}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 accent-[#7B1A1A]"
                  disabled={isLoading}
                />
                <span className="text-sm text-[#1F2937]">Remember me</span>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7B1A1A] text-white py-4 hover:bg-[#5A1313] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ borderRadius: '0px', border: 'none' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(0,0,0,0.1)]">
            <p className="text-xs text-center text-[#6B7280] m-0">
              Having login issues?{' '}
              <a href="/support" className="text-[#7B1A1A] no-underline">
                Contact IT Support
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[#6B7280] m-0">
            © 2026 Makerere University Estates Department
          </p>
        </div>
      </main>
    </div>
  );
}