import { initializeApp } from 'firebase/app';
import {
    getAuth, GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    signOut,
    getAdditionalUserInfo,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD6ZYSMF-uhdDdpxlJm-wBL3Szho4LvMu4",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wardrobe-app-adf6e.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wardrobe-app-adf6e",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wardrobe-app-adf6e.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "920220901330",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:920220901330:web:2367f33012d657e43e320b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Explicitly set persistence to LocalStorage/IndexedDB to fix random logouts on refresh
setPersistence(auth, browserLocalPersistence).catch(console.error);

let db: ReturnType<typeof getFirestore>;
try {
    db = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
    });
} catch {
    db = getFirestore(app);
}
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Clear any stale Firebase redirect state from IndexedDB.
 * This prevents the "missing initial state" error that occurs when
 * signInWithRedirect and signInWithPopup are mixed.
 */
export async function clearStaleAuthState(): Promise<void> {
    try {
        const databases = ['firebaseLocalStorageDb', 'firebase-heartbeat-database'];
        for (const dbName of databases) {
            await new Promise<void>((resolve) => {
                const req = indexedDB.deleteDatabase(dbName);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
            });
        }
    } catch {
        // Ignore — best effort cleanup
    }
}

export {
    auth,
    db,
    storage,
    googleProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    signOut,
    getAdditionalUserInfo,
};
