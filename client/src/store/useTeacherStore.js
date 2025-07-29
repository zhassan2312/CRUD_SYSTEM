import { create } from 'zustand';
import api from '../lib/axios';

const useTeacherStore = create((set, get) => ({
  teachers: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  // Fetch all teachers
  fetchTeachers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/teachers');
      set({ teachers: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  },

  // Add new teacher (admin only)
  addTeacher: async (teacherData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('fullName', teacherData.fullName);
      formData.append('email', teacherData.email);
      formData.append('department', teacherData.department);
      formData.append('specialization', teacherData.specialization);
      formData.append('phoneNumber', teacherData.phoneNumber || '');
      formData.append('isAdmin', teacherData.isAdmin || false);
      
      if (teacherData.profilePic) {
        formData.append('profilePic', teacherData.profilePic);
      }

      const response = await api.post('/teachers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh teachers list
      await get().fetchTeachers();
      
      set({ loading: false });
      return { success: true, message: 'Teacher added successfully!' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update teacher
  updateTeacher: async (teacherId, teacherData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('fullName', teacherData.fullName);
      formData.append('email', teacherData.email);
      formData.append('department', teacherData.department);
      formData.append('specialization', teacherData.specialization);
      formData.append('phoneNumber', teacherData.phoneNumber || '');
      formData.append('isAdmin', teacherData.isAdmin || false);
      
      if (teacherData.profilePic && typeof teacherData.profilePic === 'object') {
        formData.append('profilePic', teacherData.profilePic);
      }

      const response = await api.put(`/teachers/${teacherId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh teachers list
      await get().fetchTeachers();
      
      set({ loading: false });
      return { success: true, message: 'Teacher updated successfully!' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Delete teacher
  deleteTeacher: async (teacherId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/teachers/${teacherId}`);
      
      // Refresh teachers list
      await get().fetchTeachers();
      
      set({ loading: false });
      return { success: true, message: 'Teacher deleted successfully!' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },
}));

export default useTeacherStore;
