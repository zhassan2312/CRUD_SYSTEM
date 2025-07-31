import { create } from 'zustand';
import api from '../../lib/api';
import { toast } from 'react-toastify';

const useUserProjectStore = create((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  // Get user's projects
  getProjects: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/user/projects');
      set({ 
        projects: response.data.projects,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Get projects error:', error);
      toast.error('Failed to fetch projects');
    }
  },

  // Create new project
  createProject: async (projectData) => {
    try {
      set({ isLoading: true });
      
      // If there's a project image, use FormData, otherwise use JSON
      if (projectData.projectImage) {
        const formData = new FormData();
        Object.keys(projectData).forEach(key => {
          if (key === 'projectImage' && projectData[key]) {
            formData.append('projectImage', projectData[key]);
          } else if (key === 'students') {
            formData.append('students', JSON.stringify(projectData[key]));
          } else {
            formData.append(key, projectData[key]);
          }
        });

        const response = await api.post('/user/projects', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        set(state => ({
          projects: [response.data.project, ...state.projects],
          isLoading: false
        }));
      } else {
        const response = await api.post('/user/projects', projectData);
        
        set(state => ({
          projects: [response.data.project, ...state.projects],
          isLoading: false
        }));
      }

      toast.success('Project created successfully!');
      return true;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
      return false;
    }
  },

  // Upload project image
  uploadProjectImage: async (projectId, imageFile) => {
    try {
      set({ isLoading: true });
      
      const formData = new FormData();
      formData.append('projectImage', imageFile);

      const response = await api.post(`/user/projects/${projectId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update project in local state
      set(state => ({
        projects: state.projects.map(project => 
          project.id === projectId 
            ? { ...project, imageUrl: response.data.imageUrl }
            : project
        ),
        isLoading: false
      }));

      toast.success('Project image uploaded successfully!');
      return response.data.imageUrl;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to upload image';
      toast.error(message);
      return null;
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      set({ isLoading: true });
      await api.delete(`/user/projects/${projectId}`);
      
      set(state => ({
        projects: state.projects.filter(project => project.id !== projectId),
        isLoading: false
      }));

      toast.success('Project deleted successfully!');
      return true;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to delete project';
      toast.error(message);
      return false;
    }
  },

  // Search projects
  searchProjects: async (searchParams) => {
    try {
      set({ isLoading: true });
      const queryParams = new URLSearchParams(searchParams);
      const response = await api.get(`/user/projects/search?${queryParams}`);
      
      set({ 
        projects: response.data.data.projects,
        isLoading: false 
      });

      return response.data.data;
    } catch (error) {
      set({ isLoading: false });
      console.error('Search projects error:', error);
      toast.error('Failed to search projects');
      return null;
    }
  },

  // Get search filters
  getSearchFilters: async () => {
    try {
      const response = await api.get('/user/projects/search/filters');
      return response.data.filters;
    } catch (error) {
      console.error('Get search filters error:', error);
      return null;
    }
  },

  // Clear projects
  clearProjects: () => {
    set({ projects: [], error: null });
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  }
}));

export default useUserProjectStore;