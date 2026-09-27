import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyD6ZYSMF-uhdDdpxlJm-wBL3Szho4LvMu4",
    authDomain: "wardrobe-app-adf6e.firebaseapp.com",
    projectId: "wardrobe-app-adf6e",
    storageBucket: "wardrobe-app-adf6e.appspot.com",
    messagingSenderId: "920220901330",
    appId: "1:920220901330:web:2367f33012d657e43e320b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export {
    auth,
    db,
    storage,
    googleProvider,
    signInWithRedirect,
    getRedirectResult,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
};
