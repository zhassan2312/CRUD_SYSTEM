// Role-based access control middleware

export const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ 
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} access required` 
      });
    }
    next();
  };
};

// Specific role middlewares
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const requireTeacherOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Teacher or admin access required' });
  }
  next();
};
