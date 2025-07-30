import { create } from 'zustand';
import api from '../lib/axios';

const useProjectStore = create((set, get) => ({
  projects: [],
  userProjects: [],
  teachers: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  // Fetch all projects (admin only)
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/projects/all');
      set({ projects: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  },

  // Fetch projects created by current user
  fetchUserProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/projects/user');
      set({ userProjects: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  },

  // Fetch teachers for supervisor dropdown
  fetchTeachers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/teachers');
      set({ teachers: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  },

  // Create new project
  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      
      // Append project fields
      formData.append('title', projectData.title);
      formData.append('description', projectData.description);
      formData.append('sustainability', projectData.sustainability);
      formData.append('supervisor', projectData.supervisor);
      formData.append('coSupervisor', projectData.coSupervisor || '');
      
      // Append students array as JSON string
      formData.append('students', JSON.stringify(projectData.students));
      
      // Append image if present
      if (projectData.image) {
        formData.append('image', projectData.image);
      }

      const response = await api.post('/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh user projects
      await get().fetchUserProjects();
      
      set({ loading: false });
      return { success: true, message: 'Project created successfully!' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      
      // Append project fields
      formData.append('title', projectData.title);
      formData.append('description', projectData.description);
      formData.append('sustainability', projectData.sustainability);
      formData.append('supervisor', projectData.supervisor);
      formData.append('coSupervisor', projectData.coSupervisor || '');
      
      // Append students array as JSON string
      formData.append('students', JSON.stringify(projectData.students));
      
      // Append image if present
      if (projectData.image && typeof projectData.image === 'object') {
        formData.append('image', projectData.image);
      }

      const response = await api.put(`/projects/${projectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh user projects
      await get().fetchUserProjects();
      
      set({ loading: false });
      return { success: true, message: 'Project updated successfully!' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/projects/${projectId}`);
      
      // Refresh user projects
      await get().fetchUserProjects();
      
      set({ loading: false });
      return { success: true, message: 'Project deleted successfully!' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get project by ID
  getProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/projects/${projectId}`);
      set({ loading: false });
      return { success: true, project: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get projects for review (admin/teacher only)
  fetchProjectsForReview: async (status = 'all') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/projects/review/list?status=${status}`);
      set({ projects: response.data.projects, loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update project status (admin/teacher only)
  updateProjectStatus: async (projectId, status, feedback = '') => {
    set({ loading: true, error: null });
    try {
      await api.put(`/projects/${projectId}/status`, { status, feedback });
      
      // Refresh projects list
      await get().fetchProjectsForReview();
      
      set({ loading: false });
      return { success: true, message: 'Project status updated successfully!' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get project status history
  getProjectStatusHistory: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/projects/${projectId}/status-history`);
      set({ loading: false });
      return { success: true, history: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },
}));

export default useProjectStore;
