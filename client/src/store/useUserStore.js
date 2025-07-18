import {create} from 'zustand';
import api from '../lib/axios';

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
            const response = await api.get('/getAllUsers');
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

            await api.post('/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh the user list after adding
            const response = await api.get('/getAllUsers');
            set({ users: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    getUser: async (id) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/getUser/${id}`);
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

            await api.put(`/updateUser/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh the user list after updating
            const response = await api.get('/getAllUsers');
            set({ users: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    deleteUser: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/deleteUser/${id}`);
            const { user } = get();
            // If deleting current user, logout
            if (user?.id === id) {
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                set({ user: null, token: null });
            }
            // Refresh the user list after deleting
            const response = await api.get('/getAllUsers');
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
            const response = await api.post('/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                set({ user: response.data.user, token: response.data.token, loading: false });
                return { success: true };
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
                await api.get(`/logout/${user.id}`);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
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
            
            if (userData.profilePic) {
                formData.append('profilePic', userData.profilePic);
            }

            const response = await api.post('/register', formData, {
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
            const response = await api.post('/verifyEmail', { email });
            
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
            const response = await api.post('/resendVerificationEmail', { email });
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
            const response = await api.post('/syncEmailVerification', { email });
            set({ loading: false });
            return { success: true, message: response.data };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    resetPassword: async (userId, newPassword) => {
        set({ loading: true, error: null });
        try {
            await api.put(`/resetPassword/${userId}`, { newPassword });
            set({ loading: false });
            return { success: true, message: 'Password reset successfully!' };
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
        }
    },
    
    initializeAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            set({ token });
            // Validate token and fetch user from backend
            api.get('/checkAuth')
                .then(response => {
                    set({ user: response.data });
                    localStorage.setItem('user', JSON.stringify(response.data));
                })
                .catch(error => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    set({ user: null, token: null });
                });
        } else {
            set({ user: null, token: null });
        }
    },

}));

export default useUserStore;