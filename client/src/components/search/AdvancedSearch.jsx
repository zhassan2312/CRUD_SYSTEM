import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Collapse,
  Typography,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSearchStore } from '../../store/user';

const AdvancedSearch = ({ onSearch }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localCriteria, setLocalCriteria] = useState({
    query: '',
    status: '',
    supervisor: '',
    startDate: null,
    endDate: null,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const {
    searchCriteria,
    searchFilters,
    isLoadingFilters,
    loadSearchFilters,
    updateSearchCriteria,
    quickSearch,
    applyFilters,
    clearSearch
  } = useSearchStore();

  useEffect(() => {
    loadSearchFilters();
  }, [loadSearchFilters]);

  useEffect(() => {
    setLocalCriteria(searchCriteria);
  }, [searchCriteria]);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    quickSearch(localCriteria.query);
    if (onSearch) onSearch();
  };

  const handleFilterChange = (field, value) => {
    setLocalCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    const filters = { ...localCriteria };
    
    // Format dates for API
    if (filters.startDate) {
      filters.startDate = filters.startDate.toISOString();
    }
    if (filters.endDate) {
      filters.endDate = filters.endDate.toISOString();
    }

    applyFilters(filters);
    updateSearchCriteria(filters);
    if (onSearch) onSearch();
  };

  const handleClearFilters = () => {
    const clearedCriteria = {
      query: '',
      status: '',
      supervisor: '',
      startDate: null,
      endDate: null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setLocalCriteria(clearedCriteria);
    clearSearch();
    if (onSearch) onSearch();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localCriteria.status) count++;
    if (localCriteria.supervisor) count++;
    if (localCriteria.startDate) count++;
    if (localCriteria.endDate) count++;
    return count;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        {/* Quick Search Bar */}
        <Box component="form" onSubmit={handleQuickSearch} sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search projects by title, description, team members, or supervisor..."
                value={localCriteria.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: localCriteria.query && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('query', '')}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid xs={12} md={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </Grid>
            <Grid xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FilterIcon />}
                endIcon={
                  getActiveFiltersCount() > 0 && (
                    <Chip 
                      label={getActiveFiltersCount()} 
                      size="small" 
                      color="primary" 
                    />
                  )
                }
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Advanced Filters
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Status Filter */}
            <Grid xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={localCriteria.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {searchFilters.statuses?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Supervisor Filter */}
            <Grid xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Supervisor</InputLabel>
                <Select
                  value={localCriteria.supervisor}
                  label="Supervisor"
                  onChange={(e) => handleFilterChange('supervisor', e.target.value)}
                  disabled={isLoadingFilters}
                >
                  <MenuItem value="">All Supervisors</MenuItem>
                  {searchFilters.supervisors?.map((supervisor) => (
                    <MenuItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Start Date Filter */}
            <Grid xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={localCriteria.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            {/* End Date Filter */}
            <Grid xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={localCriteria.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            {/* Sort By Filter */}
            <Grid xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={localCriteria.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="createdAt">Created Date</MenuItem>
                  <MenuItem value="updatedAt">Updated Date</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort Order Filter */}
            <Grid xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={localCriteria.sortOrder}
                  label="Sort Order"
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <MenuItem value="desc">Newest First</MenuItem>
                  <MenuItem value="asc">Oldest First</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Filter Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              startIcon={<FilterIcon />}
            >
              Apply Filters
            </Button>
          </Box>
        </Collapse>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {localCriteria.status && (
                <Chip
                  label={`Status: ${localCriteria.status}`}
                  onDelete={() => handleFilterChange('status', '')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {localCriteria.supervisor && (
                <Chip
                  label={`Supervisor: ${searchFilters.supervisors?.find(s => s.id === localCriteria.supervisor)?.name || localCriteria.supervisor}`}
                  onDelete={() => handleFilterChange('supervisor', '')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {localCriteria.startDate && (
                <Chip
                  label={`From: ${localCriteria.startDate.toLocaleDateString()}`}
                  onDelete={() => handleFilterChange('startDate', null)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {localCriteria.endDate && (
                <Chip
                  label={`To: ${localCriteria.endDate.toLocaleDateString()}`}
                  onDelete={() => handleFilterChange('endDate', null)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default AdvancedSearch;
