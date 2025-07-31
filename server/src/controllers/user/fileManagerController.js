import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { bucket, db } from '../../config/firebase.config.js';

/**
 * Upload multiple files for a project
 */
export const uploadProjectFiles = async (req, res) => {
    try {
        console.log('📁 File upload request received:', {
            projectId: req.params.projectId,
            fileCount: req.files?.length || 0,
            userId: req.user?.uid
        });

        const { projectId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            console.log('❌ No files provided');
            return res.status(400).json({ 
                message: 'No files provided' 
            });
        }

        // Verify project ownership
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.createdBy !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const uploadPromises = files.map(async (file) => {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
            const filePath = `projects/${projectId}/files/${fileName}`;

            const fileUpload = bucket.file(filePath);
            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype
                }
            });

            return new Promise((resolve, reject) => {
                stream.on('error', (error) => {
                    console.error('File upload error:', error);
                    reject(error);
                });

                stream.on('finish', async () => {
                    try {
                        // Make file publicly readable
                        await fileUpload.makePublic();
                        
                        // Get signed URL for downloading
                        const [signedUrl] = await fileUpload.getSignedUrl({
                            action: 'read',
                            expires: '03-09-2491' // Far future date
                        });

                        const fileMetadata = {
                            fileName: file.originalname,
                            filePath: filePath,
                            fileSize: file.size,
                            mimeType: file.mimetype,
                            projectId: projectId,
                            uploadedBy: req.user.uid,
                            uploadedAt: Timestamp.fromDate(new Date()),
                            downloadUrl: signedUrl
                        };

                        // Save metadata to Firestore
                        const projectFilesRef = collection(db, 'projectFiles');
                        const docRef = await addDoc(projectFilesRef, fileMetadata);

                        resolve({
                            id: docRef.id,
                            ...fileMetadata,
                            downloadUrl: signedUrl
                        });
                    } catch (error) {
                        console.error('Error saving file metadata:', error);
                        reject(error);
                    }
                });

                stream.end(file.buffer);
            });
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ 
            message: 'Failed to upload files',
            error: error.message 
        });
    }
};

/**
 * Get all files for a specific project
 */
export const getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Verify project ownership
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        
        if (projectData.createdBy !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get all files for this project
        const filesCollection = collection(db, 'projectFiles');
        const filesQuery = query(
            filesCollection,
            where('projectId', '==', projectId)
            // orderBy('uploadedAt', 'desc') - Commented out to avoid composite index requirement
        );
        const filesSnapshot = await getDocs(filesQuery);

        const files = filesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                uploadedAt: data.uploadedAt?.toDate() || new Date()
            };
        });

        // Sort files by uploadedAt in descending order (most recent first)
        files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        res.status(200).json({
            message: 'Files retrieved successfully',
            files: files
        });
    } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve files',
            error: error.message 
        });
    }
};

/**
 * Delete a file from a project
 */
export const deleteProjectFile = async (req, res) => {
    try {
        const { projectId, fileId } = req.params;

        // Get file document
        const fileRef = doc(db, 'projectFiles', fileId);
        const fileDoc = await getDoc(fileRef);

        if (!fileDoc.exists()) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileData = fileDoc.data();

        // Verify project ownership
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.createdBy !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete file from Cloud Storage
        const file = bucket.file(fileData.filePath);
        try {
            await file.delete();
            console.log(`✅ File deleted from storage: ${fileData.filePath}`);
        } catch (storageError) {
            // If file doesn't exist in storage (404), log it but continue with database deletion
            if (storageError.code === 404) {
                console.log(`⚠️ File not found in storage (already deleted?): ${fileData.filePath}`);
            } else {
                console.error('Error deleting file from storage:', storageError);
                // For other storage errors, still try to delete the database record
            }
        }

        // Delete file document from Firestore
        await deleteDoc(fileRef);

        res.status(200).json({
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ 
            message: 'Failed to delete file',
            error: error.message 
        });
    }
};

/**
 * Download a file
 */
export const downloadFile = async (req, res) => {
    try {
        const { projectId, fileId } = req.params;

        // Get file document
        const fileRef = doc(db, 'projectFiles', fileId);
        const fileDoc = await getDoc(fileRef);

        if (!fileDoc.exists()) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileData = fileDoc.data();

        // Verify project ownership
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.createdBy !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Track download
        await updateDoc(fileRef, {
            downloadCount: (fileData.downloadCount || 0) + 1,
            lastDownloaded: Timestamp.fromDate(new Date())
        });

        // Log download activity
        const fileDownloadsRef = collection(db, 'fileDownloads');
        await addDoc(fileDownloadsRef, {
            fileId: fileId,
            projectId: projectId,
            downloadedBy: req.user.uid,
            downloadedAt: Timestamp.fromDate(new Date()),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
        });

        // Get signed URL for download
        const file = bucket.file(fileData.filePath);
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        res.status(200).json({
            message: 'Download URL generated',
            downloadUrl: signedUrl,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            mimeType: fileData.mimeType
        });

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ 
            message: 'Failed to download file',
            error: error.message 
        });
    }
};

