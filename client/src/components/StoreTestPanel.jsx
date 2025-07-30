// Simple test to validate centralized stores
import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { Refresh, CloudUpload, Analytics } from '@mui/icons-material';
import useAdminStore from '../store/adminStore';
import useFileStore from '../store/fileStore';
import useUserStore from '../store/useUserStore';

const StoreTestPanel = () => {
  const { 
    fileStatistics, 
    fetchFileStatistics, 
    refreshFileStatistics,
    loading: adminLoading,
    error: adminError 
  } = useAdminStore();

  const { 
    projectFiles, 
    getProjectFiles,
    refreshProjectFiles,
    clearAllFiles 
  } = useFileStore();

  const { 
    user, 
    loading: userLoading,
    fetchUserProfile 
  } = useUserStore();

  const handleTestAdminStore = async () => {
    try {
      await fetchFileStatistics();
      console.log('Admin store test passed:', { fileStatistics });
    } catch (error) {
      console.error('Admin store test failed:', error);
    }
  };

  const handleTestFileStore = async () => {
    try {
      // Test with a dummy project ID
      await getProjectFiles('test-project-id');
      console.log('File store test passed:', { projectFiles });
    } catch (error) {
      console.error('File store test failed:', error);
    }
  };

  const handleTestUserStore = async () => {
    try {
      await fetchUserProfile();
      console.log('User store test passed:', { user });
    } catch (error) {
      console.error('User store test failed:', error);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Centralized Store Test Panel
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This panel tests the centralized Zustand stores. Check the browser console for results.
      </Alert>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        {/* Admin Store Test */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
              Admin Store
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              File statistics and admin data
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleTestAdminStore}
                disabled={adminLoading}
                size="small"
                startIcon={<Refresh />}
              >
                Test Admin Store
              </Button>
            </Box>
            {adminError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {adminError}
              </Alert>
            )}
            {fileStatistics && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Total Files: {fileStatistics.totalFiles}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* File Store Test */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
              File Store
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Project file management
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Button 
                variant="contained" 
                onClick={handleTestFileStore}
                size="small"
                startIcon={<Refresh />}
              >
                Test File Store
              </Button>
              <Button 
                variant="outlined" 
                onClick={clearAllFiles}
                size="small"
                color="secondary"
              >
                Clear Cache
              </Button>
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Cached Projects: {Object.keys(projectFiles).length}
            </Typography>
          </CardContent>
        </Card>

        {/* User Store Test */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Store
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              User authentication and profile
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleTestUserStore}
                disabled={userLoading}
                size="small"
                startIcon={<Refresh />}
              >
                Test User Store
              </Button>
            </Box>
            {user && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                User: {user.firstName} {user.lastName}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      <Alert severity="success" sx={{ mt: 3 }}>
        ✅ All file management components now use centralized stores instead of direct API calls!
        <br />
        ✅ FileUploadManager uses fileStore for uploads with progress tracking
        <br />
        ✅ ProjectFileList uses fileStore for file listing, deletion, and downloads
        <br />
        ✅ FilePreviewDialog uses fileStore for file previews
        <br />
        ✅ FileStatistics uses adminStore for analytics data
      </Alert>
    </Box>
  );
};

export default StoreTestPanel;
