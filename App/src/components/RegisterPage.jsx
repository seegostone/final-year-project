import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('Weak');

  const validateEmail = (email) => {
    return email.endsWith('@mak.ac.ug') && email.includes('@');
  };

  const calculatePasswordStrength = (password) => {
    if (password.length < 8) return 'Weak';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteriaCount = [hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;

    if (criteriaCount >= 3 && password.length >= 12) return 'Strong';
    if (criteriaCount >= 2 && password.length >= 8) return 'Medium';
    return 'Weak';
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return password.length >= 8 && hasUpperCase && hasNumber;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }

    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email must be a valid @mak.ac.ug address';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^07\d{8}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with 1 uppercase and 1 number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      setShowSuccess(true);
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
            <span className="text-xs md:text-sm text-[#1F2937]">Already have an account?</span>
            <Link to="/login" className="text-xs md:text-sm text-[#7B1A1A] no-underline hover:text-[#5A1313] transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="py-8 md:py-20 px-4">
        <div className="max-w-[520px] mx-auto bg-white border border-[rgba(0,0,0,0.1)] p-6 md:p-12" style={{ borderRadius: '0px' }}>
          <h2 className="text-2xl md:text-[32px] m-0 mb-2" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1F2937' }}>
            Create an Account
          </h2>
          <p className="text-sm text-[#6B7280] mb-8 md:mb-10 m-0">
            Register using your university email credentials
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm text-[#1F2937] mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.fullName ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
              />
              {errors.fullName && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-[#1F2937] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@mak.ac.ug"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.email ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
              />
              <p className="text-xs text-[#6B7280] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                Must be a valid @mak.ac.ug email address
              </p>
              {errors.email && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-[#1F2937] mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.role ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
              >
                <option value="">Select your role</option>
                <option value="resident_staff">Resident Staff</option>
                <option value="warden">Warden</option>
                <option value="custodian">Custodian</option>
              </select>
              {errors.role && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.role}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-[#1F2937] mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="07XX XXX XXX"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.phoneNumber ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-[#1F2937] mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a strong password"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.password ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
              />
              {formData.password && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[#6B7280]">Strength:</span>
                  <span
                    className={`text-xs ${
                      passwordStrength === 'Strong'
                        ? 'text-[#10B981]'
                        : passwordStrength === 'Medium'
                        ? 'text-[#F59E0B]'
                        : 'text-[#FF5733]'
                    }`}
                  >
                    {passwordStrength}
                  </span>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.password}
                </p>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm text-[#1F2937] mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.confirmPassword ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#7B1A1A] text-white py-4 hover:bg-[#5A1313] transition-colors"
              style={{ borderRadius: '0px', border: 'none' }}
            >
              Register Account
            </button>
          </form>

          <p className="text-xs text-center text-[#6B7280] mt-8 m-0">
            By registering, you agree to our{' '}
            <a href="/terms" className="text-[#7B1A1A] no-underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#7B1A1A] no-underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white border border-[rgba(0,0,0,0.1)] p-6 md:p-10 max-w-md w-full" style={{ borderRadius: '0px' }}>
            <h3 className="text-xl md:text-2xl m-0 mb-4" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1F2937' }}>
              Verification Email Sent
            </h3>
            <p className="text-sm text-[#1F2937] mb-6 md:mb-8 m-0">
              Verification email sent to <span style={{ fontFamily: 'monospace' }}>{formData.email}</span>.
              Please check your inbox to activate your account.
            </p>
            <Link
              to="/login"
              className="block w-full bg-white text-[#7B1A1A] border-2 border-[#7B1A1A] py-3 hover:bg-[#7B1A1A] hover:text-white transition-colors text-center no-underline"
              style={{ borderRadius: '0px' }}
            >
              Return to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