/**
 * Preview a file (for images, PDFs, etc.)
 */
export const previewFile = async (req, res) => {
    try {
        const { projectId, fileId } = req.params;

        // Get file document
        const fileRef = doc(db, 'projectFiles', fileId);
        const fileDoc = await getDoc(fileRef);

        if (!fileDoc.exists()) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileData = fileDoc.data();

        // Verify project ownership
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.createdBy !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if file type supports preview
        const supportedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'text/html', 'text/css',
            'application/json', 'text/javascript'
        ];

        if (!supportedTypes.includes(fileData.mimeType)) {
            return res.status(400).json({ 
                message: 'File type not supported for preview' 
            });
        }

        // Get signed URL for preview
        const file = bucket.file(fileData.filePath);
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        res.status(200).json({
            message: 'Preview URL generated',
            previewUrl: signedUrl,
            fileName: fileData.fileName,
            mimeType: fileData.mimeType,
            fileSize: fileData.fileSize
        });

    } catch (error) {
        console.error('Error previewing file:', error);
        res.status(500).json({ 
            message: 'Failed to preview file',
            error: error.message 
        });
    }
};

/**
 * Get file statistics for admin dashboard
 */
export const getFileStatistics = async (req, res) => {
    try {
        // Only admins can access file statistics
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get total files count
        const filesCollection = collection(db, 'projectFiles');
        const filesSnapshot = await getDocs(filesCollection);
        const totalFiles = filesSnapshot.size;

        // Calculate total storage used
        let totalStorageBytes = 0;
        const filesByType = {};
        const filesByProject = {};

        filesSnapshot.forEach(doc => {
            const fileData = doc.data();
            totalStorageBytes += fileData.fileSize || 0;

            // Count by file type
            const mimeType = fileData.mimeType || 'unknown';
            filesByType[mimeType] = (filesByType[mimeType] || 0) + 1;

            // Count by project
            const projectId = fileData.projectId;
            filesByProject[projectId] = (filesByProject[projectId] || 0) + 1;
        });

        // Convert bytes to more readable format
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        // Get recent uploads (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUploads = filesSnapshot.docs.filter(doc => {
            const uploadedAt = doc.data().uploadedAt?.toDate();
            return uploadedAt && uploadedAt >= sevenDaysAgo;
        }).length;

        res.status(200).json({
            message: 'File statistics retrieved successfully',
            statistics: {
                totalFiles,
                totalStorageBytes,
                totalStorageFormatted: formatBytes(totalStorageBytes),
                recentUploads,
                filesByType,
                topProjects: Object.entries(filesByProject)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([projectId, count]) => ({ projectId, fileCount: count }))
            }
        });

    } catch (error) {
        console.error('Error getting file statistics:', error);
        res.status(500).json({ 
            message: 'Failed to get file statistics',
            error: error.message 
        });
    }
};

/**
 * Get file audit log for admin
 */
export const getFileAuditLog = async (req, res) => {
    try {
        // Only admins can access audit logs
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { 
            page = 1, 
            limit = 50,
            projectId,
            userId,
            action // upload, download, delete
        } = req.query;

        // Build query
        const downloadsCollection = collection(db, 'fileDownloads');
        let downloadQuery = query(downloadsCollection, orderBy('downloadedAt', 'desc'));

        if (projectId) {
            downloadQuery = query(downloadQuery, where('projectId', '==', projectId));
        }

        if (userId) {
            downloadQuery = query(downloadQuery, where('downloadedBy', '==', userId));
        }

        const downloadsSnapshot = await getDocs(downloadQuery);
        const downloads = downloadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            downloadedAt: doc.data().downloadedAt.toDate(),
            action: 'download'
        }));

        // For simplicity, just return downloads for now
        // In a production app, you'd want to consolidate all file activities
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedLogs = downloads.slice(startIndex, endIndex);

        res.status(200).json({
            message: 'Audit log retrieved successfully',
            logs: paginatedLogs,
            pagination: {
                currentPage: parseInt(page),
                totalItems: downloads.length,
                totalPages: Math.ceil(downloads.length / limit),
                hasNextPage: endIndex < downloads.length,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('Error getting audit log:', error);
        res.status(500).json({ 
            message: 'Failed to get audit log',
            error: error.message 
        });
    }
};
