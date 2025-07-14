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
            const response = await api.post('/addUser', user);
            set((state) => ({ users: [...state.users, response.data], loading: false }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    getUser: async (email) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/getUser/${email}`);
            set({ user: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    updateUser: async (email, user) => {
        set({ loading: true, error: null });
        try {
            const response = await api.put(`/updateUser/${email}`, user);
            set((state) => ({
                users: state.users.map((u) => (u.email === email ? response.data : u)),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
    deleteUser: async (email) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/deleteUser/${email}`);
            set((state) => ({
                users: state.users.filter((user) => user.email !== email),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    }

}));

export default useUserStore;