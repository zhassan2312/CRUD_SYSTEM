import {create} from 'zustand';
import api from '../lib/axios';

const useUserStore = create((set) => ({
    user: null,
    users: [],
    loading: false,
    error: null,
    setUser: (user) => set({ user }),
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

            await api.post('/addUser', formData, {
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
            // Refresh the user list after deleting
            const response = await api.get('/getAllUsers');
            set({ users: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    }

}));

export default useUserStore;