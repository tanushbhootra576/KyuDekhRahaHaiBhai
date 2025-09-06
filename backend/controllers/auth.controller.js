const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { getFirebaseUser } = require('../middlewares/firebase');

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, firebaseUid: user.firebaseUid },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

module.exports = {
    // Register a new user (citizen or government official)
    register: async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, phone, password, role, department, location, firebaseUid } = req.body;

            // Check if user already exists
            let existingUser = await User.findOne({
                $or: [
                    { email },
                    { phone },
                    firebaseUid ? { firebaseUid } : { _id: null }
                ]
            });

            if (existingUser) {
                return res.status(400).json({
                    message: 'User already exists with this email, phone number, or Firebase account'
                });
            }

            // Create new user
            const user = new User({
                name,
                email,
                phone,
                password: firebaseUid ? undefined : password, // Don't store password if using Firebase
                firebaseUid,
                role: role || 'citizen',
                department: department || undefined,
                location,
                // Set isVerified based on Firebase email verification if available
                isVerified: req.user?.emailVerified || true // For demo purposes
            });

            await user.save();

            // Generate token
            const token = generateToken(user);

            // Return user info without password
            const userResponse = { ...user.toObject() };
            delete userResponse.password;

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: userResponse
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Server error during registration' });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, phone, password } = req.body;

            // Check if user exists
            let user;
            if (email) {
                user = await User.findOne({ email });
            } else if (phone) {
                user = await User.findOne({ phone });
            } else {
                return res.status(400).json({ message: 'Please provide email or phone number' });
            }

            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate token
            const token = generateToken(user);

            // Return user info without password
            const userResponse = { ...user.toObject() };
            delete userResponse.password;

            res.json({
                message: 'Login successful',
                token,
                user: userResponse
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error during login' });
        }
    },

    // Handle Firebase authentication
    firebaseAuth: async (req, res) => {
        try {
            const { firebaseUid, email } = req.user;

            // Find user by Firebase UID
            let user = await User.findOne({ firebaseUid });

            // If user not found, try to find by email and link accounts
            if (!user && email) {
                user = await User.findOne({ email });

                if (user) {
                    // Link existing account with Firebase
                    user.firebaseUid = firebaseUid;
                    user.isVerified = req.user.emailVerified;
                    await user.save();
                } else {
                    // If no user found, get detailed user info from Firebase
                    try {
                        const firebaseUser = await getFirebaseUser(firebaseUid);

                        // Create new user with Firebase data
                        user = new User({
                            name: firebaseUser.displayName || 'User',
                            email: firebaseUser.email,
                            phone: firebaseUser.phoneNumber || 'Not provided',
                            firebaseUid,
                            role: 'citizen',
                            isVerified: firebaseUser.emailVerified,
                            location: {}
                        });

                        await user.save();
                    } catch (error) {
                        return res.status(400).json({ message: 'Failed to create user from Firebase data' });
                    }
                }
            }

            // Generate token
            const token = generateToken(user);

            // Return user info without password
            const userResponse = { ...user.toObject() };
            delete userResponse.password;

            res.json({
                message: 'Firebase authentication successful',
                token,
                user: userResponse
            });
        } catch (error) {
            console.error('Firebase auth error:', error);
            res.status(500).json({ message: 'Server error during Firebase authentication' });
        }
    },

    // Get current user profile
    getCurrentUser: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ message: 'Server error while fetching user' });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const { name, location, preferredLanguage, darkMode } = req.body;

            // Find user and update profile
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update fields if provided
            if (name) user.name = name;
            if (location) user.location = location;
            if (preferredLanguage) user.preferredLanguage = preferredLanguage;
            if (darkMode !== undefined) user.darkMode = darkMode;

            // If profile picture was uploaded
            if (req.file) {
                user.profilePicture = `/uploads/images/${req.file.filename}`;
            }

            await user.save();

            // Return updated user without password
            const updatedUser = { ...user.toObject() };
            delete updatedUser.password;

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ message: 'Server error while updating profile' });
        }
    },

    // Change password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            // Find user
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // For Firebase users, password changes are handled by Firebase
            if (user.firebaseUid) {
                return res.json({ message: 'Password changes for Firebase users are handled by Firebase' });
            }

            // Check current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ message: 'Server error while changing password' });
        }
    }
};
