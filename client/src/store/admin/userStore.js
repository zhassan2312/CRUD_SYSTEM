import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../../lib/api';

const useAdminUserStore = create(
  devtools(
    (set, get) => ({
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

      // Get all users with pagination and filtering
      getAllUsers: async (params = {}) => {
        const { 
          page = 1, 
          limit = 10, 
          role, 
          status, 
          search,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = params;

        try {
          set((state) => ({
            users: { ...state.users, loading: true, error: null }
          }));

          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
          });

          if (role) queryParams.append('role', role);
          if (status) queryParams.append('status', status);
          if (search) queryParams.append('search', search);

          const response = await api.get(`/admin/users?${queryParams}`);
          
          set((state) => ({
            users: {
              ...state.users,
              data: response.data.users,
              loading: false,
              pagination: response.data.pagination,
              lastFetched: new Date().toISOString()
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch users';
          set((state) => ({
            users: { ...state.users, loading: false, error: errorMessage }
          }));
          return { success: false, error: errorMessage };
        }
      },

      // Update user role
      updateUserRole: async (userId, newRole) => {
        try {
          const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });
          
          // Update local state
          set((state) => ({
            users: {
              ...state.users,
              data: state.users.data.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
              )
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to update user role';
          return { success: false, error: errorMessage };
        }
      },

      // Update user status
      updateUserStatus: async (userId, newStatus) => {
        try {
          const response = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
          
          // Update local state
          set((state) => ({
            users: {
              ...state.users,
              data: state.users.data.map(user => 
                user.id === userId ? { ...user, status: newStatus } : user
              )
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to update user status';
          return { success: false, error: errorMessage };
        }
      },

      // Delete user
      deleteUser: async (userId) => {
        try {
          const response = await api.delete(`/admin/users/${userId}`);
          
          // Remove from local state
          set((state) => ({
            users: {
              ...state.users,
              data: state.users.data.filter(user => user.id !== userId)
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to delete user';
          return { success: false, error: errorMessage };
        }
      },

      // Reset users state
      resetUsersState: () => {
        set((state) => ({
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
        }));
      },

      // Set users pagination
      setUsersPagination: (pagination) => {
        set((state) => ({
          users: { ...state.users, pagination: { ...state.users.pagination, ...pagination } }
        }));
      }
    }),
    {
      name: 'admin-user-store'
    }
  )
);

export default useAdminUserStore;
