import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Chip
} from '@mui/material';
import {
  Close,
  Download,
  Fullscreen,
  ZoomIn,
  ZoomOut
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useFileStore } from '../../store/user';

const FilePreviewDialog = ({ open, onClose, file, projectId }) => {
  const [imageZoom, setImageZoom] = useState(100);

  const { 
    previewFile: previewData, 
    previewLoading: loading, 
    previewError: error, 
    previewFile: previewFileAction, 
    downloadFile, 
    closePreview 
  } = useFileStore();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchPreview = async () => {
    if (!file || !projectId) return;

    try {
      await previewFileAction(projectId, file.id);
    } catch (error) {
      console.error('Error fetching preview:', error);
    }
  };

  useEffect(() => {
    if (open && file) {
      fetchPreview();
      setImageZoom(100); // Reset zoom when opening new file
    } else if (!open) {
      closePreview(); // Clear preview data when dialog closes
    }
  }, [open, file, projectId]);

  const handleDownload = async () => {
    try {
      await downloadFile(projectId, file.id);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 25, 25));
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          {error}
        </Alert>
      );
    }

    if (!previewData) {
      return (
        <Alert severity="info">
          No preview available for this file type.
        </Alert>
      );
    }

    switch (previewData.previewType) {
      case 'image':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button
                size="small"
                onClick={handleZoomOut}
                disabled={imageZoom <= 25}
                startIcon={<ZoomOut />}
              >
                Zoom Out
              </Button>
              <Chip label={`${imageZoom}%`} variant="outlined" />
              <Button
                size="small"
                onClick={handleZoomIn}
                disabled={imageZoom >= 200}
                startIcon={<ZoomIn />}
              >
                Zoom In
              </Button>
            </Box>
            <Box sx={{ 
              maxHeight: '60vh', 
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <img
                src={previewData.previewUrl}
                alt={previewData.fileName}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  transform: `scale(${imageZoom / 100})`,
                  transformOrigin: 'center top'
                }}
              />
            </Box>
          </Box>
        );

      case 'text':
        return (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: 'grey.50',
              maxHeight: '60vh',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            {previewData.content}
          </Paper>
        );

      case 'document':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              PDF and document preview
            </Typography>
            <Box sx={{ 
              maxHeight: '60vh', 
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <iframe
                src={previewData.previewUrl}
                width="100%"
                height="500px"
                style={{ border: 'none' }}
                title={previewData.fileName}
              />
            </Box>
          </Box>
        );

      default:
        return (
          <Alert severity="info">
            Preview not available for this file type.
          </Alert>
        );
    }
  };

  if (!file) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div">
              {file.originalName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={formatFileSize(file.fileSize)}
                size="small"
                variant="outlined"
              />
              <Chip
                label={file.mimeType.split('/')[1].toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                Uploaded {format(new Date(file.uploadedAt.seconds * 1000), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {renderPreviewContent()}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleDownload}
          startIcon={<Download />}
          variant="outlined"
        >
          Download
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreviewDialog;
