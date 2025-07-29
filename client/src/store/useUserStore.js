import {create} from 'zustand';
import api from '../lib/axios';
import authMiddleware from '../middleware/authMiddleware';

const useUserStore = create((set, get) => ({
    user: null,
    users: [],
    loading: false,
    error: null,
    token: localStorage.getItem('token'),
    setUser: (user) => set({ user }),
    clearError: () => set({ error: null }),
    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/user/getAllUsers');
            set({ users: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    addUser: async (user) => {
        set({ loading: true, error: null });
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('fullName', user.name);
            formData.append('email', user.email);
            formData.append('password', user.password);
            formData.append('gender', user.gender);
            formData.append('age', parseInt(user.age));

            // Add profile pic file if present
            if (user.profilePic) {
                formData.append('profilePic', user.profilePic);
            }

            await api.post('/user/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh the user list after adding
            const response = await api.get('/user/getAllUsers');
            set({ users: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    getUser: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/user/getUser/${id}`);
            set({ user: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    updateUser: async (id, user) => {
        set({ loading: true, error: null });
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('fullName', user.name);
            formData.append('email', user.email);
            formData.append('password', user.password);
            formData.append('gender', user.gender);
            formData.append('age', parseInt(user.age));

            // Add profile pic file if present
            if (user.profilePic) {
                formData.append('profilePic', user.profilePic);
            }

            await api.put(`/user/updateUser/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh the user list after updating
            const response = await api.get('/user/getAllUsers');
            set({ users: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    deleteUser: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/user/deleteUser/${id}`);
            const { user } = get();
            // If deleting current user, logout
            if (user?.id === id) {
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                set({ user: null, token: null });
            }
            // Refresh the user list after deleting
            const response = await api.get('/user/getAllUsers');
            set({ users: response.data, loading: false });
            return { success: true, message: 'User deleted successfully!' };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/user/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                set({ user: response.data.user, token: response.data.token, loading: false });
                return { success: true, user: response.data.user };
            } else {
                set({ error: 'No token received', loading: false });
                return { success: false, error: 'No token received' };
            }
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    logout: async () => {
        try {
            const { user } = get();
            if (user?.id) {
                await api.get(`/user/logout/${user.id}`);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            set({ user: null, token: null });
        }
    },
    
    register: async (userData) => {
        set({ loading: true, error: null });
        try {
            const formData = new FormData();
            formData.append('fullName', userData.fullName);
            formData.append('email', userData.email);
            formData.append('password', userData.password);
            formData.append('gender', userData.gender);
            formData.append('age', parseInt(userData.age));
            formData.append('role', userData.role || 'user');
            
            if (userData.profilePic) {
                formData.append('profilePic', userData.profilePic);
            }

            const response = await api.post('/user/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            set({ loading: false });
            return { success: true, message: 'Registration successful! Please check your email to verify your account.' };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    verifyEmail: async (email) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/user/verifyEmail', { email });
            
            if (response.data.user) {
                set({ user: response.data.user });
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            set({ loading: false });
            return { success: true, message: response.data.message };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    resendVerificationEmail: async (email) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/user/resendVerificationEmail', { email });
            set({ loading: false });
            return { success: true, message: response.data };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    // Sync email verification status
    syncEmailVerification: async (email) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/user/syncEmailVerification', { email });
            set({ loading: false });
            return { success: true, message: response.data };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    resetPassword: async (email, newPassword) => {
        set({ loading: true, error: null });
        try {
            await api.put(`/user/resetPassword`, { email, newPassword });
            set({ loading: false });
            return { success: true, message: 'Password reset successfully!' };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    initializeAuth: () => {
        set({ loading: true });
        
        const result = authMiddleware.initializeAuth();
        result.then(({ success, user, error }) => {
            if (success && user) {
                set({ user, token: localStorage.getItem('token'), loading: false });
            } else {
                console.error('Auth initialization failed:', error);
                authMiddleware.clearAuthData();
                set({ user: null, token: null, loading: false });
            }
        }).catch(error => {
            console.error('Auth initialization error:', error);
            set({ user: null, token: null, loading: false });
        });
    },

    // Check user permissions for specific roles
    hasPermission: (requiredRoles) => {
        const { user } = get();
        if (!user) return false;
        
        return authMiddleware.hasPermission(user.role, requiredRoles);
    },

    // Refresh user data from backend
    refreshUserData: async () => {
        set({ loading: true });
        try {
            const result = await authMiddleware.refreshUserData();
            if (result.success) {
                set({ user: result.user, loading: false });
                return { success: true };
            } else {
                set({ error: result.error, loading: false });
                return { success: false, error: result.error };
            }
        } catch (error) {
            set({ error: error.message, loading: false });
            return { success: false, error: error.message };
        }
    },

    // Admin operations
    updateUserRole: async (userId, newRole) => {
        set({ loading: true, error: null });
        try {
                        const response = await api.put(`/user/updateUserRole/${userId}`, { role: newRole });
            
            // Update the users array in state
            const { users } = get();
            const updatedUsers = users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            );
            
            set({ users: updatedUsers, loading: false });
            return { success: true, message: 'User role updated successfully!' };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },

}));

export default useUserStore;