import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Initialize server-side Firebase app singleton
export const serverFirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig, 'server-app')
  : getApps().find((a) => a.name === 'server-app') || getApp();

// Initialize Firestore with custom database ID from config
export const serverDb: Firestore = getFirestore(
  serverFirebaseApp,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
};
