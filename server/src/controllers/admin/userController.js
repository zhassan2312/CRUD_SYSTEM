import { admin } from '../../config/firebase.config.js';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

// Get all users with pagination and filtering
export const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = db.collection('users');

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedQuery = query.offset(offset).limit(parseInt(limit));
    const snapshot = await paginatedQuery.get();

    let users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      // Remove sensitive data
      delete userData.password;
      users.push({
        id: doc.id,
        ...userData
      });
    });

    // Apply search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower)
      );
    }

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get users stats
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => users.push(doc.data()));
    
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const inactiveUsers = users.filter(user => user.status === 'inactive').length;
    const students = users.filter(user => user.role === 'user').length;
    const teachers = users.filter(user => user.role === 'teacher').length;
    const admins = users.filter(user => user.role === 'admin').length;

    // Get projects stats
    const projectsSnapshot = await db.collection('projects').get();
    const projects = [];
    projectsSnapshot.forEach(doc => projects.push(doc.data()));
    
    const totalProjects = projects.length;
    const pendingProjects = projects.filter(project => project.status === 'pending' || !project.status).length;
    const approvedProjects = projects.filter(project => project.status === 'approved').length;
    const rejectedProjects = projects.filter(project => project.status === 'rejected').length;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(user => 
      user.createdAt && new Date(user.createdAt) > thirtyDaysAgo
    ).length;
    
    const recentProjects = projects.filter(project => 
      project.createdAt && new Date(project.createdAt) > thirtyDaysAgo
    ).length;

    // Calculate growth rates (mock data for now)
    const userGrowthRate = recentUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(1) : 0;
    const projectGrowthRate = recentProjects > 0 ? ((recentProjects / totalProjects) * 100).toFixed(1) : 0;

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        students,
        teachers,
        admins,
        recent: recentUsers,
        growthRate: userGrowthRate
      },
      projects: {
        total: totalProjects,
        pending: pendingProjects,
        approved: approvedProjects,
        rejected: rejectedProjects,
        recent: recentProjects,
        growthRate: projectGrowthRate
      },
      system: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: user, teacher, admin'
      });
    }

    await db.collection('users').doc(userId).update({
      role,
      updatedAt: FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, suspended'
      });
    }

    await db.collection('users').doc(userId).update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - mark as deleted instead of actually deleting
    await db.collection('users').doc(userId).update({
      status: 'deleted',
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Bulk operations for projects
export const bulkUpdateProjects = async (req, res) => {
  try {
    const { projectIds, action, status, reviewComment } = req.body;

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project IDs array is required'
      });
    }

    const batch = db.batch();
    const results = [];

    for (const projectId of projectIds) {
      const projectRef = db.collection('projects').doc(projectId);
      
      if (action === 'updateStatus' && status) {
        batch.update(projectRef, {
          status,
          reviewComment: reviewComment || `Bulk ${status}`,
          reviewedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        results.push({ projectId, action: 'updated', status });
      } else if (action === 'delete') {
        batch.update(projectRef, {
          status: 'deleted',
          deletedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        results.push({ projectId, action: 'deleted' });
      }
    }

    await batch.commit();

    res.status(200).json({
      success: true,
      message: `Bulk operation completed for ${projectIds.length} projects`,
      results
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operation',
      error: error.message
    });
  }
};

// Get system logs (simple implementation)
export const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;

    // This would typically connect to a logging system
    // For now, we'll return mock data
    const logs = [
      {
        id: '1',
        type: 'user_action',
        message: 'User logged in',
        timestamp: new Date().toISOString(),
        userId: 'user123',
        ip: '192.168.1.1'
      },
      {
        id: '2',
        type: 'system',
        message: 'Database backup completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ip: 'system'
      }
    ];

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        total: logs.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs',
      error: error.message
    });
  }
};
