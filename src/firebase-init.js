import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCqSMjr5__HNV-LXZi5vQvGzfBQ46lRFNA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "auth-demo-f8ae4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "auth-demo-f8ae4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "auth-demo-f8ae4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "245702722359",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:245702722359:web:c669123eb90a1d282290b2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DJ4TS9FBX6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
