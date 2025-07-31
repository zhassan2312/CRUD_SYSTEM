import { admin } from '../../config/firebase.config.js';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

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

    // Get projects stats
    const projectsSnapshot = await db.collection('projects').get();
    const projects = [];
    projectsSnapshot.forEach(doc => projects.push(doc.data()));
    
    const totalProjects = projects.length;
    const pendingProjects = projects.filter(p => p.status === 'pending').length;
    const approvedProjects = projects.filter(p => p.status === 'approved').length;
    const rejectedProjects = projects.filter(p => p.status === 'rejected').length;
    const underReviewProjects = projects.filter(p => p.status === 'under-review').length;

    // Get teachers stats
    const teachersSnapshot = await db.collection('teachers').get();
    const totalTeachers = teachersSnapshot.size;

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(user => 
      new Date(user.createdAt) > thirtyDaysAgo
    ).length;
    
    const recentProjects = projects.filter(project => 
      new Date(project.createdAt) > thirtyDaysAgo
    ).length;

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        students,
        teachers,
        recent: recentUsers
      },
      projects: {
        total: totalProjects,
        pending: pendingProjects,
        approved: approvedProjects,
        rejected: rejectedProjects,
        underReview: underReviewProjects,
        recent: recentProjects
      },
      teachers: {
        total: totalTeachers
      },
      overview: {
        totalUsers,
        totalProjects,
        totalTeachers,
        recentActivity: recentUsers + recentProjects
      }
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
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

// Get system logs (simplified version)
export const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level, startDate, endDate } = req.query;

    // Note: This is a simplified implementation
    // In a real application, you might want to store logs in a dedicated collection
    // or integrate with a proper logging service
    
    const logs = [
      {
        id: '1',
        level: 'info',
        message: 'User logged in successfully',
        timestamp: new Date().toISOString(),
        userId: 'user123',
        action: 'login'
      },
      {
        id: '2',
        level: 'info',
        message: 'Project created',
        timestamp: new Date().toISOString(),
        userId: 'user456',
        action: 'project_create'
      },
      {
        id: '3',
        level: 'warning',
        message: 'Failed login attempt',
        timestamp: new Date().toISOString(),
        userId: 'unknown',
        action: 'login_failed'
      }
    ];

    // Apply filters
    let filteredLogs = logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(endDate)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    const totalPages = Math.ceil(filteredLogs.length / limit);

    res.status(200).json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total: filteredLogs.length,
        limit: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
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
