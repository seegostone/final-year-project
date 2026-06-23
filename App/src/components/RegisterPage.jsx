// frontend/src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateRegistrationForm, calculatePasswordStrength } from '../utils/validation';
import VerifyEmailModal from './VerifyEmailPage';
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
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
      specialization: '',
      zone: '',
      skills: '',
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        skills: values.skills,
      };
      const result = await authService.register(payload);

      if (result.success) {
        setRegisteredEmail(values.email);
        setModalKey(prev => prev + 1);
        setShowVerificationModal(true);
        toast.success('Registration successful! Check your email to verify.');
      } else {
        if (result.validationErrors) {
          setServerErrors(result.validationErrors);
        }

        if (result.code === 'USER_EXISTS') {
          setApiError('An account with this email already exists.');
          toast.error('Account already exists');
        } else if (result.type === 'NETWORK_ERROR') {
          setApiError('Cannot connect to server. Please check your internet connection.');
          toast.error('Network error');
        } else {
          setApiError(result.error || 'Registration failed. Please try again.');
          toast.error('Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setApiError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSuccess = (user) => {
   
    const redirectPath = getRoleRedirectPath(user?.role); // ✅ Use the hook
    navigate(redirectPath);

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
            <span className="text-xs md:text-sm text-[#1e2937]">Already have an account?</span>
            <Link to="/login" className="text-xs md:text-sm text-[#7B1A1A] no-underline hover:text-[#5A1313] transition-colors font-medium">
              Sign In
            </Link>
          </motion.div>
        </div>
      </motion.header>

      <main className="py-8 md:py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-[520px] mx-auto bg-white border border-[#e2e8f0] p-6 md:p-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-50 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-[#7B1A1A]" />
              </div>
              <h2 className="text-2xl md:text-[32px] m-0" style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, color: '#1e2937' }}>
                Create Account
              </h2>
            </div>
            <p className="text-sm text-[#475569] mb-8 md:mb-10 m-0">
              Register using your Gmail address so we can send verification and notifications.
            </p>
          </motion.div>

          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 border border-red-200"
            >
              <p className="text-sm text-red-700 m-0">
                {apiError}
              </p>
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6">
              <label htmlFor="registerFullName" className="block text-sm font-medium text-[#1e2937] mb-2">Full Name</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="registerFullName"
                name="fullName"
                type="text"
                value={values.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                  errors.fullName ? 'border-red-200' : 'border-[#e2e8f0]'
                } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all`}
                disabled={isSubmitting}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-xs text-red-700 mt-1 m-0">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="registerEmail" className="block text-sm font-medium text-[#1e2937] mb-2">Email Address</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="registerEmail"
                name="email"
                type="email"
                value={values.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="name@gmail.com"
                className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                  errors.email ? 'border-red-200' : 'border-[#e2e8f0]'
                } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all`}
                disabled={isSubmitting}
                autoComplete="email"
              />
              <p className="text-xs text-[#64748b] mt-1 m-0">
                Must be a valid @gmail.com email address
              </p>
              {errors.email && (
                <p className="text-xs text-red-700 mt-1 m-0">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="registerRole" className="block text-sm font-medium text-[#1e2937] mb-2">Role</label>
              <select
                id="registerRole"
                name="role"
                value={values.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                  errors.role ? 'border-red-200' : 'border-[#e2e8f0]'
                } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all cursor-pointer`}
                disabled={isSubmitting}
              >
                <option value="">Select your role</option>
                <option value="Custodian">Custodian</option>
                <option value="Resident Staff">Resident Staff</option>
                <option value="Warden">Warden</option>
                <option value="Technician">Technician</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-700 mt-1 m-0">
                  {errors.role}
                </p>
              )}
            </div>

            {values.role === 'Technician' && (
              <>
                <div className="mb-6">
                  <label htmlFor="registerSpecialization" className="block text-sm font-medium text-[#1e2937] mb-2">Specialization</label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="registerSpecialization"
                    name="specialization"
                    type="text"
                    value={values.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    placeholder="e.g. Plumbing, Electrical"
                    className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                      errors.specialization ? 'border-red-200' : 'border-[#e2e8f0]'
                    } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all`}
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                  {errors.specialization && (
                    <p className="text-xs text-red-700 mt-1 m-0">
                      {errors.specialization}
                    </p>
                  )}
                </div>
                <div className="mb-6">
                  <label htmlFor="registerZone" className="block text-sm font-medium text-[#1e2937] mb-2">Zone</label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="registerZone"
                    name="zone"
                    type="text"
                    value={values.zone}
                    onChange={(e) => handleInputChange('zone', e.target.value)}
                    placeholder="e.g. North Campus"
                    className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                      errors.zone ? 'border-red-200' : 'border-[#e2e8f0]'
                    } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all`}
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                  {errors.zone && (
                    <p className="text-xs text-red-700 mt-1 m-0">
                      {errors.zone}
                    </p>
                  )}
                </div>
                <div className="mb-6">
                  <label htmlFor="registerSkills" className="block text-sm font-medium text-[#1e2937] mb-2">Skills</label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="registerSkills"
                    name="skills"
                    type="text"
                    value={values.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    placeholder="e.g. plumbing, pipe fitting"
                    className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                      errors.skills ? 'border-red-200' : 'border-[#e2e8f0]'
                    } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all`}
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                  <p className="text-xs text-[#64748b] mt-1 m-0">
                    Separate skills with commas.
                  </p>
                  {errors.skills && (
                    <p className="text-xs text-red-700 mt-1 m-0">
                      {errors.skills}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="mb-6">
              <label htmlFor="registerPhoneNumber" className="block text-sm font-medium text-[#1e2937] mb-2">Phone Number</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                id="registerPhoneNumber"
                name="phoneNumber"
                type="tel"
                value={values.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="07XX XXX XXX"
                className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                  errors.phoneNumber ? 'border-red-200' : 'border-[#e2e8f0]'
                } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all`}
                disabled={isSubmitting}
                autoComplete="tel"
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-700 mt-1 m-0">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="registerPassword" className="block text-sm font-medium text-[#1e2937] mb-2">Password</label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="registerPassword"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                    errors.password ? 'border-red-200' : 'border-[#e2e8f0]'
                  } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all pr-12`}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e2937] cursor-pointer transition-colors"
                  style={{ background: 'none', border: 'none', padding: '4px' }}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </motion.button>
              </div>
              {values.password && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[#64748b]">Strength:</span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === 'Strong'
                        ? 'text-emerald-600'
                        : passwordStrength === 'Medium'
                        ? 'text-amber-600'
                        : 'text-red-700'
                    }`}
                  >
                    {passwordStrength}
                  </span>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-700 mt-1 m-0">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="mb-8">
              <label htmlFor="registerConfirmPassword" className="block text-sm font-medium text-[#1e2937] mb-2">Confirm Password</label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  id="registerConfirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={values.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 border bg-white text-[#1e2937] ${
                    errors.confirmPassword ? 'border-red-200' : 'border-[#e2e8f0]'
                  } focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#eef2f7] transition-all pr-12`}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e2937] cursor-pointer transition-colors"
                  style={{ background: 'none', border: 'none', padding: '4px' }}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </motion.button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-700 mt-1 m-0">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#7B1A1A] text-white py-3 hover:bg-[#5A1313] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              style={{ border: 'none' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Register Account</span>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-center text-[#475569] mt-8 m-0"
          >
            By registering, you agree to our{' '}
            <a href="/terms" className="text-[#7B1A1A] no-underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#7B1A1A] no-underline">
              Privacy Policy
            </a>
          </motion.p>
        </motion.div>
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