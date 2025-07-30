import { create } from 'zustand';
import api from '../lib/api';
import { toast } from 'react-toastify';

export const useTeacherStore = create((set, get) => ({
  teachers: [],
  isLoading: false,

  // Get all teachers
  getTeachers: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/teachers');
      set({ 
        teachers: response.data.teachers,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Get teachers error:', error);
      toast.error('Failed to fetch teachers');
    }
  },

  // Add new teacher
  addTeacher: async (teacherData) => {
    try {
      set({ isLoading: true });
      
      // If there's a profile image, use FormData, otherwise use JSON
      if (teacherData.profileImage) {
        const formData = new FormData();
        Object.keys(teacherData).forEach(key => {
          if (key === 'profileImage' && teacherData[key]) {
            formData.append('profileImage', teacherData[key]);
          } else {
            formData.append(key, teacherData[key]);
          }
        });

        const response = await api.post('/teachers', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Add new teacher to the list
        set(state => ({
          teachers: [...state.teachers, response.data.teacher],
          isLoading: false
        }));
        
        toast.success('Teacher added successfully!');
        return { success: true };
      } else {
        // Use JSON for teacher without image
        const response = await api.post('/teachers', teacherData);

        // Add new teacher to the list
        set(state => ({
          teachers: [...state.teachers, response.data.teacher],
          isLoading: false
        }));
        
        toast.success('Teacher added successfully!');
        return { success: true };
      }
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to add teacher';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Update teacher
  updateTeacher: async (teacherId, teacherData) => {
    try {
      set({ isLoading: true });
      
      // If there's a profile image, use FormData, otherwise use JSON
      if (teacherData.profileImage) {
        const formData = new FormData();
        Object.keys(teacherData).forEach(key => {
          if (key === 'profileImage' && teacherData[key]) {
            formData.append('profileImage', teacherData[key]);
          } else {
            formData.append(key, teacherData[key]);
          }
        });

        const response = await api.put(`/teachers/${teacherId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Update teacher in the list
        set(state => ({
          teachers: state.teachers.map(teacher => 
            teacher.id === teacherId ? response.data.teacher : teacher
          ),
          isLoading: false
        }));
        
        toast.success('Teacher updated successfully!');
        return { success: true };
      } else {
        // Use JSON for teacher without image
        const response = await api.put(`/teachers/${teacherId}`, teacherData);

        // Update teacher in the list
        set(state => ({
          teachers: state.teachers.map(teacher => 
            teacher.id === teacherId ? response.data.teacher : teacher
          ),
          isLoading: false
        }));
        
        toast.success('Teacher updated successfully!');
        return { success: true };
      }
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to update teacher';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Delete teacher
  deleteTeacher: async (teacherId) => {
    try {
      await api.delete(`/teachers/${teacherId}`);
      
      // Remove teacher from the list
      set(state => ({
        teachers: state.teachers.filter(teacher => teacher.id !== teacherId)
      }));
      
      toast.success('Teacher deleted successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete teacher';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Get teacher by ID
  getTeacher: async (teacherId) => {
    try {
      const response = await api.get(`/teachers/${teacherId}`);
      return { success: true, teacher: response.data.teacher };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch teacher';
      toast.error(message);
      return { success: false, error: message };
    }
  }
}));
