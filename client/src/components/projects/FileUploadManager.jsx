import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Description,
  Image,
  PictureAsPdf,
  Archive,
  Delete,
  Close
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useFileStore } from '../../store/user';

const FileUploadManager = ({ projectId, onUploadComplete, open, onClose }) => {
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  
  const { uploadProjectFiles, getUploadProgress, cleanupUploads } = useFileStore();
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const uploadProgress = currentUploadId ? getUploadProgress(currentUploadId) : null;

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image color="primary" />;
    if (mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive color="warning" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <Description color="info" />;
    return <AttachFile />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setUploadError('');
    setUploadSuccess('');

    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => 
        `${rejection.file.name}: ${rejection.errors.map(e => e.message).join(', ')}`
      );
      setUploadError(`Some files were rejected: ${errors.join('; ')}`);
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploadError('');
    setUploadSuccess('');

    try {
      const fileObjects = files.map(({ file }) => file);
      const uploadId = `${projectId}_${Date.now()}`;
      setCurrentUploadId(uploadId);

      const response = await uploadProjectFiles(
        projectId, 
        fileObjects,
        (progress) => {
          // Progress is already handled by the store
        }
      );

      setUploadSuccess(`Successfully uploaded ${files.length} file(s)`);
      setFiles([]);
      
      if (onUploadComplete) {
        onUploadComplete(response.files);
      }

      // Auto close after success
      setTimeout(() => {
        onClose();
        setCurrentUploadId(null);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(
        error.response?.data?.message || 'Failed to upload files'
      );
      setCurrentUploadId(null);
    }
  };

  const handleClose = () => {
    const isUploading = uploadProgress?.status === 'uploading';
    
    if (!isUploading) {
      setFiles([]);
      setUploadError('');
      setUploadSuccess('');
      setCurrentUploadId(null);
      cleanupUploads(); // Clean up completed uploads
      onClose();
    }
  };

  // Clean up upload progress when component unmounts
  useEffect(() => {
    return () => {
      if (currentUploadId) {
        cleanupUploads();
      }
    };
  }, [currentUploadId, cleanupUploads]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Upload Project Files
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={uploadProgress?.status === 'uploading'}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        )}
        
        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {uploadSuccess}
          </Alert>
        )}

        <Card
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: uploadProgress?.status === 'uploading' ? 'not-allowed' : 'pointer',
            mb: 2,
            opacity: uploadProgress?.status === 'uploading' ? 0.5 : 1
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <input {...getInputProps()} disabled={uploadProgress?.status === 'uploading'} />
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'Drop files here...'
                : 'Drag & drop files here, or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported: Images, PDF, Word, Excel, PowerPoint, Text, Archives
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Max file size: 10MB • Max files: 10
            </Typography>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selected Files ({files.length})
            </Typography>
            <List dense>
              {files.map(({ file, id, preview }) => (
                <ListItem key={id}>
                  <ListItemIcon>
                    {getFileIcon(file.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Chip
                          label={formatFileSize(file.size)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={file.type.split('/')[1].toUpperCase()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </span>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeFile(id)}
                      disabled={uploadProgress?.status === 'uploading'}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {uploadProgress?.status === 'uploading' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Uploading... {uploadProgress.progress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress.progress} />
          </Box>
        )}

        {uploadProgress?.status === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadProgress.error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploadProgress?.status === 'uploading'}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={files.length === 0 || uploadProgress?.status === 'uploading'}
          startIcon={<CloudUpload />}
        >
          {uploadProgress?.status === 'uploading' ? 'Uploading...' : `Upload ${files.length} File(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadManager;
