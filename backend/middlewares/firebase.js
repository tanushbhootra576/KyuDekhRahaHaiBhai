const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin SDK conditionally
let firebaseInitialized = false;

try {
    // Only initialize if environment variables are properly set
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        const serviceAccount = {
            type: process.env.FIREBASE_TYPE || 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
            token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
        };

        // Check if Firebase Admin has already been initialized
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            firebaseInitialized = true;
            console.log('Firebase Admin SDK initialized successfully');
        }
    } else {
        console.warn('Firebase configuration missing. Firebase authentication is disabled.');
    }
} catch (error) {
    console.error('Firebase initialization error:', error.message);
    console.warn('Continuing without Firebase authentication');
}

module.exports = {
    // Middleware to verify Firebase ID token
    verifyFirebaseToken: async (req, res, next) => {
        // If Firebase is not initialized, skip token verification
        if (!firebaseInitialized) {
            console.warn('Firebase not initialized. Skipping token verification.');
            return next();
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            req.user = {
                firebaseUid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified
            };

            // Try to find the user in our database
            const user = await User.findOne({ firebaseUid: decodedToken.uid });
            if (user) {
                req.user.id = user._id;
                req.user.role = user.role;
            }

            next();
        } catch (error) {
            console.error('Error verifying Firebase token:', error);
            return res.status(401).json({ message: 'Invalid token' });
        }
    },

    // Utility function to get Firebase user by UID
    getFirebaseUser: async (uid) => {
        try {
            return await admin.auth().getUser(uid);
        } catch (error) {
            console.error('Error fetching Firebase user:', error);
            throw error;
        }
    },

    // Utility function to create Firebase user
    createFirebaseUser: async (userData) => {
        try {
            return await admin.auth().createUser({
                email: userData.email,
                phoneNumber: userData.phone,
                password: userData.password,
                displayName: userData.name,
                disabled: false
            });
        } catch (error) {
            console.error('Error creating Firebase user:', error);
            throw error;
        }
    }
};
