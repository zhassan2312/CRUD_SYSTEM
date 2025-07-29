import { create } from 'zustand';
import api from '../lib/axios';

const useStatsStore = create((set, get) => ({
  stats: {
    totalUsers: 0,
    totalTeachers: 0,
    totalProjects: 0,
    uniqueStudents: 0,
    completedProjects: 0,
    pendingProjects: 0,
    inProgressProjects: 0,
    averageStudentsPerProject: 0,
    projectCompletionRate: 0,
  },
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchAdminStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/admin/stats');
      set({ stats: response.data, loading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },
}));

export default useStatsStore;
