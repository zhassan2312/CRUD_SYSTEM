import React, { useState, useEffect, useMemo } from 'react';
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
  Checkbox,
  Chip,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Snackbar,
  Toolbar,
  Divider,
  InputAdornment,
  Collapse,
  TablePagination,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Delete,
  Visibility,
  SelectAll,
  Clear,
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  DateRange,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import { useProjectStore } from '../../store/admin';
import PageContainer from '../../components/ui/PageContainer';

const BulkProjectManagement = () => {
  const { projects, getAllProjects, bulkUpdateProjects } = useProjectStore();

  const allProjects = projects?.data || [];


  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkDialog, setBulkDialog] = useState({
    open: false,
    action: '',
    status: ''
  });
  const [reviewComment, setReviewComment] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    student: '',
    dateFrom: null,
    dateTo: null,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    getAllProjects();
  }, [getAllProjects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...allProjects];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.studentName?.toLowerCase().includes(searchLower) ||
        project.studentEmail?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(project => {
        const status = project.status || 'pending';
        return status === filters.status;
      });
    }

    // Student filter
    if (filters.student) {
      const studentLower = filters.student.toLowerCase();
      filtered = filtered.filter(project =>
        project.studentName?.toLowerCase().includes(studentLower) ||
        project.studentEmail?.toLowerCase().includes(studentLower)
      );
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(project => {
        if (!project.createdAt) return false;
        const projectDate = new Date(project.createdAt);
        
        if (filters.dateFrom && isBefore(projectDate, filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && isAfter(projectDate, filters.dateTo)) {
          return false;
        }
        return true;
      });
    }

    // Sort projects
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];

      if (filters.sortBy === 'createdAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allProjects, filters]);

  // Get paginated projects
  const paginatedProjects = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredProjects.slice(start, end);
  }, [filteredProjects, page, rowsPerPage]);

  // Get unique students for filter dropdown
  const uniqueStudents = useMemo(() => {
    const students = new Set();
    allProjects.forEach(project => {
      if (project.studentName) {
        students.add(project.studentName);
      }
    });
    return Array.from(students).sort();
  }, [allProjects]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filters change
    setSelectedProjects([]); // Clear selection when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      student: '',
      dateFrom: null,
      dateTo: null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPage(0);
    setSelectedProjects([]);
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === paginatedProjects.length) {
      // Deselect all projects on current page
      const pageProjectIds = paginatedProjects.map(p => p.id);
      setSelectedProjects(prev => prev.filter(id => !pageProjectIds.includes(id)));
    } else {
      // Select all projects on current page
      const pageProjectIds = paginatedProjects.map(p => p.id);
      setSelectedProjects(prev => [...new Set([...prev, ...pageProjectIds])]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(project => project.id));
    }
  };

  const handleBulkAction = (action, status = '') => {
    if (selectedProjects.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one project',
        severity: 'warning'
      });
      return;
    }

    setBulkDialog({
      open: true,
      action,
      status
    });
  };

  const executeBulkAction = async () => {
    try {
      await bulkUpdateProjects(
        selectedProjects,
        bulkDialog.action,
        bulkDialog.status,
        reviewComment
      );

      setSnackbar({
        open: true,
        message: `Successfully ${bulkDialog.action === 'updateStatus' ? 'updated' : 'deleted'} ${selectedProjects.length} projects`,
        severity: 'success'
      });

      setSelectedProjects([]);
      setBulkDialog({ open: false, action: '', status: '' });
      setReviewComment('');
      getAllProjects(); // Refresh data
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to perform bulk operation',
        severity: 'error'
      });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const pendingProjects = allProjects.filter(p => p.status === 'pending' || !p.status);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageContainer
        title="Bulk Project Management"
        subtitle="Manage multiple projects efficiently with bulk operations"
        showRefresh
        onRefresh={getAllProjects}
      >
        {/* Filter Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Filters & Search
              </Typography>
              <Button
                variant="outlined"
                startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Box>

            {/* Quick Search */}
            <TextField
              fullWidth
              placeholder="Search by title, description, student name, or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Advanced Filters */}
            <Collapse in={showFilters}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {/* Status Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Student Filter */}
                <Grid size={{sm: 6, md: 3}} >
                  <FormControl fullWidth>
                    <InputLabel>Student</InputLabel>
                    <Select
                      value={filters.student}
                      onChange={(e) => handleFilterChange('student', e.target.value)}
                      label="Student"
                    >
                      <MenuItem value="">All Students</MenuItem>
                      {uniqueStudents.map((student) => (
                        <MenuItem key={student} value={student}>
                          {student}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date From */}
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Date From"
                    value={filters.dateFrom}
                    onChange={(newValue) => handleFilterChange('dateFrom', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                {/* Date To */}
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Date To"
                    value={filters.dateTo}
                    onChange={(newValue) => handleFilterChange('dateTo', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                {/* Sort By */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="createdAt">Date Created</MenuItem>
                      <MenuItem value="title">Title</MenuItem>
                      <MenuItem value="studentName">Student Name</MenuItem>
                      <MenuItem value="status">Status</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Sort Order */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort Order</InputLabel>
                    <Select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      label="Sort Order"
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Clear Filters Button */}
                <Grid item xs={12} sm={6} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Button
                      variant="outlined"
                      onClick={clearFilters}
                      startIcon={<Clear />}
                      fullWidth
                    >
                      Clear All Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Collapse>

            {/* Results Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedProjects.length} of {filteredProjects.length} projects
                {filteredProjects.length !== allProjects.length && (
                  <span> (filtered from {allProjects.length} total)</span>
                )}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Action Toolbar */}
        {selectedProjects.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <Toolbar>
              <Typography variant="h6" sx={{ flex: 1 }}>
                {selectedProjects.length} project(s) selected
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleBulkAction('updateStatus', 'approved')}
                >
                  Approve Selected
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => handleBulkAction('updateStatus', 'rejected')}
                >
                  Reject Selected
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={() => setSelectedProjects([])}
                >
                  Clear Selection
                </Button>
              </Stack>
            </Toolbar>
          </Card>
        )}

        {/* Projects Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Projects ({filteredProjects.length})
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<SelectAll />}
                  onClick={handleSelectAll}
                  size="small"
                >
                  {selectedProjects.filter(id => paginatedProjects.some(p => p.id === id)).length === paginatedProjects.length
                    ? 'Deselect Page'
                    : 'Select Page'
                  }
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SelectAll />}
                  onClick={handleSelectAllFiltered}
                  size="small"
                >
                  {selectedProjects.length === filteredProjects.length ? 'Deselect All' : 'Select All Filtered'}
                </Button>
              </Stack>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedProjects.filter(id => paginatedProjects.some(p => p.id === id)).length > 0 &&
                          selectedProjects.filter(id => paginatedProjects.some(p => p.id === id)).length < paginatedProjects.length
                        }
                        checked={
                          paginatedProjects.length > 0 &&
                          selectedProjects.filter(id => paginatedProjects.some(p => p.id === id)).length === paginatedProjects.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProjects.length > 0 ? (
                    paginatedProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        hover
                        selected={selectedProjects.includes(project.id)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => handleSelectProject(project.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {project.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.description?.substring(0, 60)}...
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {project.studentName || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.status?.charAt(0).toUpperCase() + project.status?.slice(1) || 'Pending'}
                            color={getStatusColor(project.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {project.createdAt ? format(new Date(project.createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton size="small">
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Quick Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setSelectedProjects([project.id]);
                                  handleBulkAction('updateStatus', 'approved');
                                }}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Quick Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedProjects([project.id]);
                                  handleBulkAction('updateStatus', 'rejected');
                                }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          {filteredProjects.length === 0 && allProjects.length > 0
                            ? 'No projects match the current filters'
                            : 'No projects found'
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredProjects.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkDialog.open} onClose={() => setBulkDialog({ open: false, action: '', status: '' })}>
        <DialogTitle>
          Confirm Bulk Action
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 400, pt: 1 }}>
            <Typography sx={{ mb: 2 }}>
              {bulkDialog.action === 'updateStatus'
                ? `Are you sure you want to ${bulkDialog.status} ${selectedProjects.length} selected project(s)?`
                : `Are you sure you want to delete ${selectedProjects.length} selected project(s)?`
              }
            </Typography>
            
            {bulkDialog.action === 'updateStatus' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Review Comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment about this bulk action..."
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog({ open: false, action: '', status: '' })}>
            Cancel
          </Button>
          <Button
            onClick={executeBulkAction}
            variant="contained"
            color={bulkDialog.action === 'delete' ? 'error' : 'primary'}
          >
            {bulkDialog.action === 'updateStatus' ? `${bulkDialog.status?.charAt(0).toUpperCase() + bulkDialog.status?.slice(1)} Projects` : 'Delete Projects'}
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
  </LocalizationProvider>
  );
};

export default BulkProjectManagement;
