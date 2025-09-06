import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'citizen'
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (formData.role === 'government') {
            if (!formData.email) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email is invalid';
            }

            if (!formData.password) {
                newErrors.password = 'Password is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login(formData);

            if (result.success) {
                // Redirect based on user role
                if (result.user?.role === 'government') {
                    navigate('/dashboard/pending-issues');
                } else {
                    navigate('/dashboard');
                }
            } else {
                // Handle login failure
                setErrors({ general: result.error });
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrors({ general: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            const result = await loginWithGoogle();
            if (result.success) {
                // User will be redirected appropriately via onAuthStateChanged
                navigate('/dashboard');
            } else {
                setErrors({ general: result.error });
            }
        } catch (err) {
            console.error('Google login error:', err);
            setErrors({ general: 'Failed to login with Google. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Login to CivicPulse</h2>
                    <p>Enter your credentials to access your account</p>
                </div>

                {errors.general && (
                    <div className="alert alert-danger">{errors.general}</div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>I am a:</label>
                        <div className="role-selector">
                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="citizen"
                                    name="role"
                                    value="citizen"
                                    checked={formData.role === 'citizen'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="citizen">Citizen</label>
                            </div>
                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="government"
                                    name="role"
                                    value="government"
                                    checked={formData.role === 'government'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="government">Government Official</label>
                            </div>
                        </div>
                    </div>

                    {formData.role === 'government' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'input-error' : ''}
                                    placeholder="Enter your official email"
                                    disabled={isSubmitting}
                                />
                                {errors.email && <div className="error-message">{errors.email}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'input-error' : ''}
                                    placeholder="Enter your password"
                                    disabled={isSubmitting}
                                />
                                {errors.password && <div className="error-message">{errors.password}</div>}
                            </div>
                        </>
                    ) : (
                                <input
                                    type="radio"
                                    id="citizen"
                                    name="role"
                                    value="citizen"
                                    checked={formData.role === 'citizen'}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="citizen">Citizen</label>
                            </div>
                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="government"
                                    name="role"
                                    value="government"
                                    checked={formData.role === 'government'}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="government">Government Official</label>
                            </div>
                        </div>
                    </div>

                    <div className="form-group forgot-password">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="social-login">
                        <div className="separator">
                            <span>OR</span>
                        </div>
                        <button
                            type="button"
                            className="btn btn-google"
                            onClick={handleGoogleLogin}
                            disabled={isSubmitting}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <div className="auth-footer">
                        <p>
                            Don't have an account? <Link to="/register">Register</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
