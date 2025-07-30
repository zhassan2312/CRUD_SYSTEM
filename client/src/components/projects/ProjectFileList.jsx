import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  AttachFile,
  Description,
  Image,
  PictureAsPdf,
  Archive,
  Download,
  Preview,
  Delete,
  MoreVert,
  CloudUpload,
  Visibility,
  GetApp,
  Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import useFileStore from '../../store/fileStore';
import FilePreviewDialog from './FilePreviewDialog';

const ProjectFileList = ({ projectId, refreshTrigger }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, file: null });
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null });
  const [actionMenu, setActionMenu] = useState({ anchor: null, file: null });

  const { 
    projectFiles, 
    getProjectFiles, 
    refreshProjectFiles, 
    deleteProjectFile, 
    downloadFile 
  } = useFileStore();

  const projectFileData = projectFiles[projectId];
  const files = projectFileData?.data || [];
  const loading = projectFileData?.loading || false;
  const error = projectFileData?.error || null;

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

  const fetchFiles = async () => {
    try {
      await getProjectFiles(projectId);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshProjectFiles(projectId);
    } catch (error) {
      console.error('Error refreshing files:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId, refreshTrigger]);

  const handleMenuOpen = (event, file) => {
    setActionMenu({ anchor: event.currentTarget, file });
  };

  const handleMenuClose = () => {
    setActionMenu({ anchor: null, file: null });
  };

  const handleDownload = async (file) => {
    try {
      await downloadFile(projectId, file.id);
      handleMenuClose();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePreview = (file) => {
    setPreviewDialog({ open: true, file });
    handleMenuClose();
  };

  const handleDeleteClick = (file) => {
    setDeleteDialog({ open: true, file });
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    const file = deleteDialog.file;
    if (!file) return;

    try {
      await deleteProjectFile(projectId, file.id);
      setDeleteDialog({ open: false, file: null });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const isPreviewable = (mimeType) => {
    const previewableMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv'
    ];
    return previewableMimeTypes.includes(mimeType);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Files
          </Typography>
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={60} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Project Files {files.length > 0 && `(${files.length})`}
            </Typography>
            <Tooltip title="Refresh files">
              <IconButton onClick={handleRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {files.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AttachFile sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No files uploaded yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload documents, images, and other files related to this project
              </Typography>
            </Box>
          ) : (
            <List>
              {files.map((file, index) => (
                <React.Fragment key={file.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {getFileIcon(file.mimeType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {file.originalName}
                        </Typography>
                      }
                      secondary={
                        <span style={{ marginTop: '4px', display: 'block' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
                            {file.downloadCount > 0 && (
                              <Chip
                                label={`${file.downloadCount} downloads`}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                          </span>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded {file.uploadedAt ? format(new Date(file.uploadedAt), 'MMM dd, yyyy') : 'Unknown date'}
                          </Typography>
                        </span>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isPreviewable(file.mimeType) && (
                          <Tooltip title="Preview">
                            <IconButton
                              size="small"
                              onClick={() => handlePreview(file)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file)}
                          >
                            <GetApp />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, file)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < files.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchor}
        open={Boolean(actionMenu.anchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDownload(actionMenu.file)}>
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
        {actionMenu.file && isPreviewable(actionMenu.file.mimeType) && (
          <MenuItem onClick={() => handlePreview(actionMenu.file)}>
            <Preview sx={{ mr: 1 }} />
            Preview
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDeleteClick(actionMenu.file)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, file: null })}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.file?.originalName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, file: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Preview Dialog */}
      <FilePreviewDialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, file: null })}
        file={previewDialog.file}
        projectId={projectId}
      />
    </>
  );
};

export default ProjectFileList;
