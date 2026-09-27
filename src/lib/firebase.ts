import { initializeApp } from 'firebase/app';
import {
    getAuth, GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    getAdditionalUserInfo
} from 'firebase/auth';
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
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    getAdditionalUserInfo,
};
