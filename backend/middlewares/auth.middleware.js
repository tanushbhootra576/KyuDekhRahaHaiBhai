const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('firebase-admin');

// Check if Firebase is initialized
const isFirebaseInitialized = () => {
    try {
        return admin.apps.length > 0;
    } catch (error) {
        return false;
    }
};

module.exports = {
    // Middleware to authenticate all users (citizens and government officials)
    authenticate: async (req, res, next) => {
        try {
            // Get token from header
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ message: 'No authentication token, access denied' });
            }

            // Try to verify as Firebase token only if Firebase is initialized
            if (isFirebaseInitialized()) {
                try {
                    const decodedFirebaseToken = await admin.auth().verifyIdToken(token);

                    // If successful, find user by Firebase UID
                    const user = await User.findOne({ firebaseUid: decodedFirebaseToken.uid }).select('-password');

                    if (user) {
                        req.user = user;
                        return next();
                    }
                } catch (firebaseError) {
                    console.log('Firebase verification failed, falling back to JWT');
                    // Fall through to JWT verification
                }
            }

            // If Firebase verification fails or is not initialized, try JWT
            try {
                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Find user by id
                const user = await User.findById(decoded.id).select('-password');

                if (!user) {
                    return res.status(401).json({ message: 'Token is not valid or user no longer exists' });
                }

                // Add user to request
                req.user = user;
                return next();
            } catch (jwtError) {
                return res.status(401).json({ message: 'Token is not valid' });
            }
        } catch (error) {
            console.error('Authentication error:', error);
            res.status(401).json({ message: 'Authentication failed' });
        }
    },

    // Middleware to authorize government officials only
    authorizeGovernment: (req, res, next) => {
        if (req.user && req.user.role === 'government') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Only government officials can access this resource' });
        }
    },

    // Middleware to authorize citizens only
    authorizeCitizen: (req, res, next) => {
        if (req.user && req.user.role === 'citizen') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Only citizens can access this resource' });
        }
    }
};
