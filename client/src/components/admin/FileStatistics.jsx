import React, { useState, useEffect } from 'react';
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
  Divider
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
  Archive
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../lib/api';

const FileStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await api.get('/projects/admin/file-statistics');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching file statistics:', error);
        setError(error.response?.data?.message || 'Failed to load file statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
              {stats.totalFiles.toLocaleString()}
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
              {stats.totalStorageMB} MB
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
              <Download sx={{ mr: 2, color: 'info.main' }} />
              <Typography variant="h6">Total Downloads</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
              {stats.totalDownloads.toLocaleString()}
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
              {Object.entries(stats.filesByType)
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
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Downloads */}
      <Grid xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Downloads
            </Typography>
            {stats.recentDownloads.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent downloads
              </Typography>
            ) : (
              <List dense>
                {stats.recentDownloads.slice(0, 8).map((download) => (
                  <ListItem key={download.id}>
                    <ListItemIcon>
                      <Download fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={download.fileName}
                      secondary={`Downloaded ${format(
                        new Date(download.downloadedAt.seconds * 1000),
                        'MMM dd, HH:mm'
                      )}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FileStatistics;
