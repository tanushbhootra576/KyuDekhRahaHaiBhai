import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Temporary flag to bypass authentication for development/testing
const BYPASS_AUTH = true;

// Create the authentication context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Google Auth Provider
    const googleProvider = new GoogleAuthProvider();

    // Logout function - defined as useCallback to avoid dependency issues
    const logout = useCallback(async () => {
        try {
            // Sign out from Firebase
            await signOut(auth);

            // Clear local storage and state
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            axios.defaults.headers.common['Authorization'] = '';
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            setError('Failed to logout. Please try again.');
        }
    }, [navigate]);

    // Initialize axios with token and watch Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get the Firebase ID token
                    const idToken = await firebaseUser.getIdToken();

                    // Send the token to your backend for verification and user data
                    const response = await axios.post(`${API_URL}/auth/firebase-auth`, { idToken });

                    // Set the token and user
                    localStorage.setItem('token', idToken);
                    setToken(idToken);
                    setUser(response.data.user);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
                    setError(null);
                } catch (err) {
                    console.error('Error verifying Firebase token:', err);
                    setError('Authentication failed. Please try again.');
                    logout();
                } finally {
                    setLoading(false);
                }
            } else {
                // Legacy token check for backward compatibility
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    try {
                        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                        const response = await axios.get(`${API_URL}/auth/me`);
                        setUser(response.data);
                        setToken(storedToken);
                        setError(null);
                    } catch (err) {
                        console.error('Error fetching user with stored token:', err);
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                        axios.defaults.headers.common['Authorization'] = '';
                        setError('Session expired. Please login again.');
                    }
                } else {
                    axios.defaults.headers.common['Authorization'] = '';
                    setUser(null);
                    setToken(null);
                }
                setLoading(false);
            }
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, [logout]);

    // Login with Firebase and backend
    const login = async ({ email, password }) => {
        try {
            setLoading(true);

            // Firebase authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // The user will be set by the onAuthStateChanged listener
            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
            return { success: false, error: err.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    // Google Sign In
    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, googleProvider);
            // The user will be set by the onAuthStateChanged listener
            return { success: true };
        } catch (err) {
            console.error('Google login error:', err);
            setError(err.message || 'Google login failed. Please try again.');
            return { success: false, error: err.message || 'Google login failed' };
        } finally {
            setLoading(false);
        }
    };

    // Register with Firebase and backend
    const register = async (userData) => {
        try {
            setLoading(true);

            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            // Update Firebase profile
            await updateFirebaseProfile(userCredential.user, {
                displayName: userData.name
            });

            // Get ID token
            const idToken = await userCredential.user.getIdToken();

            // Send user data to backend with token
            const response = await axios.post(
                `${API_URL}/auth/register`,
                { ...userData, firebaseUid: userCredential.user.uid },
                { headers: { Authorization: `Bearer ${idToken}` } }
            );

            // The user will be set by the onAuthStateChanged listener
            return { success: true, user: response.data.user };
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
            return { success: false, error: err.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    };

    // Update user profile
    // Update user profile
    const updateProfile = async (profileData) => {
        try {
            setLoading(true);
            const response = await axios.put(
                `${API_URL}/auth/profile`,
                profileData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // If there's a name update, also update in Firebase
            if (profileData.name && auth.currentUser) {
                await updateFirebaseProfile(auth.currentUser, {
                    displayName: profileData.name
                });
            }

            setUser(response.data.user);
            setError(null);
            return { success: true, user: response.data.user };
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.response?.data?.message || 'Profile update failed. Please try again.');
            return { success: false, error: err.response?.data?.message || 'Profile update failed' };
        } finally {
            setLoading(false);
        }
    };

    // Change password
    const changePassword = async ({ currentPassword, newPassword }) => {
        try {
            setLoading(true);

            // Re-authenticate user first
            await signInWithEmailAndPassword(auth, user.email, currentPassword);

            // Update password in Firebase
            await auth.currentUser.updatePassword(newPassword);

            // Update password in backend
            await axios.put(
                `${API_URL}/auth/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setError(null);
            return { success: true };
        } catch (err) {
            console.error('Password change error:', err);
            setError(err.message || 'Password change failed. Please try again.');
            return { success: false, error: err.message || 'Password change failed' };
        } finally {
            setLoading(false);
        }
    };

    // Password reset
    const resetPassword = async (email) => {
        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (err) {
            console.error('Password reset error:', err);
            return { success: false, error: err.message || 'Password reset failed' };
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user: BYPASS_AUTH ? {
                    _id: 'bypass-user-id',
                    name: 'Test Citizen',
                    email: 'testcitizen@civicpulse.org',
                    role: 'citizen',
                    location: {
                        city: 'Test City',
                        state: 'Test State',
                        pincode: '123456'
                    },
                    isVerified: true
                } : user,
                token: BYPASS_AUTH ? 'bypass-token' : token,
                loading: BYPASS_AUTH ? false : loading,
                error,
                login,
                loginWithGoogle,
                register,
                logout,
                updateProfile,
                changePassword,
                resetPassword,
                isAuthenticated: BYPASS_AUTH ? true : !!token,
                isGovernment: BYPASS_AUTH ? false : user?.role === 'government',
                isCitizen: BYPASS_AUTH ? true : user?.role === 'citizen'
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
