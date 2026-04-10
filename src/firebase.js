import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyADuarw2vDVZo6-zgOqb9n--Z534V3wU4E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jayple-app-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jayple-app-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jayple-app-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "152751512014",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:152751512014:web:6e626e626e626e626e626e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;