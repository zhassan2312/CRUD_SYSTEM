import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../../lib/api';

const useAdminDashboardStore = create(
  devtools(
    (set, get) => ({
      // Dashboard Stats State
      dashboardStats: {
        data: null,
        loading: false,
        error: null,
        lastFetched: null
      },

      // System Logs State
      systemLogs: {
        data: [],
        loading: false,
        error: null,
        lastFetched: null,
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        }
      },

      // Get dashboard statistics
      getDashboardStats: async () => {
        try {
          set((state) => ({
            dashboardStats: { ...state.dashboardStats, loading: true, error: null }
          }));

          const response = await api.get('/admin/dashboard/stats');
          
          set((state) => ({
            dashboardStats: {
              data: response.data.stats,
              loading: false,
              error: null,
              lastFetched: new Date().toISOString()
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard statistics';
          set((state) => ({
            dashboardStats: { ...state.dashboardStats, loading: false, error: errorMessage }
          }));
          return { success: false, error: errorMessage };
        }
      },

      // Get system logs
      getSystemLogs: async (params = {}) => {
        const { 
          page = 1, 
          limit = 50, 
          level,
          startDate,
          endDate
        } = params;

        try {
          set((state) => ({
            systemLogs: { ...state.systemLogs, loading: true, error: null }
          }));

          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
          });

          if (level) queryParams.append('level', level);
          if (startDate) queryParams.append('startDate', startDate);
          if (endDate) queryParams.append('endDate', endDate);

          const response = await api.get(`/admin/dashboard/logs?${queryParams}`);
          
          set((state) => ({
            systemLogs: {
              data: response.data.logs,
              loading: false,
              error: null,
              pagination: response.data.pagination,
              lastFetched: new Date().toISOString()
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch system logs';
          set((state) => ({
            systemLogs: { ...state.systemLogs, loading: false, error: errorMessage }
          }));
          return { success: false, error: errorMessage };
        }
      },

      // Refresh dashboard data
      refreshDashboard: async () => {
        try {
          const [statsResult, logsResult] = await Promise.all([
            get().getDashboardStats(),
            get().getSystemLogs()
          ]);

          return { 
            success: statsResult.success && logsResult.success,
            stats: statsResult,
            logs: logsResult
          };
        } catch (error) {
          return { success: false, error: 'Failed to refresh dashboard data' };
        }
      },

      // Reset dashboard stats state
      resetDashboardStats: () => {
        set((state) => ({
          dashboardStats: {
            data: null,
            loading: false,
            error: null,
            lastFetched: null
          }
        }));
      },

      // Reset system logs state
      resetSystemLogs: () => {
        set((state) => ({
          systemLogs: {
            data: [],
            loading: false,
            error: null,
            lastFetched: null,
            pagination: {
              page: 1,
              limit: 50,
              total: 0,
              totalPages: 0
            }
          }
        }));
      },

      // Set system logs pagination
      setSystemLogsPagination: (pagination) => {
        set((state) => ({
          systemLogs: { ...state.systemLogs, pagination: { ...state.systemLogs.pagination, ...pagination } }
        }));
      }
    }),
    {
      name: 'admin-dashboard-store'
    }
  )
);

export default useAdminDashboardStore;
