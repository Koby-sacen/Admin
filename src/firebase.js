// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 1. Add this import

const firebaseConfig = {
  apiKey: "AIzaSyB4EHdFtpwdg5onVlsbKat5rBK8GHsDnPM",
  authDomain: "wasteclassifier-28389.firebaseapp.com",
  projectId: "wasteclassifier-28389",
  storageBucket: "wasteclassifier-28389.firebasestorage.app",
  messagingSenderId: "434445307733",
  appId: "1:434445307733:web:31f5783de8e3efab4f29dc"
};

const app = initializeApp(firebaseConfig);

// 2. Initialize and export Auth
export const auth = getAuth(app); 
export const db = getFirestore(app);