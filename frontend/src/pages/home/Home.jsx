import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';

const Home = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Sample data for UI demonstration
    const recentIssues = [
        {
            id: 1,
            title: 'Pothole on Main Street',
            category: 'Roads',
            location: 'Main St & 5th Ave',
            status: 'In Progress',
            date: '2023-04-15',
            upvotes: 24
        },
        {
            id: 2,
            title: 'Broken Streetlight',
            category: 'Electricity',
            location: 'Park Avenue',
            status: 'Pending',
            date: '2023-04-14',
            upvotes: 15
        },
        {
            id: 3,
            title: 'Garbage Collection Missed',
            category: 'Sanitation',
            location: 'River Road',
            status: 'Resolved',
            date: '2023-04-10',
            upvotes: 32
        }
    ];

    const alerts = [
        {
            id: 1,
            title: 'Scheduled Water Outage',
            description: 'Water supply will be disrupted in the downtown area on Sunday from 10 AM to 2 PM due to maintenance work.',
            severity: 'medium',
            date: '2023-04-18'
        },
        {
            id: 2,
            title: 'Road Closure Alert',
            description: 'Main Street will be closed for resurfacing from April 20-25. Please use alternate routes.',
            severity: 'high',
            date: '2023-04-20'
        }
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        // Implement search functionality
        console.log('Searching for:', searchQuery);
    };

    // Function to determine status class for styling
    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'resolved':
                return 'status-resolved';
            case 'in progress':
                return 'status-progress';
            case 'pending':
                return 'status-pending';
            default:
                return '';
        }
    };

    // Function to determine alert severity class
    const getSeverityClass = (severity) => {
        switch (severity.toLowerCase()) {
            case 'high':
                return 'severity-high';
            case 'medium':
                return 'severity-medium';
            case 'low':
                return 'severity-low';
            default:
                return '';
        }
    };

    return (
        <MainLayout>
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Report & Track Civic Issues in Your Community</h1>
                        <p>
                            A collaborative platform connecting citizens and government officials to
                            efficiently report, track, and resolve community issues.
                        </p>

                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Get Started
                            </Link>
                            <Link to="/about" className="btn btn-outline btn-lg">
                                Learn More
                            </Link>
                        </div>

                        <div className="search-container">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="Search for issues by location, category or keyword..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary">
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="hero-image">
                        {/* Placeholder for hero image */}
                        <div className="image-placeholder">
                            <span>Community Issue Reporting</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="container">
                    <h2>How It Works</h2>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📷</div>
                            <h3>Report Issues</h3>
                            <p>
                                Easily report community issues with photos, location, and descriptions
                                through our mobile-friendly platform.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔍</div>
                            <h3>Track Progress</h3>
                            <p>
                                Follow the status of reported issues and receive real-time updates
                                as they move toward resolution.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🤝</div>
                            <h3>Collaborate</h3>
                            <p>
                                Work together with government officials and fellow citizens to
                                address and resolve community challenges.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>View Analytics</h3>
                            <p>
                                Access data visualizations showing issue patterns, resolution times,
                                and community improvements over time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="recent-issues">
                <div className="container">
                    <div className="section-header">
                        <h2>Recent Issues</h2>
                        <Link to="/issues" className="btn btn-outline">
                            View All
                        </Link>
                    </div>

                    <div className="issue-grid">
                        {recentIssues.map((issue) => (
                            <div key={issue.id} className="issue-card">
                                <div className="issue-header">
                                    <span className={`status-badge ${getStatusClass(issue.status)}`}>
                                        {issue.status}
                                    </span>
                                    <span className="category-tag">{issue.category}</span>
                                </div>

                                <h3 className="issue-title">
                                    <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                                </h3>

                                <div className="issue-details">
                                    <div className="issue-location">
                                        <span className="icon">📍</span>
                                        <span>{issue.location}</span>
                                    </div>

                                    <div className="issue-date">
                                        <span className="icon">📅</span>
                                        <span>{issue.date}</span>
                                    </div>
                                </div>

                                <div className="issue-actions">
                                    <button className="upvote-btn">
                                        <span className="icon">👍</span>
                                        <span>{issue.upvotes}</span>
                                    </button>

                                    <Link to={`/issues/${issue.id}`} className="btn btn-sm">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="alerts-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Public Alerts</h2>
                        <Link to="/alerts" className="btn btn-outline">
                            View All
                        </Link>
                    </div>

                    <div className="alerts-container">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`alert-card ${getSeverityClass(alert.severity)}`}
                            >
                                <div className="alert-header">
                                    <h3>{alert.title}</h3>
                                    <span className="alert-date">{alert.date}</span>
                                </div>
                                <p className="alert-description">{alert.description}</p>
                                <Link to={`/alerts/${alert.id}`} className="btn btn-sm">
                                    More Info
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="stats-section">
                <div className="container">
                    <h2>Community Impact</h2>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">1,200+</div>
                            <div className="stat-label">Issues Reported</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-number">85%</div>
                            <div className="stat-label">Resolution Rate</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-number">5,000+</div>
                            <div className="stat-label">Active Users</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-number">48hrs</div>
                            <div className="stat-label">Avg. Response Time</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Improve Your Community?</h2>
                        <p>
                            Join thousands of citizens and government officials working together
                            to create better, safer, and more responsive communities.
                        </p>
                        <div className="cta-buttons">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Sign Up Now
                            </Link>
                            <Link to="/contact" className="btn btn-outline btn-lg">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
};

export default Home;
