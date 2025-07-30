import { create } from 'zustand';
import api from '../lib/api';
import { toast } from 'react-toastify';

export const useProjectStore = create((set, get) => ({
  projects: [],
  allProjects: [], // For admin
  isLoading: false,
  

  // Get user's projects
  getProjects: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/projects');
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

  // Admin: Get all projects
  getAllProjects: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/projects/admin');
      set({ 
        allProjects: response.data.projects,
        projects: response.data.projects, // Also update projects for the component
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Get all projects error:', error);
      toast.error('Failed to fetch all projects');
    }
  },

  // Admin: Update project status with review
  updateProjectStatus: async (projectId, reviewData) => {
    try {
      set({ isLoading: true });
      const response = await api.put(`/projects/${projectId}/status`, reviewData);
      
      // Update project status in both lists
      const updatedProject = response.data.project;
      set(state => ({
        allProjects: state.allProjects.map(project => 
          project.id === projectId 
            ? { ...project, ...updatedProject }
            : project
        ),
        projects: state.projects.map(project => 
          project.id === projectId 
            ? { ...project, ...updatedProject }
            : project
        ),
        isLoading: false
      }));
      
      const statusMessage = {
        'approved': 'approved',
        'rejected': 'rejected', 
        'revision-required': 'marked for revision',
        'under-review': 'moved to under review',
        'pending': 'reset to pending'
      };
      
      toast.success(`Project ${statusMessage[reviewData.status]} successfully!`);
      return true;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to update project status';
      toast.error(message);
      return false;
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

        const response = await api.post('/projects', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Add new project to the list
        set(state => ({
          projects: [response.data.project, ...state.projects],
          isLoading: false
        }));
        
        toast.success('Project created successfully!');
        return { success: true };
      } else {
        // Use JSON for project without image
        const response = await api.post('/projects', projectData);

        // Add new project to the list
        set(state => ({
          projects: [response.data.project, ...state.projects],
          isLoading: false
        }));
        
        toast.success('Project created successfully!');
        return { success: true };
      }
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Upload project image
  uploadProjectImage: async (projectId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('projectImage', imageFile);

      const response = await api.post(`/projects/${projectId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update project in the list
      set(state => ({
        projects: state.projects.map(project => 
          project.id === projectId 
            ? { ...project, imageUrl: response.data.imageUrl }
            : project
        )
      }));
      
      toast.success('Image uploaded successfully!');
      return { success: true, imageUrl: response.data.imageUrl };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload image';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`);
      
      // Remove project from both lists
      set(state => ({
        projects: state.projects.filter(project => project.id !== projectId),
        allProjects: state.allProjects.filter(project => project.id !== projectId)
      }));
      
      toast.success('Project deleted successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete project';
      toast.error(message);
      return { success: false, error: message };
    }
  }
}));
