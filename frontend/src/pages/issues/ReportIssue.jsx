import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';

const ReportIssue = () => {
    const { isAuthenticated } = useAuth(); // Removed unused user variable
    const navigate = useNavigate();

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    from: '/report-issue',
                    message: 'Please login to report an issue'
                }
            });
        }
    }, [isAuthenticated, navigate]);

    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        address: '',
        latitude: '',
        longitude: '',
        images: []
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);

    // Categories for dropdown
    const categories = [
        'Roads & Infrastructure',
        'Waste Management',
        'Electricity',
        'Water Supply',
        'Public Safety',
        'Environment',
        'Noise Pollution',
        'Public Property Damage',
        'Stray Animals',
        'Others'
    ];

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

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 3) {
            setErrors({
                ...errors,
                images: 'Maximum 3 images allowed'
            });
            return;
        }

        // Create image previews
        const newPreviewImages = files.map(file => URL.createObjectURL(file));
        setPreviewImages(newPreviewImages);

        setFormData({
            ...formData,
            images: files
        });

        // Clear error when user uploads
        if (errors.images) {
            setErrors({
                ...errors,
                images: ''
            });
        }
    };

    const removeImage = (index) => {
        const newPreviewImages = [...previewImages];
        const newImages = [...formData.images];

        // Release object URL to prevent memory leaks
        URL.revokeObjectURL(previewImages[index]);

        newPreviewImages.splice(index, 1);
        newImages.splice(index, 1);

        setPreviewImages(newPreviewImages);
        setFormData({
            ...formData,
            images: newImages
        });
    };

    const getCurrentLocation = () => {
        setIsUsingCurrentLocation(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    setFormData({
                        ...formData,
                        latitude: latitude.toString(),
                        longitude: longitude.toString()
                    });

                    // Use reverse geocoding to get address (this would typically use an API like Google Maps)
                    // For demo purposes, we'll set a placeholder
                    setFormData(prev => ({
                        ...prev,
                        address: 'Location detected (coordinates captured)'
                    }));

                    setIsUsingCurrentLocation(false);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setErrors({
                        ...errors,
                        location: 'Unable to get current location. Please enter manually.'
                    });
                    setIsUsingCurrentLocation(false);
                }
            );
        } else {
            setErrors({
                ...errors,
                location: 'Geolocation is not supported by your browser'
            });
            setIsUsingCurrentLocation(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (!formData.address.trim() && (!formData.latitude || !formData.longitude)) {
            newErrors.location = 'Location is required. Please use current location or enter address.';
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
            // In a real app, this would be an API call to submit the form with image uploads
            // For demo purposes, we'll simulate a successful submission
            console.log('Submitting issue:', formData);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Navigate to confirmation page or dashboard
            navigate('/dashboard/my-issues', {
                state: {
                    issueSubmitted: true,
                    message: 'Your issue has been successfully reported. You can track its status from your dashboard.'
                }
            });
        } catch (err) {
            console.error('Error submitting issue:', err);
            setErrors({
                general: 'An error occurred while submitting your issue. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="container">
                <div className="page-header">
                    <h1>Report an Issue</h1>
                    <p>
                        Report a civic issue in your community and help make your neighborhood better.
                    </p>
                </div>

                <div className="report-issue-container">
                    {errors.general && (
                        <div className="alert alert-danger">{errors.general}</div>
                    )}

                    <form onSubmit={handleSubmit} className="report-form">
                        <div className="form-group">
                            <label htmlFor="title">Issue Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={errors.title ? 'input-error' : ''}
                                placeholder="Enter a brief, descriptive title"
                                disabled={isSubmitting}
                            />
                            {errors.title && <div className="error-message">{errors.title}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={errors.description ? 'input-error' : ''}
                                placeholder="Provide details about the issue"
                                rows="4"
                                disabled={isSubmitting}
                            ></textarea>
                            {errors.description && <div className="error-message">{errors.description}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="category">Category *</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={errors.category ? 'input-error' : ''}
                                disabled={isSubmitting}
                            >
                                <option value="">Select a category</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <div className="error-message">{errors.category}</div>}
                        </div>

                        <div className="form-group">
                            <label>Location *</label>
                            <div className="location-container">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={getCurrentLocation}
                                    disabled={isSubmitting || isUsingCurrentLocation}
                                >
                                    {isUsingCurrentLocation ? 'Getting Location...' : 'Use Current Location'}
                                </button>

                                <div className="location-inputs">
                                    <div className="form-group">
                                        <label htmlFor="address">Address</label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Enter location address"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="latitude">Latitude</label>
                                            <input
                                                type="text"
                                                id="latitude"
                                                name="latitude"
                                                value={formData.latitude}
                                                onChange={handleChange}
                                                placeholder="Latitude"
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="longitude">Longitude</label>
                                            <input
                                                type="text"
                                                id="longitude"
                                                name="longitude"
                                                value={formData.longitude}
                                                onChange={handleChange}
                                                placeholder="Longitude"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {errors.location && <div className="error-message">{errors.location}</div>}
                        </div>

                        <div className="form-group">
                            <label>Images (Max 3)</label>
                            <div className="image-upload-container">
                                <button
                                    type="button"
                                    className="upload-btn"
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={isSubmitting}
                                >
                                    Upload Images
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                />
                                <span className="help-text">Upload up to 3 images of the issue</span>
                            </div>

                            {errors.images && <div className="error-message">{errors.images}</div>}

                            {previewImages.length > 0 && (
                                <div className="image-preview-container">
                                    {previewImages.map((src, index) => (
                                        <div key={index} className="image-preview">
                                            <img src={src} alt={`Preview ${index + 1}`} />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => removeImage(index)}
                                                disabled={isSubmitting}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate(-1)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                            </button>
                        </div>
                    </form>

                    <div className="report-guidelines">
                        <h3>Guidelines for Reporting</h3>
                        <ul>
                            <li>Be clear and specific about the issue</li>
                            <li>Include photos to help officials understand the problem</li>
                            <li>Provide accurate location information</li>
                            <li>Avoid including personal information of others</li>
                            <li>Report emergency situations to appropriate authorities directly</li>
                        </ul>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ReportIssue;
