import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../lib/api';

const useAdminStore = create(
  devtools(
    (set, get) => ({
      // File Statistics State
      fileStats: {
        data: null,
        loading: false,
        error: null,
        lastFetched: null
      },

      // Users Management State
      users: {
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

      // Projects Management State
      allProjects: {
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

      // Dashboard Stats State
      dashboardStats: {
        data: null,
        loading: false,
        error: null,
        lastFetched: null
      },

      // File Statistics Actions
      fetchFileStatistics: async () => {
        const state = get();
        
        // Check if data is fresh (less than 5 minutes old)
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        if (
          state.fileStats.data && 
          state.fileStats.lastFetched && 
          (now - state.fileStats.lastFetched) < fiveMinutes
        ) {
          return state.fileStats.data;
        }

        set((state) => ({
          fileStats: {
            ...state.fileStats,
            loading: true,
            error: null
          }
        }));

        try {
          const response = await api.get('/projects/admin/file-statistics');
          
          set((state) => ({
            fileStats: {
              data: response.data.statistics,
              loading: false,
              error: null,
              lastFetched: Date.now()
            }
          }));

          return response.data.statistics;
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch file statistics';
          
          set((state) => ({
            fileStats: {
              ...state.fileStats,
              loading: false,
              error: errorMessage
            }
          }));

          throw error;
        }
      },

      // Refresh file statistics (force reload)
      refreshFileStatistics: async () => {
        set((state) => ({
          fileStats: {
            ...state.fileStats,
            lastFetched: null
          }
        }));
        
        return get().fetchFileStatistics();
      },

      // Users Management Actions
      fetchUsers: async (page = 1, limit = 10, filters = {}) => {
        set((state) => ({
          users: {
            ...state.users,
            loading: true,
            error: null
          }
        }));

        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
          });

          const response = await api.get(`/admin/users?${params}`);
          
          set((state) => ({
            users: {
              data: response.data.users,
              loading: false,
              error: null,
              lastFetched: Date.now(),
              pagination: {
                page: response.data.pagination?.currentPage || page,
                limit: response.data.pagination?.limit || limit,
                total: response.data.pagination?.total || 0,
                totalPages: response.data.pagination?.totalPages || 0
              }
            }
          }));

          return response.data;
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch users';
          
          set((state) => ({
            users: {
              ...state.users,
              loading: false,
              error: errorMessage
            }
          }));

          throw error;
        }
      },

      // All Projects Management Actions
      fetchAllProjects: async (page = 1, limit = 10, filters = {}) => {
        set((state) => ({
          allProjects: {
            ...state.allProjects,
            loading: true,
            error: null
          }
        }));

        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
          });

          const response = await api.get(`/projects/admin?${params}`);
          
          set((state) => ({
            allProjects: {
              data: response.data.projects,
              loading: false,
              error: null,
              lastFetched: Date.now(),
              pagination: {
                page: response.data.pagination?.currentPage || page,
                limit: response.data.pagination?.limit || limit,
                total: response.data.pagination?.total || 0,
                totalPages: response.data.pagination?.totalPages || 0
              }
            }
          }));

          return response.data;
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch projects';
          
          set((state) => ({
            allProjects: {
              ...state.allProjects,
              loading: false,
              error: errorMessage
            }
          }));

          throw error;
        }
      },

      // Dashboard Statistics Actions
      fetchDashboardStats: async () => {
        const state = get();
        
        // Check if data is fresh (less than 10 minutes old)
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;
        if (
          state.dashboardStats.data && 
          state.dashboardStats.lastFetched && 
          (now - state.dashboardStats.lastFetched) < tenMinutes
        ) {
          return state.dashboardStats.data;
        }

        set((state) => ({
          dashboardStats: {
            ...state.dashboardStats,
            loading: true,
            error: null
          }
        }));

        try {
          const response = await api.get('/admin/dashboard/stats');
          
          set((state) => ({
            dashboardStats: {
              data: response.data.stats,
              loading: false,
              error: null,
              lastFetched: Date.now()
            }
          }));

          return response.data.stats;
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard statistics';
          
          set((state) => ({
            dashboardStats: {
              ...state.dashboardStats,
              loading: false,
              error: errorMessage
            }
          }));

          throw error;
        }
      },

      // Update Project Status Action
      updateProjectStatus: async (projectId, status, reviewComment = '') => {
        try {
          const response = await api.put(`/projects/${projectId}/status`, {
            status,
            reviewComment
          });

          // Update the project in allProjects if it exists
          set((state) => ({
            allProjects: {
              ...state.allProjects,
              data: state.allProjects.data.map(project =>
                project.id === projectId 
                  ? { ...project, status, reviewComment, updatedAt: new Date().toISOString() }
                  : project
              )
            }
          }));

          return response.data;
        } catch (error) {
          throw error;
        }
      },

      // Delete Project Action
      deleteProject: async (projectId) => {
        try {
          const response = await api.delete(`/projects/${projectId}`);

          // Remove project from allProjects
          set((state) => ({
            allProjects: {
              ...state.allProjects,
              data: state.allProjects.data.filter(project => project.id !== projectId)
            }
          }));

          return response.data;
        } catch (error) {
          throw error;
        }
      },

      // Clear specific state sections
      clearUsers: () => set((state) => ({
        users: {
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
      })),

      clearProjects: () => set((state) => ({
        allProjects: {
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
      })),

      clearFileStats: () => set((state) => ({
        fileStats: {
          data: null,
          loading: false,
          error: null,
          lastFetched: null
        }
      })),

      clearDashboardStats: () => set((state) => ({
        dashboardStats: {
          data: null,
          loading: false,
          error: null,
          lastFetched: null
        }
      })),

      // Clear all admin data
      clearAll: () => {
        const { clearUsers, clearProjects, clearFileStats, clearDashboardStats } = get();
        clearUsers();
        clearProjects();
        clearFileStats();
        clearDashboardStats();
      }
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({
        // Only persist non-sensitive data
        fileStats: {
          data: state.fileStats.data,
          lastFetched: state.fileStats.lastFetched
        },
        dashboardStats: {
          data: state.dashboardStats.data,
          lastFetched: state.dashboardStats.lastFetched
        }
      })
    }
  )
);

export default useAdminStore;
