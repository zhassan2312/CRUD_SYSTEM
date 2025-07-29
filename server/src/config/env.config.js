
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory (two levels up from this file)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const env={
    PORT: process.env.PORT || 3000,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
    NODE_ENV: process.env.NODE_ENV || 'development',
    GCLOUD_STORAGE_BUCKET: process.env.GCLOUD_STORAGE_BUCKET,
}

// Log configuration status (without sensitive data)
console.log('Environment configuration loaded:');
console.log('PROJECT_ID:', env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
console.log('STORAGE_BUCKET:', env.FIREBASE_STORAGE_BUCKET ? 'Set' : 'Missing');
console.log('AUTH_DOMAIN:', env.FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing');
console.log('JWT_SECRET:', env.JWT_SECRET ? 'Set' : 'Missing');

export default env;