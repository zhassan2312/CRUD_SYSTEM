import { create } from 'zustand';
import api from '../../lib/api';
import { toast } from 'react-toastify';

const useUserTeacherStore = create((set, get) => ({
  teachers: [],
  isLoading: false,
  error: null,

  // Get all teachers (view only for users)
  getAllTeachers: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/user/teachers');
      
      set({ 
        teachers: response.data.teachers || [],
        isLoading: false 
      });
      
      return { success: true, teachers: response.data.teachers };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch teachers';
      set({ 
        isLoading: false, 
        error: message 
      });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Get teacher by ID (view only for users)
  getTeacher: async (teacherId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get(`/user/teachers/${teacherId}`);
      
      set({ isLoading: false });
      return { success: true, teacher: response.data.teacher };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch teacher';
      set({ 
        isLoading: false, 
        error: message 
      });
      return { success: false, error: message };
    }
  },

  // Clear teachers
  clearTeachers: () => {
    set({ teachers: [], error: null });
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  }
}));

export default useUserTeacherStore;