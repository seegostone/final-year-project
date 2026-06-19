// frontend/src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateRegistrationForm, calculatePasswordStrength } from '../utils/validation';
import VerifyEmailModal from './VerifyEmailPage';
import { Eye, EyeOff } from 'lucide-react';
import { getRoleRedirectPath } from '../hooks/useRoleRedirect'; // ✅ Import the hook

export default function RegisterPage() {
  const navigate = useNavigate();
  const [passwordStrength, setPasswordStrength] = useState('Weak');
  const [apiError, setApiError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [modalKey, setModalKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Separate state for confirm password

  const {
    values,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validateForm,
    setServerErrors,
  } = useFormValidation(
    {
      fullName: '',
      email: '',
      role: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
    validateRegistrationForm
  );

  const handleInputChange = (field, value) => {
    handleChange(field, value);
    setApiError('');

    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
``
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.register(values);

      if (result.success) {
        setRegisteredEmail(values.email);
        setModalKey(prev => prev + 1);
        setShowVerificationModal(true);
      } else {
        if (result.validationErrors) {
          setServerErrors(result.validationErrors);
        }

        if (result.code === 'USER_EXISTS') {
          setApiError('An account with this email already exists.');
        } else if (result.type === 'NETWORK_ERROR') {
          setApiError('Cannot connect to server. Please check your internet connection.');
        } else {
          setApiError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSuccess = (user) => {
   
    const redirectPath = getRoleRedirectPath(user?.role); // ✅ Use the hook
    navigate(redirectPath);

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

          {apiError && (
            <div className="mb-6 p-3 bg-red-50 border border-[#FF5733]">
              <p className="text-xs text-[#FF5733] m-0" style={{ fontFamily: 'monospace' }}>
                {apiError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="registerFullName" className="block text-sm text-[#1F2937] mb-2">Full Name</label>
              <input
                id="registerFullName"
                name="fullName"
                type="text"
                value={values.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.fullName ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="registerEmail" className="block text-sm text-[#1F2937] mb-2">Email</label>
              <input
                id="registerEmail"
                name="email"
                type="email"
                value={values.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@mak.ac.ug"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.email ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
                autoComplete="email"
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
              <label htmlFor="registerRole" className="block text-sm text-[#1F2937] mb-2">Role</label>
              <select
                id="registerRole"
                name="role"
                value={values.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.role ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A] focus:ring-0`}
                style={{ borderRadius: '0px' }}
              >
                <option value="">Select your role</option>
                <option value="Custodian">Custodian</option>
                <option value="Resident Staff">Resident Staff</option>
                <option value="Warden">Warden</option>
                <option value="Technician">Technician</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.role}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="registerPhoneNumber" className="block text-sm text-[#1F2937] mb-2">Phone Number</label>
              <input
                id="registerPhoneNumber"
                name="phoneNumber"
                type="tel"
                value={values.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="07XX XXX XXX"
                className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                  errors.phoneNumber ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                } focus:outline-none focus:border-[#7B1A1A]`}
                style={{ borderRadius: '0px' }}
                autoComplete="tel"
              />
              {errors.phoneNumber && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Password Field with Toggle */}
            <div className="mb-6">
              <label htmlFor="registerPassword" className="block text-sm text-[#1F2937] mb-2">Password</label>
              <div className="relative">
                <input
                  id="registerPassword"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                    errors.password ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                  } focus:outline-none focus:border-[#7B1A1A] pr-12`}
                  style={{ borderRadius: '0px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
                  style={{ background: 'none', border: 'none', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {values.password && (
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

            {/* Confirm Password Field with Toggle */}
            <div className="mb-8">
              <label htmlFor="registerConfirmPassword" className="block text-sm text-[#1F2937] mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  id="registerConfirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={values.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 border bg-white text-[#1F2937] ${
                    errors.confirmPassword ? 'border-[#FF5733]' : 'border-[rgba(0,0,0,0.1)]'
                  } focus:outline-none focus:border-[#7B1A1A] pr-12`}
                  style={{ borderRadius: '0px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
                  style={{ background: 'none', border: 'none', padding: '4px' }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-[#FF5733] mt-1 m-0" style={{ fontFamily: 'monospace' }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#7B1A1A] text-white py-4 hover:bg-[#5A1313] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '0px', border: 'none' }}
            >
              {isSubmitting ? 'Registering...' : 'Register Account'}
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

      {/* Verification Modal Component */}
      <VerifyEmailModal
        key={modalKey}
        email={registeredEmail}
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}