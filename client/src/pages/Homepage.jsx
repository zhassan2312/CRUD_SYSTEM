import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/useUserStore';

const Homepage = () => {
  const { user, logout, verifyEmail, resendVerificationEmail, syncEmailVerification, loading, error, clearError } = useUserStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    // This would call a delete user method if implemented
    console.log('Delete account requested');
    setShowDeleteModal(false);
  };

  const handleVerifyEmail = async () => {
    if (user?.email) {
      const result = await verifyEmail(user.email);
      if (result.success) {
        setVerificationMessage(result.message);
      } else {
        setVerificationMessage(result.error);
      }
    }
  };

  const handleResendVerificationEmail = async () => {
    if (user?.email) {
      const result = await resendVerificationEmail(user.email);
      if (result.success) {
        setVerificationMessage('Verification email sent successfully!');
      } else {
        setVerificationMessage(result.error);
      }
    }
  };

  const handleSyncVerification = async () => {
    if (user?.email) {
      const result = await syncEmailVerification(user.email);
      if (result.success) {
        setVerificationMessage('Email verification synced successfully!');
        // Refresh the page or update user state
        window.location.reload();
      } else {
        setVerificationMessage(result.error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {verificationMessage && (
          <div className="mb-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            {verificationMessage}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 text-xl font-semibold">
                      {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.fullName || 'No Name'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                  <span>Age: {user.age || 'Not specified'}</span>
                  <span>Gender: {user.gender || 'Not specified'}</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.emailVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">User ID:</span>
                    <span className="ml-2 text-gray-600">{user.uid}</span>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2 text-gray-600">{user.email}</span>
                  </div>
                  <div>
                    <span className="font-medium">Full Name:</span>
                    <span className="ml-2 text-gray-600">{user.fullName || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Age:</span>
                    <span className="ml-2 text-gray-600">{user.age || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Gender:</span>
                    <span className="ml-2 text-gray-600">{user.gender || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Account Created:</span>
                    <span className="ml-2 text-gray-600">
                      {user.createdAt ?
                        (() => {
                          try {
                            const date = typeof user.createdAt === 'string' || typeof user.createdAt === 'number'
                              ? new Date(user.createdAt)
                              : user.createdAt?.seconds
                                ? new Date(user.createdAt.seconds * 1000)
                                : null;
                            return date && !isNaN(date.getTime()) ? date.toLocaleString() : 'Unknown';
                          } catch {
                            return 'Unknown';
                          }
                        })()
                        : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Last Login:</span>
                    <span className="ml-2 text-gray-600">
                      {user.lastLoginAt ?
                        (() => {
                          try {
                            const date = typeof user.lastLoginAt === 'string' || typeof user.lastLoginAt === 'number'
                              ? new Date(user.lastLoginAt)
                              : user.lastLoginAt?.seconds
                                ? new Date(user.lastLoginAt.seconds * 1000)
                                : null;
                            return date && !isNaN(date.getTime()) ? date.toLocaleString() : 'Unknown';
                          } catch {
                            return 'Unknown';
                          }
                        })()
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Status</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Email Verified:</span>
                    <span className="ml-2 text-gray-600">
                      {user.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Account Created:</span>
                    <span className="ml-2 text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Last Login:</span>
                    <span className="ml-2 text-gray-600">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => navigate('/edit-profile')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Edit Profile
              </button>
              
              {!user.emailVerified && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    If you've already verified your email, try syncing first:
                  </div>
                  <button
                    onClick={handleSyncVerification}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors mr-2"
                  >
                    Sync Verification Status
                  </button>
                  <button
                    onClick={handleVerifyEmail}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mr-2"
                  >
                    Check Email Verification
                  </button>
                  <button
                    onClick={handleResendVerificationEmail}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Resend Verification Email
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
