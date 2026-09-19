import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCE8AUFYJwsgS6HDr8vcDfawu157VaFInk",
    authDomain: "capable-cf9ef.firebaseapp.com",
    projectId: "capable-cf9ef",
    storageBucket: "capable-cf9ef.firebasestorage.app",
    messagingSenderId: "694272947770",
    appId: "1:694272947770:web:eb8e542708795a7633a703",
    measurementId: "G-L1JCGQQP1S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    analytics
};
