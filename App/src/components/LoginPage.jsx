import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!formData.email.endsWith('@mak.ac.ug')) {
      setError('Please use a valid @mak.ac.ug email address.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (formData.email === 'admin@mak.ac.ug' && formData.password === 'Admin123') {
        alert('Login successful! Redirecting to dashboard...');
      } else {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        setError('Invalid email or password. Please try again.');
      }
    }, 1500);
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

          {error && (
            <div className="bg-[#FEE2E2] border border-[#FF5733] px-4 py-3 mb-6" style={{ borderRadius: '0px' }}>
              <p className="text-sm text-[#FF5733] m-0" style={{ fontFamily: 'monospace' }}>
                {error}
              </p>
              {failedAttempts >= 3 && (
                <p className="text-xs text-[#FF5733] mt-2 m-0">
                  Having trouble?{' '}
                  <a href="/forgot-password" className="underline">
                    Reset your password
                  </a>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937]"
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
              <a
                href="/forgot-password"
                className={`text-sm text-[#7B1A1A] no-underline hover:text-[#5A1313] transition-colors ${
                  failedAttempts >= 3 ? 'font-semibold' : ''
                }`}
              >
                Forgot Password?
              </a>
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