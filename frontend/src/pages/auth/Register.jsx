import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        role: 'citizen',
        department: '',
        govtId: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, loginWithGoogle } = useAuth();
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

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.phone) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
            newErrors.phone = 'Phone number must be 10 digits';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (formData.role === 'government') {
            if (!formData.department.trim()) {
                newErrors.department = 'Department is required';
            }

            if (!formData.govtId.trim()) {
                newErrors.govtId = 'Government ID is required';
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
            // Remove confirmPassword before sending to API
            const { confirmPassword: _, ...registrationData } = formData;

            // Create location object from address
            const location = {
                city: formData.address.split(',')[0]?.trim() || '',
                state: formData.address.split(',')[1]?.trim() || '',
                pincode: formData.address.split(',')[2]?.trim() || ''
            };

            const result = await register({
                ...registrationData,
                location
            });

            if (result.success) {
                // Redirect based on user role
                if (result.user.role === 'government') {
                    navigate('/dashboard/pending-issues');
                } else {
                    navigate('/dashboard');
                }
            } else {
                // Handle registration failure
                setErrors({ general: result.error });
            }
        } catch (err) {
            console.error('Registration error:', err);
            setErrors({ general: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsSubmitting(true);
        try {
            const result = await loginWithGoogle();
            if (result.success) {
                navigate('/complete-profile');
            } else {
                setErrors({ general: result.error });
            }
        } catch (err) {
            console.error('Google signup error:', err);
            setErrors({ general: 'Failed to sign up with Google. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card register-card">
                <div className="auth-header">
                    <h2>Create an Account</h2>
                    <p>Join CivicPulse to report and track civic issues</p>
                </div>

                {errors.general && (
                    <div className="alert alert-danger">{errors.general}</div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'input-error' : ''}
                            placeholder="Enter your full name"
                            disabled={isSubmitting}
                        />
                        {errors.name && <div className="error-message">{errors.name}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'input-error' : ''}
                            placeholder="Enter your email"
                            disabled={isSubmitting}
                        />
                        {errors.email && <div className="error-message">{errors.email}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'input-error' : ''}
                                placeholder="Create a password"
                                disabled={isSubmitting}
                            />
                            {errors.password && <div className="error-message">{errors.password}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'input-error' : ''}
                                placeholder="Confirm your password"
                                disabled={isSubmitting}
                            />
                            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={errors.phone ? 'input-error' : ''}
                                placeholder="Enter your phone number"
                                disabled={isSubmitting}
                            />
                            {errors.phone && <div className="error-message">{errors.phone}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={errors.address ? 'input-error' : ''}
                            placeholder="Enter your address"
                            disabled={isSubmitting}
                            rows="2"
                        ></textarea>
                        {errors.address && <div className="error-message">{errors.address}</div>}
                    </div>

                    <div className="form-group">
                        <label>I am registering as:</label>
                        <div className="role-selector">
                            <div className="role-option">
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

                    {formData.role === 'government' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="department">Department</label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className={errors.department ? 'input-error' : ''}
                                    placeholder="Enter your department"
                                    disabled={isSubmitting}
                                />
                                {errors.department && <div className="error-message">{errors.department}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="govtId">Government ID</label>
                                <input
                                    type="text"
                                    id="govtId"
                                    name="govtId"
                                    value={formData.govtId}
                                    onChange={handleChange}
                                    className={errors.govtId ? 'input-error' : ''}
                                    placeholder="Enter your government ID"
                                    disabled={isSubmitting}
                                />
                                {errors.govtId && <div className="error-message">{errors.govtId}</div>}
                            </div>
                        </>
                    )}

                    <div className="form-group terms">
                        <p>
                            By creating an account, you agree to our{' '}
                            <Link to="/terms">Terms of Service</Link> and{' '}
                            <Link to="/privacy-policy">Privacy Policy</Link>.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div className="social-login">
                        <div className="separator">
                            <span>OR</span>
                        </div>
                        <button
                            type="button"
                            className="btn btn-google"
                            onClick={handleGoogleSignup}
                            disabled={isSubmitting}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            </svg>
                            Sign up with Google
                        </button>
                    </div>

                    <div className="auth-footer">
                        <p>
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
