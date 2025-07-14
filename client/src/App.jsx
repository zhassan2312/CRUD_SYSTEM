import React, { useState, useEffect } from 'react';
import { Edit, Trash2, User, Mail, Lock, Calendar, Users, Plus, X, Check, AlertCircle } from 'lucide-react';
import useUserStore from './store/useUserStore';
// Toast system
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`}>
    {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70">
      <X size={16} />
    </button>
  </div>
);

const App = () => {
  const { users, fetchUsers, addUser, updateUser, deleteUser, loading, error } = useUserStore();
  const [editId, setEditId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: '',
    age: ''
  });
  const [errors, setErrors] = useState({});
  const [hoveredUser, setHoveredUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Minimum 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain upper, lower case letter and number';
    }
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 1) {
      newErrors.age = 'Age must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editId !== null) {
        await updateUser(editId, formData);
        setEditId(null);
        showToast('User updated successfully!', 'success');
      } else {
        await addUser(formData);
        showToast('User added successfully!', 'success');
      }
      setFormData({ name: '', email: '', password: '', gender: '', age: '' });
    } catch (err) {
      showToast('An error occurred while saving user.', 'error');
    }
  };

  const handleEdit = (index) => {
    const user = users[index];
    setFormData({
      name: user.fullName,
      email: user.email,
      password: user.password,
      gender: user.gender,
      age: user.age.toString()
    });
    setEditId(user.id);
  };

  const handleDelete = (index) => {
    setDeleteId(users[index].id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(deleteId);
      setShowConfirm(false);
      setDeleteId(null);
      showToast('User deleted successfully!', 'success');
      if (editId === deleteId) {
        setFormData({ name: '', email: '', password: '', gender: '', age: '' });
        setEditId(null);
      }
    } catch (err) {
      showToast('An error occurred while deleting user.', 'error');
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setDeleteId(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute -left-10 top-20 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse blur-xl"></div>
        <div className="absolute -right-10 top-40 w-64 h-64 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-25 animate-bounce blur-lg"></div>
        <div className="absolute left-1/2 -top-20 w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-15 animate-ping blur-2xl"></div>
        
        {/* Geometric shapes */}
        <div className="absolute left-20 bottom-40 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg opacity-20 animate-spin blur-sm" style={{ animationDuration: '20s' }}></div>
        <div className="absolute right-32 bottom-20 w-24 h-24 bg-gradient-to-r from-green-400 to-teal-400 rounded-full opacity-30 animate-pulse blur-sm"></div>
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 bg-white rounded-full opacity-60 animate-bounce blur-sm`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex-1 p-8 flex items-center justify-center backdrop-blur-sm bg-white/30">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editId !== null ? 'Edit User' : 'Add New User'}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Name Input */}
                <div className="group">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } focus:ring-4 focus:outline-none hover:border-gray-300 transform hover:scale-105 focus:scale-105`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={14} />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Input */}
                <div className="group">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } focus:ring-4 focus:outline-none hover:border-gray-300 transform hover:scale-105 focus:scale-105`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={14} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="group">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } focus:ring-4 focus:outline-none hover:border-gray-300 transform hover:scale-105 focus:scale-105`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={14} />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Gender Select */}
                <div className="group">
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.gender 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } focus:ring-4 focus:outline-none hover:border-gray-300 transform hover:scale-105 focus:scale-105`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={14} />
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Age Input */}
                <div className="group">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="number"
                      placeholder="Age"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.age 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                      } focus:ring-4 focus:outline-none hover:border-gray-300 transform hover:scale-105 focus:scale-105`}
                    />
                  </div>
                  {errors.age && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={14} />
                      {errors.age}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {editId !== null ? <Check size={20} /> : <Plus size={20} />}
                      {editId !== null ? 'Update User' : 'Add User'}
                    </>
                  )}
                </button>

                {/* Cancel Button */}
                {editId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ name: '', email: '', password: '', gender: '', age: '' });
                      setEditId(null);
                      setErrors({});
                    }}
                    className="w-full py-3 rounded-lg font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <X size={20} />
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        

        {/* Right Side - Table */}
        <div className="flex-1 p-8 overflow-x-auto backdrop-blur-sm bg-white/20">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users size={24} />
                User Management ({users.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={48} className="text-gray-300" />
                          <p className="text-lg">No users found</p>
                          <p className="text-sm">Add your first user to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <tr
                        key={user.id}
                        className={`transition-all duration-200 hover:bg-blue-50 ${
                          hoveredUser === idx ? 'bg-blue-50 transform scale-105' : ''
                        }`}
                        onMouseEnter={() => setHoveredUser(idx)}
                        onMouseLeave={() => setHoveredUser(null)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{user.password}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                            user.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{user.age}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(idx)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(idx)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-scale-in">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;