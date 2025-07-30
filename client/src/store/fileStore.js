import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../lib/api';

const useFileStore = create(
  devtools(
    (set, get) => ({
      // Project Files State
      projectFiles: {},  // Keyed by projectId
      
      // Upload State
      uploadProgress: {},  // Keyed by uploadId
      
      // Preview State
      previewFile: null,
      previewLoading: false,
      previewError: null,

      // General Loading and Error States
      loading: false,
      error: null,

      // Get files for a specific project
      getProjectFiles: async (projectId) => {
        const currentFiles = get().projectFiles[projectId];
        
        // Return cached data if available and fresh (less than 2 minutes)
        if (currentFiles && currentFiles.data && currentFiles.lastFetched) {
          const now = Date.now();
          const twoMinutes = 2 * 60 * 1000;
          if ((now - currentFiles.lastFetched) < twoMinutes) {
            return currentFiles.data;
          }
        }

        set((state) => ({
          projectFiles: {
            ...state.projectFiles,
            [projectId]: {
              ...state.projectFiles[projectId],
              loading: true,
              error: null
            }
          }
        }));

        try {
          const response = await api.get(`/projects/${projectId}/files`);
          
          set((state) => ({
            projectFiles: {
              ...state.projectFiles,
              [projectId]: {
                data: response.data.files,
                loading: false,
                error: null,
                lastFetched: Date.now()
              }
            }
          }));

          return response.data.files;
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch project files';
          
          set((state) => ({
            projectFiles: {
              ...state.projectFiles,
              [projectId]: {
                ...state.projectFiles[projectId],
                loading: false,
                error: errorMessage
              }
            }
          }));

          throw error;
        }
      },

      // Upload files to a project
      uploadProjectFiles: async (projectId, files, onProgress = null) => {
        const uploadId = `${projectId}_${Date.now()}`;
        
        set((state) => ({
          uploadProgress: {
            ...state.uploadProgress,
            [uploadId]: {
              progress: 0,
              status: 'uploading',
              files: files.length,
              completed: 0
            }
          }
        }));

        try {
          const formData = new FormData();
          Array.from(files).forEach((file) => {
            formData.append('files', file);
          });

          const response = await api.post(`/projects/${projectId}/files`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              
              set((state) => ({
                uploadProgress: {
                  ...state.uploadProgress,
                  [uploadId]: {
                    ...state.uploadProgress[uploadId],
                    progress
                  }
                }
              }));

              if (onProgress) {
                onProgress(progress);
              }
            }
          });

          // Update upload status to completed
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [uploadId]: {
                ...state.uploadProgress[uploadId],
                status: 'completed',
                progress: 100
              }
            }
          }));

          // Refresh project files after successful upload
          await get().refreshProjectFiles(projectId);

          // Remove upload progress after 3 seconds
          setTimeout(() => {
            set((state) => {
              const newProgress = { ...state.uploadProgress };
              delete newProgress[uploadId];
              return { uploadProgress: newProgress };
            });
          }, 3000);

          return response.data;
        } catch (error) {
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [uploadId]: {
                ...state.uploadProgress[uploadId],
                status: 'error',
                error: error.response?.data?.message || 'Upload failed'
              }
            }
          }));

          throw error;
        }
      },

      // Delete a file
      deleteProjectFile: async (projectId, fileId) => {
        try {
          await api.delete(`/projects/${projectId}/files/${fileId}`);
          
          // Remove file from the local state
          set((state) => ({
            projectFiles: {
              ...state.projectFiles,
              [projectId]: {
                ...state.projectFiles[projectId],
                data: state.projectFiles[projectId]?.data?.filter(
                  file => file.id !== fileId
                ) || []
              }
            }
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      // Download a file
      downloadFile: async (projectId, fileId) => {
        try {
          const response = await api.get(`/projects/${projectId}/files/${fileId}/download`);
          
          // Create download link
          const link = document.createElement('a');
          link.href = response.data.downloadUrl;
          link.download = response.data.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          return response.data;
        } catch (error) {
          throw error;
        }
      },

      // Preview a file
      previewFile: async (projectId, fileId) => {
        set({
          previewLoading: true,
          previewError: null,
          previewFile: null
        });

        try {
          const response = await api.get(`/projects/${projectId}/files/${fileId}/preview`);
          
          set({
            previewFile: response.data,
            previewLoading: false,
            previewError: null
          });

          return response.data;
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to preview file';
          
          set({
            previewLoading: false,
            previewError: errorMessage,
            previewFile: null
          });

          throw error;
        }
      },

      // Close preview
      closePreview: () => {
        set({
          previewFile: null,
          previewError: null
        });
      },

      // Refresh files for a project (force reload)
      refreshProjectFiles: async (projectId) => {
        set((state) => ({
          projectFiles: {
            ...state.projectFiles,
            [projectId]: {
              ...state.projectFiles[projectId],
              lastFetched: null
            }
          }
        }));
        
        return get().getProjectFiles(projectId);
      },

      // Clear files for a specific project
      clearProjectFiles: (projectId) => {
        set((state) => {
          const newProjectFiles = { ...state.projectFiles };
          delete newProjectFiles[projectId];
          return { projectFiles: newProjectFiles };
        });
      },

      // Clear all file data
      clearAllFiles: () => {
        set({
          projectFiles: {},
          uploadProgress: {},
          previewFile: null,
          previewLoading: false,
          previewError: null,
          loading: false,
          error: null
        });
      },

      // Get upload progress for a specific upload
      getUploadProgress: (uploadId) => {
        return get().uploadProgress[uploadId] || null;
      },

      // Remove completed/errored uploads
      cleanupUploads: () => {
        set((state) => {
          const newProgress = {};
          Object.entries(state.uploadProgress).forEach(([id, progress]) => {
            if (progress.status === 'uploading') {
              newProgress[id] = progress;
            }
          });
          return { uploadProgress: newProgress };
        });
      }
    }),
    {
      name: 'file-store',
      partialize: (state) => ({
        // Don't persist upload progress or preview data
        projectFiles: Object.fromEntries(
          Object.entries(state.projectFiles).map(([projectId, data]) => [
            projectId,
            {
              data: data.data,
              lastFetched: data.lastFetched
            }
          ])
        )
      })
    }
  )
);

export default useFileStore;
