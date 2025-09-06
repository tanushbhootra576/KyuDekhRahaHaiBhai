const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { verifyFirebaseToken } = require('../middlewares/firebase');
const { profilePicture } = require('../middlewares/upload.middleware');

const router = express.Router();

// Register route
router.post(
    '/register',
    [
        body('name').not().isEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please include a valid email'),
        body('phone').not().isEmpty().withMessage('Phone number is required'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('role').optional().isIn(['citizen', 'government']).withMessage('Role must be either citizen or government'),
        body('department').optional(),
        body('firebaseUid').optional()
    ],
    authController.register
);

// Login route
router.post(
    '/login',
    [
        body('password').exists().withMessage('Password is required'),
        body('email').optional().isEmail().withMessage('Please include a valid email'),
        body('phone').optional()
    ],
    authController.login
);

// Firebase authentication route
router.post(
    '/firebase-auth',
    verifyFirebaseToken,
    authController.firebaseAuth
);

// Get current user route (protected)
router.get('/me', authenticate, authController.getCurrentUser);

// Update profile route (protected)
router.put(
    '/profile',
    authenticate,
    profilePicture,
    authController.updateProfile
);

// Change password route (protected)
router.put(
    '/change-password',
    [
        body('currentPassword').not().isEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    ],
    authenticate,
    authController.changePassword
);

module.exports = router;
