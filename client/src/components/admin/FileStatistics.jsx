import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Storage,
  InsertDriveFile,
  Download,
  TrendingUp,
  AttachFile,
  Description,
  Image,
  PictureAsPdf,
  Archive,
  Refresh
} from '@mui/icons-material';
import { useDashboardStore } from '../../store/admin';

const FileStatistics = () => {
  // Use centralized admin store
  const { 
    fileStats, 
    fetchFileStatistics, 
    refreshFileStatistics 
  } = useDashboardStore();
  
  const { data: stats, loading, error } = fileStats;

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image color="primary" />;
    if (mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive color="warning" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <Description color="info" />;
    return <AttachFile />;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMimeType = (mimeType) => {
    const typeMap = {
      'image/jpeg': 'JPEG Images',
      'image/png': 'PNG Images',
      'image/gif': 'GIF Images',
      'image/webp': 'WebP Images',
      'application/pdf': 'PDF Documents',
      'application/msword': 'Word Documents',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Documents (DOCX)',
      'application/vnd.ms-excel': 'Excel Spreadsheets',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheets (XLSX)',
      'application/vnd.ms-powerpoint': 'PowerPoint Presentations',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentations (PPTX)',
      'text/plain': 'Text Files',
      'text/csv': 'CSV Files',
      'application/zip': 'ZIP Archives',
      'application/x-rar-compressed': 'RAR Archives'
    };
    return typeMap[mimeType] || mimeType;
  };

  useEffect(() => {
    fetchFileStatistics();
  }, [fetchFileStatistics]);

  const handleRefresh = async () => {
    try {
      await refreshFileStatistics();
    } catch (error) {
      console.error('Error refreshing file statistics:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No file statistics available
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header with refresh button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          File Statistics
        </Typography>
        <Tooltip title="Refresh Statistics">
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            color="primary"
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
      {/* Overview Cards */}
      <Grid xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <InsertDriveFile sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">Total Files</Typography>
            </Box>
            <Typography variant="h3" color="primary.main">
              {stats.totalFiles?.toLocaleString() || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Storage sx={{ mr: 2, color: 'success.main' }} />
              <Typography variant="h6">Storage Used</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {stats.totalStorageFormatted}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBytes(stats.totalStorageBytes)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ mr: 2, color: 'info.main' }} />
              <Typography variant="h6">Recent Uploads</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
              {stats.recentUploads?.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last 7 days
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* File Types Breakdown */}
      <Grid xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Files by Type
            </Typography>
            <List dense>
              {stats.filesByType ? Object.entries(stats.filesByType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([mimeType, count]) => (
                <ListItem key={mimeType}>
                  <ListItemIcon>
                    {getFileIcon(mimeType)}
                  </ListItemIcon>
                  <ListItemText
                    primary={formatMimeType(mimeType)}
                    secondary={`${count} file${count > 1 ? 's' : ''}`}
                  />
                  <Chip
                    label={count}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </ListItem>
              )) : (
                <ListItem>
                  <ListItemText
                    primary="No file data available"
                    secondary="No files have been uploaded yet"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Projects by File Count */}
      <Grid xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Projects by File Count
            </Typography>
            {!stats.topProjects || stats.topProjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No projects with files
              </Typography>
            ) : (
              <List dense>
                {stats.topProjects.slice(0, 8).map((project, index) => (
                  <ListItem key={project.projectId}>
                    <ListItemIcon>
                      <InsertDriveFile fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Project ${project.projectId.substring(0, 8)}...`}
                      secondary={`${project.fileCount} file${project.fileCount !== 1 ? 's' : ''}`}
                    />
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    </>
  );
};

export default FileStatistics;
