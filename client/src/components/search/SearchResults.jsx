import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import ProjectStatusBadge from '../ProjectStatusBadge';
import { useSearchStore } from '../../store/useSearchStore';

const SearchResults = ({ onViewProject }) => {
  const {
    searchResults,
    pagination,
    isSearching,
    searchCriteria,
    goToPage,
    setItemsPerPage,
    highlightText
  } = useSearchStore();

  const handlePageChange = (event, page) => {
    goToPage(page);
  };

  const handleItemsPerPageChange = (event) => {
    const newLimit = event.target.value;
    setItemsPerPage(newLimit);
    goToPage(1); // Reset to first page when changing items per page
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTeamMemberInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  if (isSearching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Searching projects...
        </Typography>
      </Box>
    );
  }

  if (searchResults.length === 0 && (searchCriteria.query || Object.values(searchCriteria).some(val => val && val !== 'createdAt' && val !== 'desc'))) {
    return (
      <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Projects Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search criteria or filters to find more results.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Results Header */}
      {searchResults.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box display="flex" justifyContent="between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="h6">
              Search Results ({pagination.totalResults} project{pagination.totalResults !== 1 ? 's' : ''} found)
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Show:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={pagination.limit}
                  onChange={handleItemsPerPageChange}
                  variant="outlined"
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                per page
              </Typography>
            </Box>
          </Box>

          {/* Search Query Display */}
          {searchCriteria.query && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Searching for: <strong>"{searchCriteria.query}"</strong>
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Search Results Grid */}
      <Grid container spacing={3}>
        {searchResults.map((project) => (
          <Grid xs={12} md={6} lg={4} key={project.id}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Project Image */}
              {project.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={project.imageUrl}
                  alt={project.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                {/* Project Title with Highlighting */}
                <Typography 
                  variant="h6" 
                  gutterBottom
                  dangerouslySetInnerHTML={{
                    __html: highlightText(project.title, searchCriteria.query)
                  }}
                />

                {/* Project Status */}
                <Box sx={{ mb: 2 }}>
                  <ProjectStatusBadge status={project.status} />
                </Box>

                {/* Project Description with Highlighting */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2, height: 60, overflow: 'hidden' }}
                  dangerouslySetInnerHTML={{
                    __html: highlightText(
                      project.description?.substring(0, 150) + (project.description?.length > 150 ? '...' : ''),
                      searchCriteria.query
                    )
                  }}
                />

                {/* Project Metadata */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Created: {formatDate(project.createdAt)}
                  </Typography>
                </Box>

                {/* Supervisor */}
                {project.supervisorName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      dangerouslySetInnerHTML={{
                        __html: `Supervisor: ${highlightText(project.supervisorName, searchCriteria.query)}`
                      }}
                    />
                  </Box>
                )}

                {/* Team Members */}
                {project.teamMembers && project.teamMembers.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Team Members ({project.teamMembers.length})
                      </Typography>
                    </Box>
                    
                    <AvatarGroup max={4} sx={{ mb: 1 }}>
                      {project.teamMembers.map((member, index) => (
                        <Avatar 
                          key={index} 
                          sx={{ width: 32, height: 32, fontSize: '0.75rem' }}
                          title={member.name}
                        >
                          {getTeamMemberInitials(member.name)}
                        </Avatar>
                      ))}
                    </AvatarGroup>

                    {/* Show team member names with highlighting */}
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {project.teamMembers.slice(0, 2).map((member, index) => (
                        <span 
                          key={index}
                          dangerouslySetInnerHTML={{
                            __html: highlightText(member.name, searchCriteria.query)
                          }}
                        />
                      )).reduce((prev, curr, index) => [prev, index > 0 ? ', ' : '', curr], [])}
                      {project.teamMembers.length > 2 && ` +${project.teamMembers.length - 2} more`}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <Divider />

              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => onViewProject && onViewProject(project)}
                >
                  View Details
                </Button>
                
                <Typography variant="caption" color="text.secondary">
                  ID: {project.id.substring(0, 8)}...
                </Typography>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Results Summary */}
      {searchResults.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalResults)} of{' '}
            {pagination.totalResults} results
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
