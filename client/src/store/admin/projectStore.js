import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../../lib/api';

const useAdminProjectStore = create(
  devtools(
    (set, get) => ({
      // Projects Management State
      projects: {
        data: [],
        loading: false,
        error: null,
        lastFetched: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      },

      // File Statistics State
      fileStats: {
        data: null,
        loading: false,
        error: null,
        lastFetched: null
      },

      // Get all projects (Admin only)
      getAllProjects: async (params = {}) => {
        const { 
          page = 1, 
          limit = 10, 
          status, 
          search,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = params;

        try {
          set((state) => ({
            projects: { ...state.projects, loading: true, error: null }
          }));

          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
          });

          if (status) queryParams.append('status', status);
          if (search) queryParams.append('search', search);

          const response = await api.get(`/admin/projects?${queryParams}`);
          
          set((state) => ({
            projects: {
              ...state.projects,
              data: response.data.projects,
              loading: false,
              pagination: response.data.pagination || {
                page: parseInt(page),
                limit: parseInt(limit),
                total: response.data.projects?.length || 0,
                totalPages: Math.ceil((response.data.projects?.length || 0) / limit)
              },
              lastFetched: new Date().toISOString()
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch projects';
          set((state) => ({
            projects: { ...state.projects, loading: false, error: errorMessage }
          }));
          return { success: false, error: errorMessage };
        }
      },

      // Update project status
      updateProjectStatus: async (projectId, statusData) => {
        try {
          const response = await api.put(`/admin/projects/${projectId}/status`, statusData);
          
          // Update local state
          set((state) => ({
            projects: {
              ...state.projects,
              data: state.projects.data.map(project => 
                project.id === projectId 
                  ? { ...project, status: statusData.status, lastReviewedBy: statusData.reviewerName }
                  : project
              )
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to update project status';
          return { success: false, error: errorMessage };
        }
      },

      // Bulk update projects
      bulkUpdateProjects: async (projectIds, updateData) => {
        try {
          const response = await api.put('/admin/projects/bulk', {
            projectIds,
            ...updateData
          });
          
          // Refresh projects list after bulk update
          await get().getAllProjects();

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to bulk update projects';
          return { success: false, error: errorMessage };
        }
      },

      // Get file statistics
      getFileStatistics: async () => {
        try {
          set((state) => ({
            fileStats: { ...state.fileStats, loading: true, error: null }
          }));

          const response = await api.get('/admin/projects/file-statistics');
          
          set((state) => ({
            fileStats: {
              ...state.fileStats,
              data: response.data.statistics,
              loading: false,
              lastFetched: new Date().toISOString()
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch file statistics';
          set((state) => ({
            fileStats: { ...state.fileStats, loading: false, error: errorMessage }
          }));
          return { success: false, error: errorMessage };
        }
      },

      // Reset projects state
      resetProjectsState: () => {
        set((state) => ({
          projects: {
            data: [],
            loading: false,
            error: null,
            lastFetched: null,
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0
            }
          }
        }));
      },

      // Reset file stats state
      resetFileStatsState: () => {
        set((state) => ({
          fileStats: {
            data: null,
            loading: false,
            error: null,
            lastFetched: null
          }
        }));
      },

      // Set projects pagination
      setProjectsPagination: (pagination) => {
        set((state) => ({
          projects: { ...state.projects, pagination: { ...state.projects.pagination, ...pagination } }
        }));
      }
    }),
    {
      name: 'admin-project-store'
    }
  )
);

export default useAdminProjectStore;
