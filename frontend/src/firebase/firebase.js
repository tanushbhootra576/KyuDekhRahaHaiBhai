import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Check if Firebase credentials are available
const hasValidFirebaseConfig = () => {
    return import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
};

// Set up a mock Firebase app and services for development/testing
let app, auth, storage;

try {
    if (hasValidFirebaseConfig()) {
        // Initialize with real config when available
        const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
            measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
        };

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        storage = getStorage(app);

        console.log('Firebase initialized with real configuration');
    } else {
        // Create mock Firebase services for development
        console.log('Firebase credentials not found - using mock Firebase implementation');

        // Set up mock objects that won't throw errors when methods are called
        auth = {
            currentUser: null,
            onAuthStateChanged: (callback) => {
                callback(null);
                return () => { }; // Return unsubscribe function
            },
            signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-uid', getIdToken: () => Promise.resolve('mock-token') } }),
            createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-uid', getIdToken: () => Promise.resolve('mock-token') } }),
            signOut: () => Promise.resolve(),
            signInWithPopup: () => Promise.resolve({ user: { uid: 'mock-uid' } }),
            sendPasswordResetEmail: () => Promise.resolve()
        };

        storage = {
            ref: () => ({
                put: () => Promise.resolve(),
                getDownloadURL: () => Promise.resolve('https://mock-image-url.com/image.jpg')
            })
        };
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);

    // Provide fallback mock implementations
    auth = {
        currentUser: null,
        onAuthStateChanged: (callback) => {
            callback(null);
            return () => { }; // Return unsubscribe function
        },
        signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-uid', getIdToken: () => Promise.resolve('mock-token') } }),
        createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'mock-uid', getIdToken: () => Promise.resolve('mock-token') } }),
        signOut: () => Promise.resolve(),
        signInWithPopup: () => Promise.resolve({ user: { uid: 'mock-uid' } }),
        sendPasswordResetEmail: () => Promise.resolve()
    };

    storage = {
        ref: () => ({
            put: () => Promise.resolve(),
            getDownloadURL: () => Promise.resolve('https://mock-image-url.com/image.jpg')
        })
    };
}

export { app, auth, storage };
