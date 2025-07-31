import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../../lib/api';

const useAdminTeacherStore = create(
  devtools(
    (set, get) => ({
      // Teachers Management State
      teachers: {
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

      // Get all teachers
      getAllTeachers: async (params = {}) => {
        const { 
          page = 1, 
          limit = 10, 
          search,
          department,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = params;

        try {
          set((state) => ({
            teachers: { ...state.teachers, loading: true, error: null }
          }));

          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
          });

          if (search) queryParams.append('search', search);
          if (department) queryParams.append('department', department);

          const response = await api.get(`/user/teachers?${queryParams}`);
          
          set((state) => ({
            teachers: {
              ...state.teachers,
              data: response.data.teachers,
              loading: false,
              pagination: response.data.pagination || {
                page: parseInt(page),
                limit: parseInt(limit),
                total: response.data.teachers?.length || 0,
                totalPages: Math.ceil((response.data.teachers?.length || 0) / limit)
              },
              lastFetched: new Date().toISOString()
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch teachers';
          set((state) => ({
            teachers: { ...state.teachers, loading: false, error: errorMessage }
          }));
          return { success: false, error: errorMessage };
        }
      },

      // Add new teacher
      addTeacher: async (teacherData) => {
        try {
          const formData = new FormData();
          
          // Append text fields
          Object.keys(teacherData).forEach(key => {
            if (key !== 'profileImage' && teacherData[key] !== undefined) {
              formData.append(key, teacherData[key]);
            }
          });

          // Append profile image if provided
          if (teacherData.profileImage) {
            formData.append('profileImage', teacherData.profileImage);
          }

          const response = await api.post('/admin/teachers', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Add to local state
          set((state) => ({
            teachers: {
              ...state.teachers,
              data: [response.data.teacher, ...state.teachers.data]
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to add teacher';
          return { success: false, error: errorMessage };
        }
      },

      // Update teacher
      updateTeacher: async (teacherId, teacherData) => {
        try {
          const formData = new FormData();
          
          // Append text fields
          Object.keys(teacherData).forEach(key => {
            if (key !== 'profileImage' && teacherData[key] !== undefined) {
              formData.append(key, teacherData[key]);
            }
          });

          // Append profile image if provided
          if (teacherData.profileImage) {
            formData.append('profileImage', teacherData.profileImage);
          }

          const response = await api.put(`/admin/teachers/${teacherId}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Update local state
          set((state) => ({
            teachers: {
              ...state.teachers,
              data: state.teachers.data.map(teacher => 
                teacher.id === teacherId ? response.data.teacher : teacher
              )
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to update teacher';
          return { success: false, error: errorMessage };
        }
      },

      // Delete teacher
      deleteTeacher: async (teacherId) => {
        try {
          const response = await api.delete(`/admin/teachers/${teacherId}`);
          
          // Remove from local state
          set((state) => ({
            teachers: {
              ...state.teachers,
              data: state.teachers.data.filter(teacher => teacher.id !== teacherId)
            }
          }));

          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to delete teacher';
          return { success: false, error: errorMessage };
        }
      },

      // Get teacher by ID
      getTeacher: async (teacherId) => {
        try {
          const response = await api.get(`/user/teachers/${teacherId}`);
          return { success: true, data: response.data };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch teacher';
          return { success: false, error: errorMessage };
        }
      },

      // Reset teachers state
      resetTeachersState: () => {
        set((state) => ({
          teachers: {
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

      // Set teachers pagination
      setTeachersPagination: (pagination) => {
        set((state) => ({
          teachers: { ...state.teachers, pagination: { ...state.teachers.pagination, ...pagination } }
        }));
      }
    }),
    {
      name: 'admin-teacher-store'
    }
  )
);

export default useAdminTeacherStore;
