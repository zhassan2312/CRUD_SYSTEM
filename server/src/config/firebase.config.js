import env from './env.config.js';
import { initializeApp } from 'firebase/app';
import { collection, getFirestore, addDoc, setDoc, doc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
};

console.log('Firebase Config Check:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing'
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const users = collection(db, 'users');
const mail = collection(db, 'mail');

export { app, db, users, mail, addDoc, setDoc, doc, getDoc, getDocs, deleteDoc, updateDoc };