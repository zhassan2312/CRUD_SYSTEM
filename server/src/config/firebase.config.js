import env from './env.config.js';
import { initializeApp } from 'firebase/app';
import { collection, getFirestore, addDoc, setDoc, doc, getDoc, getDocs, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import admin from 'firebase-admin';

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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('./src/config/keyfile.json'),
  });
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const users = collection(db, 'users');
const mail = collection(db, 'mail');
const projects = collection(db, 'projects');
const teachers = collection(db, 'teachers');

export { 
  app, 
  admin, 
  db, 
  users, 
  mail, 
  projects, 
  teachers, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy 
};