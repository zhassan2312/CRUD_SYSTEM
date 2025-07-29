import { create } from 'zustand';
import api from '../lib/axios';

const useUserStore = create((set, get) => ({
    user: null,
    users: [],
    loading: false,
    error: null,
    
    setUser: (user) => set({ user }),
    clearError: () => set({ error: null }),
    
    // Initialize auth by checking if user has valid session cookie
    initializeAuth: async () => {
        set({ loading: true, error: null });
        try {
            // Try to get user data from server using cookie
            const response = await api.get('/user/checkAuth');
            set({ user: response.data, loading: false });
        } catch (error) {
            // No valid session, user not authenticated
            set({ user: null, loading: false });
        }
    },
    
    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/user/login', { email, password });
            if (response.data.user) {
                set({ user: response.data.user, loading: false });
                return { success: true, message: response.data.message };
            } else {
                set({ error: 'Login failed', loading: false });
                return { success: false, error: 'Login failed' };
            }
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    logout: async () => {
        set({ loading: true });
        try {
            await api.post('/user/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            set({ user: null, loading: false });
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
            await api.put('/user/resetPassword', { email, newPassword });
            set({ loading: false });
            return { success: true, message: 'Password reset successfully!' };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },

    // Admin functions
    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/user/getAllUsers');
            set({ users: response.data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || error.message, loading: false });
        }
    },
    
    deleteUser: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/user/deleteUser/${id}`);
            const { user } = get();
            // If deleting current user, logout
            if (user?.id === id) {
                set({ user: null });
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

    updateUserRole: async (userId, role) => {
        set({ loading: true, error: null });
        try {
            await api.put(`/user/updateUserRole/${userId}`, { role });
            // Refresh the user list after updating
            const response = await api.get('/user/getAllUsers');
            set({ users: response.data, loading: false });
            return { success: true, message: 'User role updated successfully!' };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    }
}));

export default useUserStore;
