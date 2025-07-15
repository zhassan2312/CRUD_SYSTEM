import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials from keyfile.json
const storage = new Storage({
  keyFilename: path.join(__dirname, 'keyfile.json'), // keyfile.json is in the same directory
  projectId: 'internship-2025-2-e5d4b',
});

const bucketName = 'internship-2025-2-e5d4b.firebasestorage.app';
const bucket = storage.bucket(bucketName);

console.log('Google Cloud Storage initialized with service account');
console.log('Bucket name:', bucketName);

const uploadFileAndGetUrl = async (fileObject, folder = "profile-pics") => {
  return new Promise((resolve, reject) => {
    console.log('Attempting to upload file:', fileObject.name, 'Size:', fileObject.buffer.length, 'bytes');

    // Use a unique filename (timestamp + original name)
    const uniqueFileName = `${folder}/${Date.now()}-${fileObject.name}`;
    const blob = bucket.file(uniqueFileName);
    
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: fileObject.type,
      },
    });

    blobStream.on('error', (err) => {
      console.error('Upload error:', err);
      reject(err);
    });

    blobStream.on('finish', async () => {
      try {
        console.log('File uploaded successfully:', uniqueFileName);
        
        // Make the file publicly readable
        await blob.makePublic();
        
        // Generate the public URL (using the Firebase Storage format you showed)
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(uniqueFileName)}?alt=media`;
        console.log('Public URL generated:', publicUrl);
        
        resolve(publicUrl);
      } catch (error) {
        console.error('Error making file public or generating URL:', error);
        reject(error);
      }
    });

    blobStream.end(fileObject.buffer);
  });
};

export { bucket, uploadFileAndGetUrl };
