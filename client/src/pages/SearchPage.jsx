import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Fade
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import AdvancedSearch from '../components/search/AdvancedSearch';
import SearchResults from '../components/search/SearchResults';
import { useSearchStore } from '../store/searchStore';
import { useAuthStore } from '../store/authStore';

const SearchPage = () => {
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuthStore();
  const { searchResults, searchCriteria } = useSearchStore();

  useEffect(() => {
    // Check if we have any search criteria or results to determine if we've searched
    const hasActiveCriteria = searchCriteria.query || 
      searchCriteria.status || 
      searchCriteria.supervisor || 
      searchCriteria.startDate || 
      searchCriteria.endDate;
    
    setHasSearched(hasActiveCriteria || searchResults.length > 0);
  }, [searchCriteria, searchResults]);

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleViewProject = (project) => {
    // You can implement project view functionality here
    // For now, we'll just log the project
    console.log('Viewing project:', project);
    // Could navigate to project detail page or open a modal
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to={user?.role === 'admin' ? '/admin' : '/'}
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <SearchIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Search Projects
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Projects
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find projects using advanced search and filtering options. Search by title, description, 
          team members, supervisor, status, and more.
        </Typography>
      </Box>

      {/* Search Component */}
      <AdvancedSearch onSearch={handleSearch} />

      {/* Search Results */}
      <Fade in={hasSearched} timeout={500}>
        <Box>
          <SearchResults onViewProject={handleViewProject} />
        </Box>
      </Fade>

      {/* Initial State - Show when no search has been performed */}
      {!hasSearched && (
        <Fade in={!hasSearched} timeout={500}>
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'divider'
            }}
          >
            <SearchIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              Start Your Search
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Use the search bar above to find projects by keywords, or click "Filters" to access 
              advanced filtering options including status, supervisor, date range, and sorting preferences.
            </Typography>
          </Box>
        </Fade>
      )}
    </Container>
  );
};

export default SearchPage;
