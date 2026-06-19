// frontend/src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await authService.forgotPassword(email);
      if (result.success) {
        setMessage('Password reset link sent to your email.');
      } else {
        setError(result.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input
            id="forgotPasswordEmail"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border mb-4"
            required
            autoComplete="email"
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && <p className="text-green-500 mb-4">{message}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#7B1A1A] text-white py-3"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <Link to="/login" className="text-center block mt-4 text-[#7B1A1A]">
          Back to Login
        </Link>
      </div>
    </div>
  );
}