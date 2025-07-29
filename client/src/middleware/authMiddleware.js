import api from '../lib/axios';

/**
 * Authentication and Role Management Middleware
 */
class AuthMiddleware {
  constructor() {
    this.userCache = null;
    this.roleCache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize authentication from stored tokens
   */
  async initializeAuth() {
    try {
      const token = localStorage.getItem('token');
      const cachedUser = localStorage.getItem('user');
      
      if (token && cachedUser) {
        const userData = JSON.parse(cachedUser);
        
        // Set authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Validate token with backend
        const response = await api.get('/checkAuth');
        const freshUserData = {
          ...response.data,
          role: response.data.role || 'user'
        };
        
        // Update cache
        this.updateCache(freshUserData);
        localStorage.setItem('user', JSON.stringify(freshUserData));
        
        return { success: true, user: freshUserData };
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuthData();
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'No authentication data found' };
  }

  /**
   * Fetch and cache user role from backend
   */
  async fetchUserRole(userId) {
    try {
      // Check cache first
      if (this.isCacheValid() && this.roleCache) {
        return { success: true, role: this.roleCache };
      }

      const response = await api.get(`/getUser/${userId}`);
      const role = response.data.role || 'user';
      
      // Update cache
      this.roleCache = role;
      this.cacheTimestamp = Date.now();
      
      return { success: true, role };
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has required permissions
   */
  hasPermission(userRole, requiredRoles) {
    if (!userRole || !requiredRoles) return false;
    
    const roleHierarchy = {
      admin: 3,
      teacher: 2,
      user: 1
    };

    const userLevel = roleHierarchy[userRole] || 1;
    const requiredLevels = requiredRoles.map(role => roleHierarchy[role] || 1);
    const minRequired = Math.min(...requiredLevels);

    return userLevel >= minRequired;
  }

  /**
   * Update user cache
   */
  updateCache(userData) {
    this.userCache = userData;
    this.roleCache = userData.role;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    if (!this.cacheTimestamp) return false;
    return (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Clear all authentication data
   */
  clearAuthData() {
    this.userCache = null;
    this.roleCache = null;
    this.cacheTimestamp = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }

  /**
   * Get cached user data
   */
  getCachedUser() {
    if (this.isCacheValid() && this.userCache) {
      return this.userCache;
    }
    
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (error) {
        console.error('Failed to parse cached user:', error);
      }
    }
    
    return null;
  }

  /**
   * Refresh user data from backend
   */
  async refreshUserData() {
    try {
      const response = await api.get('/checkAuth');
      const userData = {
        ...response.data,
        role: response.data.role || 'user'
      };
      
      this.updateCache(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

export default authMiddleware;
