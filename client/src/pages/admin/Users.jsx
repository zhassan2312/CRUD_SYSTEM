import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Edit,
  Delete,
  Search,
  FilterList,
  Refresh,
  AdminPanelSettings,
  School,
  Person,
  Block,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useUserStore, useDashboardStore } from '../../store/admin';
import PageContainer from '../../components/ui/PageContainer';
import StatsCard from '../../components/ui/StatsCard';

const UsersManagement = () => {
  const {
    users,
    getAllUsers,
    updateUserRole,
    updateUserStatus,
    deleteUser
  } = useUserStore();

  console.log("users", users);
  const {
    dashboardStats,
    getDashboardStats
  } = useDashboardStore();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    user: null,
    type: '' // 'role' or 'status'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    user: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Fetch only users with role 'user' (students)
    const userFilters = { ...filters, role: filters.role || 'user' };
    getAllUsers({ page, limit: 10, ...userFilters });
    getDashboardStats();
  }, [page, filters, getAllUsers, getDashboardStats]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleEditUser = (user, type) => {
    setEditDialog({
      open: true,
      user,
      type
    });
  };

  const handleSaveEdit = async () => {
    try {
      const { user, type } = editDialog;
      if (type === 'role') {
        await updateUserRole(user.id, user.role);
        setSnackbar({
          open: true,
          message: 'User role updated successfully',
          severity: 'success'
        });
      } else if (type === 'status') {
        await updateUserStatus(user.id, user.status);
        setSnackbar({
          open: true,
          message: 'User status updated successfully',
          severity: 'success'
        });
      }
      setEditDialog({ open: false, user: null, type: '' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update user',
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(deleteDialog.user.id);
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
      setDeleteDialog({ open: false, user: null });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete user',
        severity: 'error'
      });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings />;
      case 'teacher':
        return <School />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'teacher':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'inactive':
        return <Warning />;
      case 'suspended':
        return <Block />;
      default:
        return null;
    }
  };

  const userStats = dashboardStats?.data?.users || {};

  return (
    <PageContainer
      title="Student Management"
      subtitle="Manage student accounts, roles, and permissions"
      showRefresh
      onRefresh={() => {
        const userFilters = { ...filters, role: filters.role || 'user' };
        getAllUsers({ page, limit: 10, ...userFilters });
        getDashboardStats();
      }}
    >
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={userStats.total || 0}
            icon={<People />}
            trend={`+${userStats.recent || 0} this month`}
            trendUp={true}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Students"
            value={userStats.students || 0}
            icon={<Person />}
            trend={`${((userStats.students / userStats.total) * 100 || 0).toFixed(1)}% of total`}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Teachers"
            value={userStats.teachers || 0}
            icon={<School />}
            trend={`${((userStats.teachers / userStats.total) * 100 || 0).toFixed(1)}% of total`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Users"
            value={userStats.active || 0}
            icon={<CheckCircle />}
            trend={`${((userStats.active / userStats.total) * 100 || 0).toFixed(1)}% active`}
            trendUp={true}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="user">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setFilters({ role: '', status: '', search: '' });
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Users ({users?.pagination?.total || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => {
                // Navigate to add user page or open dialog
                console.log('Add user clicked');
              }}
            >
              Add User
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : users.data?.length > 0 ? (
                  users.data.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={user.profilePicture}
                            alt={user.fullName}
                            sx={{ width: 40, height: 40 }}
                          >
                            {user.fullName?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {user.fullName} 
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{user.fullName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(user.status)}
                          label={
                            user.status
                              ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                              : 'N/A'
                          }
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? (() => {
                          try {
                            return format(new Date(user.createdAt), 'MMM dd, yyyy');
                          } catch {
                            return 'N/A';
                          }
                        })() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Role">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user, 'role')}
                            >
                              <AdminPanelSettings fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Status">
                            <IconButton
                              size="small"
                              onClick={() => handleEditUser(user, 'status')}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteDialog({ open: true, user })}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {users?.pagination?.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={users?.pagination?.totalPages || 1}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null, type: '' })}>
        <DialogTitle>
          Edit User {editDialog.type === 'role' ? 'Role' : 'Status'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, pt: 1 }}>
            {editDialog.type === 'role' ? (
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editDialog.user?.role || ''}
                  label="Role"
                  onChange={(e) =>
                    setEditDialog(prev => ({
                      ...prev,
                      user: { ...prev.user, role: e.target.value }
                    }))
                  }
                >
                  <MenuItem value="user">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editDialog.user?.status || ''}
                  label="Status"
                  onChange={(e) =>
                    setEditDialog(prev => ({
                      ...prev,
                      user: { ...prev.user, status: e.target.value }
                    }))
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null, type: '' })}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{deleteDialog.user?.fullName} {deleteDialog.user?.lastName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default UsersManagement;
