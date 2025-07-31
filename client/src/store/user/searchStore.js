import { create } from 'zustand';
import api from '../../lib/api';
import { toast } from 'react-toastify';

const useSearchStore = create((set, get) => ({
  // State
  searchResults: [],
  searchFilters: {
    statuses: [],
    supervisors: [],
    dateRange: { earliest: null, latest: null }
  },
  searchCriteria: {
    query: '',
    status: '',
    supervisor: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  },
  isSearching: false,
  isLoadingFilters: false,

  // Actions
  searchProjects: async (criteria = {}, page = 1) => {
    try {
      set({ isSearching: true });
      
      const currentCriteria = get().searchCriteria;
      const searchParams = { ...currentCriteria, ...criteria, page, limit: get().pagination.limit };
      
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/user/projects/search?${queryParams.toString()}`);
      
      set({
        searchResults: response.data.data.projects,
        pagination: response.data.data.pagination,
        searchCriteria: { ...currentCriteria, ...criteria },
        isSearching: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      set({ isSearching: false });
      const message = error.response?.data?.message || 'Search failed';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Load search filters (statuses, supervisors, etc.)
  loadSearchFilters: async () => {
    try {
      set({ isLoadingFilters: true });
      
      const response = await api.get('/user/projects/search/filters');
      
      set({
        searchFilters: response.data.filters,
        isLoadingFilters: false
      });

      return { success: true, filters: response.data.filters };
    } catch (error) {
      set({ isLoadingFilters: false });
      const message = error.response?.data?.message || 'Failed to load search filters';
      console.error('Load filters error:', message);
      return { success: false, error: message };
    }
  },

  // Update search criteria
  updateSearchCriteria: (criteria) => {
    set(state => ({
      searchCriteria: { ...state.searchCriteria, ...criteria }
    }));
  },

  // Clear search results
  clearSearch: () => {
    set({
      searchResults: [],
      searchCriteria: {
        query: '',
        status: '',
        supervisor: '',
        startDate: '',
        endDate: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10
      }
    });
  },

  // Navigate to specific page
  goToPage: async (page) => {
    const { searchCriteria } = get();
    await get().searchProjects(searchCriteria, page);
  },

  // Quick search (for search input)
  quickSearch: async (query) => {
    await get().searchProjects({ query }, 1);
  },

  // Apply filters
  applyFilters: async (filters) => {
    await get().searchProjects(filters, 1);
  },

  // Set items per page
  setItemsPerPage: (limit) => {
    set(state => ({
      pagination: { ...state.pagination, limit }
    }));
  },

  // Highlight text in search results
  highlightText: (text, searchQuery) => {
    if (!searchQuery || !text) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}));

export default useSearchStore;
