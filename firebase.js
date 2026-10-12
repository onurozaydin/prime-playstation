import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuGAbcYgV4h5vNyMcgIwp9xlWQL7sYwWk",
  authDomain: "prime-playstation.firebaseapp.com",
  projectId: "prime-playstation",
  storageBucket: "prime-playstation.firebasestorage.app",
  messagingSenderId: "130195124789",
  appId: "1:130195124789:web:ecdd794477e27c1902777c",
  measurementId: "G-R78JJE8WC3"
};

// Firebase'i Başlat
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();