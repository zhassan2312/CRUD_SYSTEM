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
  AdminPanelSettings,
  PersonAdd,
  Edit,
  Delete,
  Search,
  FilterList,
  School,
  Person,
  Block,
  CheckCircle,
  Warning,
  Security,
} from '@mui/icons-material';
import { format } from 'date-fns';
import useAdminStore from '../../store/adminStore';
import PageContainer from '../../components/ui/PageContainer';
import StatsCard from '../../components/ui/StatsCard';

const AdminsManagement = () => {
  const {
    users,
    fetchUsers,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    dashboardStats,
    fetchDashboardStats
  } = useAdminStore();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    role: 'admin', // Only show admins
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
    // Always filter for admins only
    const adminFilters = { ...filters, role: 'admin' };
    fetchUsers(page, 10, adminFilters);
    fetchDashboardStats();
  }, [page, filters, fetchUsers, fetchDashboardStats]);

  const handleFilterChange = (field, value) => {
    if (field === 'role') return; // Prevent changing role filter for admins page
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
          message: 'Admin role updated successfully',
          severity: 'success'
        });
      } else if (type === 'status') {
        await updateUserStatus(user.id, user.status);
        setSnackbar({
          open: true,
          message: 'Admin status updated successfully',
          severity: 'success'
        });
      }
      setEditDialog({ open: false, user: null, type: '' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update admin',
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(deleteDialog.user.id);
      setSnackbar({
        open: true,
        message: 'Admin deleted successfully',
        severity: 'success'
      });
      setDeleteDialog({ open: false, user: null });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete admin',
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
      title="Admin Management"
      subtitle="Manage administrator accounts, roles, and permissions"
      showRefresh
      onRefresh={() => {
        const adminFilters = { ...filters, role: 'admin' };
        fetchUsers(page, 10, adminFilters);
        fetchDashboardStats();
      }}
    >
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Admins"
            value={userStats.admins || 0}
            icon={<AdminPanelSettings />}
            trend="System administrators"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Admins"
            value={Math.floor((userStats.admins || 0) * 0.95)}
            icon={<CheckCircle />}
            trend="95% active rate"
            trendUp={true}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Security Level"
            value="High"
            icon={<Security />}
            trend="All admins verified"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Last Login"
            value="Today"
            icon={<CheckCircle />}
            trend="Recent activity"
            trendUp={true}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search administrators..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                  setFilters({ role: 'admin', status: '', search: '' });
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Administrators ({users.pagination?.total || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              color="error"
              onClick={() => {
                // Navigate to add admin page or open dialog
                console.log('Add admin clicked');
              }}
            >
              Add Admin
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Administrator</TableCell>
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
                      <Typography>Loading administrators...</Typography>
                    </TableCell>
                  </TableRow>
                ) : users.data?.length > 0 ? (
                  users.data.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={user.profilePicture}
                            alt={user.firstName}
                            sx={{ width: 40, height: 40, bgcolor: 'error.main' }}
                          >
                            {user.firstName?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{user.username}
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
                          label={user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
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
                          <Tooltip title="Delete Admin">
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
                      <Typography color="text.secondary">No administrators found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {users.pagination?.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={users.pagination.totalPages}
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
          Edit Administrator {editDialog.type === 'role' ? 'Role' : 'Status'}
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
          <Button onClick={handleSaveEdit} variant="contained" color="error">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete administrator "{deleteDialog.user?.firstName} {deleteDialog.user?.lastName}"?
            This action cannot be undone and may affect system operations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete Admin
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

export default AdminsManagement;
