import { bucket,db } from '../config/firebase.config.js';
/**
 * Upload multiple files for a project
 */
export const uploadProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ 
                message: 'No files provided' 
            });
        }

        // Verify project ownership
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.userId !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const uploadPromises = files.map(async (file) => {
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
            const filePath = `projects/${projectId}/files/${fileName}`;

            const fileUpload = bucket.file(filePath);
            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                    metadata: {
                        originalName: file.originalname,
                        uploadedBy: req.user.uid,
                        uploadedAt: new Date().toISOString(),
                        projectId: projectId
                    }
                }
            });

            return new Promise((resolve, reject) => {
                stream.on('error', reject);
                stream.on('finish', async () => {
                    try {
                        // Make file publicly accessible
                        await fileUpload.makePublic();
                        
                        // Get public URL
                        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

                        // Create file metadata document
                        const fileMetadata = {
                            id: fileName.split('.')[0], // Use filename without extension as ID
                            originalName: file.originalname,
                            fileName: fileName,
                            filePath: filePath,
                            fileSize: file.size,
                            mimeType: file.mimetype,
                            downloadUrl: publicUrl,
                            uploadedBy: req.user.uid,
                            uploadedAt: new Date(),
                            projectId: projectId,
                            downloadCount: 0
                        };

                        // Save file metadata to Firestore
                        await db.collection('projectFiles').doc(fileName.split('.')[0]).set(fileMetadata);

                        resolve(fileMetadata);
                    } catch (error) {
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
 * Get all files for a project
 */
export const getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project access
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.userId !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get files for this project
        const filesSnapshot = await db.collection('projectFiles')
            .where('projectId', '==', projectId)
            .orderBy('uploadedAt', 'desc')
            .get();

        const files = [];
        filesSnapshot.forEach(doc => {
            files.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json({
            files: files
        });

    } catch (error) {
        console.error('Error getting project files:', error);
        res.status(500).json({ 
            message: 'Failed to get project files',
            error: error.message 
        });
    }
};

/**
 * Delete a project file
 */
export const deleteProjectFile = async (req, res) => {
    try {
        const { projectId, fileId } = req.params;

        // Get file metadata
        const fileDoc = await db.collection('projectFiles').doc(fileId).get();
        
        if (!fileDoc.exists) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileData = fileDoc.data();

        // Verify project ownership
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.userId !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete file from Firebase Storage
        const file = bucket.file(fileData.filePath);
        await file.delete();

        // Delete file metadata from Firestore
        await db.collection('projectFiles').doc(fileId).delete();

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
 * Download a project file (with tracking)
 */
export const downloadProjectFile = async (req, res) => {
    try {
        const { projectId, fileId } = req.params;

        // Get file metadata
        const fileDoc = await db.collection('projectFiles').doc(fileId).get();
        
        if (!fileDoc.exists) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileData = fileDoc.data();

        // Verify project access
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.userId !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Increment download count
        await db.collection('projectFiles').doc(fileId).update({
            downloadCount: (fileData.downloadCount || 0) + 1,
            lastDownloadedAt: new Date(),
            lastDownloadedBy: req.user.uid
        });

        // Track download in analytics
        await db.collection('fileDownloads').add({
            fileId: fileId,
            fileName: fileData.originalName,
            projectId: projectId,
            downloadedBy: req.user.uid,
            downloadedAt: new Date(),
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || req.connection.remoteAddress
        });

        // Return download URL
        res.status(200).json({
            downloadUrl: fileData.downloadUrl,
            fileName: fileData.originalName,
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
 * Preview a project file (for supported file types)
 */
export const previewProjectFile = async (req, res) => {
    try {
        const { projectId, fileId } = req.params;

        // Get file metadata
        const fileDoc = await db.collection('projectFiles').doc(fileId).get();
        
        if (!fileDoc.exists) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileData = fileDoc.data();

        // Verify project access
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectData = projectDoc.data();
        if (projectData.userId !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if file type supports preview
        const previewableMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'text/csv'
        ];

        if (!previewableMimeTypes.includes(fileData.mimeType)) {
            return res.status(400).json({ 
                message: 'File type does not support preview',
                supportedTypes: previewableMimeTypes
            });
        }

        // For text files, read content directly
        if (fileData.mimeType.startsWith('text/')) {
            const file = bucket.file(fileData.filePath);
            const [fileBuffer] = await file.download();
            const content = fileBuffer.toString('utf-8');

            return res.status(200).json({
                previewType: 'text',
                content: content,
                fileName: fileData.originalName,
                mimeType: fileData.mimeType
            });
        }

        // For other supported files, return the URL for preview
        res.status(200).json({
            previewType: fileData.mimeType.startsWith('image/') ? 'image' : 'document',
            previewUrl: fileData.downloadUrl,
            fileName: fileData.originalName,
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
        const filesSnapshot = await db.collection('projectFiles').get();
        const totalFiles = filesSnapshot.size;

        // Calculate total storage used
        let totalStorageBytes = 0;
        const filesByType = {};
        
        filesSnapshot.forEach(doc => {
            const fileData = doc.data();
            totalStorageBytes += fileData.fileSize || 0;
            
            const mimeType = fileData.mimeType;
            if (!filesByType[mimeType]) {
                filesByType[mimeType] = 0;
            }
            filesByType[mimeType]++;
        });

        // Get download statistics
        const downloadsSnapshot = await db.collection('fileDownloads')
            .orderBy('downloadedAt', 'desc')
            .limit(1000)
            .get();

        const totalDownloads = downloadsSnapshot.size;

        // Get recent downloads
        const recentDownloads = [];
        downloadsSnapshot.docs.slice(0, 10).forEach(doc => {
            recentDownloads.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.status(200).json({
            totalFiles,
            totalStorageBytes,
            totalStorageMB: Math.round(totalStorageBytes / (1024 * 1024) * 100) / 100,
            filesByType,
            totalDownloads,
            recentDownloads
        });

    } catch (error) {
        console.error('Error getting file statistics:', error);
        res.status(500).json({ 
            message: 'Failed to get file statistics',
            error: error.message 
        });
    }
};
