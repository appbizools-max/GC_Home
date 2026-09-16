import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyC78BUaShQIi_LRxzqUY9mdT8fa8sGHMNA",
  authDomain: "gchome-2b40e.firebaseapp.com",
  projectId: "gchome-2b40e",
  storageBucket: "gchome-2b40e.firebasestorage.app",
  messagingSenderId: "967615953065",
  appId: "1:967615953065:web:28b3837f9bf7c76ac611b8",
  measurementId: "G-QR8YQDL8BC"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics & Messaging safely in browser environments
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const getMessagingInstance = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

export default app;
