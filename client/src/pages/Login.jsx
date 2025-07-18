import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { login, resendVerificationEmail, syncEmailVerification, loading, error, user, clearError, resetPassword } = useUserStore();
  const [message, setMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    clearError();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else {
      setMessage(result.error);
    }
  };

  const handleResendVerification = async () => {
    if (formData.email) {
      const result = await resendVerificationEmail(formData.email);
      if (result.success) {
        setMessage('Verification email sent successfully! Please check your inbox.');
      } else {
        setMessage(result.error);
      }
    } else {
      setMessage('Please enter your email address first.');
    }
  };

  const handleSyncVerification = async () => {
    if (formData.email) {
      const result = await syncEmailVerification(formData.email);
      if (result.success) {
        setMessage('Email verification synced! You can now try logging in.');
      } else {
        setMessage(result.error);
      }
    } else {
      setMessage('Please enter your email address first.');
    }
  };

  const handleOpenResetModal = () => {
    setShowResetModal(true);
    setResetEmail(formData.email);
    setNewPassword('');
    setResetMessage('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail || !newPassword) {
      setResetMessage('Please enter your email and new password.');
      return;
    }
    const result = await resetPassword(resetEmail, newPassword);
    if (result.success) {
      setResetMessage('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowResetModal(false);
        setResetMessage('');
      }, 2000);
    } else {
      setResetMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(error || message) && (
            <div className={`border px-4 py-3 rounded ${
              error ? 'bg-red-100 border-red-400 text-red-700' : 'bg-blue-100 border-blue-400 text-blue-700'
            }`}>
              {error || message}
            </div>
          )}

          {(error === 'Email not verified' || message === 'Email not verified') && (
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600">
                If you've already verified your email, try syncing first:
              </div>
              <button
                type="button"
                onClick={handleSyncVerification}
                className="text-sm text-green-600 hover:text-green-500 mr-4"
              >
                Sync verification status
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Resend verification email
              </button>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              className="text-indigo-600 hover:text-indigo-500 text-sm"
              onClick={handleOpenResetModal}
            >
              Forgot password?
            </button>
          </div>
        </form>

        {/* Reset Password Modal */}
        {showResetModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                {resetMessage && (
                  <div className={`text-sm p-2 rounded ${
                    resetMessage.includes('successfully') 
                      ? 'bg-green-100 text-green-600 border border-green-300' 
                      : 'bg-red-100 text-red-600 border border-red-300'
                  }`}>
                    {resetMessage}
                  </div>
                )}
                <div className="flex space-x-4 mt-4">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Reset Password
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    onClick={() => setShowResetModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
