import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';

const Dashboard = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalIssues: 0,
        pendingIssues: 0,
        resolvedIssues: 0,
        inProgressIssues: 0
    });
    const [recentIssues, setRecentIssues] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Simulate data loading
    useEffect(() => {
        // In a real app, this would be API calls
        setTimeout(() => {
            if (user?.role === 'citizen') {
                setStats({
                    totalIssues: 8,
                    pendingIssues: 3,
                    resolvedIssues: 4,
                    inProgressIssues: 1
                });
                setRecentIssues([
                    {
                        id: 1,
                        title: 'Pothole on Main Street',
                        category: 'Roads',
                        location: 'Main St & 5th Ave',
                        status: 'In Progress',
                        date: '2023-04-15',
                        updates: 2
                    },
                    {
                        id: 2,
                        title: 'Broken Streetlight',
                        category: 'Electricity',
                        location: 'Park Avenue',
                        status: 'Pending',
                        date: '2023-04-14',
                        updates: 0
                    },
                    {
                        id: 3,
                        title: 'Garbage Collection Missed',
                        category: 'Sanitation',
                        location: 'River Road',
                        status: 'Resolved',
                        date: '2023-04-10',
                        updates: 3
                    }
                ]);
            } else if (user?.role === 'government') {
                setStats({
                    totalIssues: 56,
                    pendingIssues: 23,
                    resolvedIssues: 28,
                    inProgressIssues: 5
                });
                setRecentIssues([
                    {
                        id: 1,
                        title: 'Pothole on Main Street',
                        category: 'Roads',
                        location: 'Main St & 5th Ave',
                        status: 'In Progress',
                        date: '2023-04-15',
                        reporter: 'John Doe',
                        priority: 'High'
                    },
                    {
                        id: 2,
                        title: 'Broken Streetlight',
                        category: 'Electricity',
                        location: 'Park Avenue',
                        status: 'Pending',
                        date: '2023-04-14',
                        reporter: 'Jane Smith',
                        priority: 'Medium'
                    },
                    {
                        id: 3,
                        title: 'Garbage Collection Missed',
                        category: 'Sanitation',
                        location: 'River Road',
                        status: 'Resolved',
                        date: '2023-04-10',
                        reporter: 'Michael Johnson',
                        priority: 'Low'
                    }
                ]);
            }

            setNotifications([
                {
                    id: 1,
                    message: 'Your issue "Pothole on Main Street" status changed to "In Progress"',
                    date: '2023-04-16',
                    read: false
                },
                {
                    id: 2,
                    message: 'Government official added a comment to your issue',
                    date: '2023-04-15',
                    read: true
                },
                {
                    id: 3,
                    message: 'Your issue "Garbage Collection Missed" has been resolved',
                    date: '2023-04-11',
                    read: true
                }
            ]);

            setIsLoading(false);
        }, 1000);
    }, [user]);

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

    // Function to determine priority class
    const getPriorityClass = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'priority-high';
            case 'medium':
                return 'priority-medium';
            case 'low':
                return 'priority-low';
            default:
                return '';
        }
    };

    return (
        <DashboardLayout>
            <div className="dashboard-header">
                <h1>Welcome, {user?.name || 'User'}</h1>
                <p>Here's an overview of your civic engagement activities</p>
            </div>

            {isLoading ? (
                <div className="loading-indicator">Loading dashboard data...</div>
            ) : (
                <>
                    <section className="stats-cards">
                        <div className="stat-card">
                            <div className="stat-icon total-icon">📊</div>
                            <div className="stat-content">
                                <h3>Total Issues</h3>
                                <div className="stat-number">{stats.totalIssues}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon pending-icon">⏳</div>
                            <div className="stat-content">
                                <h3>Pending</h3>
                                <div className="stat-number">{stats.pendingIssues}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon progress-icon">🔄</div>
                            <div className="stat-content">
                                <h3>In Progress</h3>
                                <div className="stat-number">{stats.inProgressIssues}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon resolved-icon">✅</div>
                            <div className="stat-content">
                                <h3>Resolved</h3>
                                <div className="stat-number">{stats.resolvedIssues}</div>
                            </div>
                        </div>
                    </section>

                    <div className="dashboard-grid">
                        <section className="recent-issues-section">
                            <div className="section-header">
                                <h2>Recent Issues</h2>
                                <Link
                                    to={user?.role === 'government' ? '/dashboard/pending-issues' : '/dashboard/my-issues'}
                                    className="btn btn-outline btn-sm"
                                >
                                    View All
                                </Link>
                            </div>

                            {recentIssues.length === 0 ? (
                                <div className="empty-state">
                                    <p>No issues found. Start by reporting a new issue!</p>
                                    {user?.role === 'citizen' && (
                                        <Link to="/report-issue" className="btn btn-primary">
                                            Report Issue
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="issue-list">
                                    {recentIssues.map((issue) => (
                                        <div key={issue.id} className="issue-card">
                                            <div className="issue-header">
                                                <span className={`status-badge ${getStatusClass(issue.status)}`}>
                                                    {issue.status}
                                                </span>
                                                <span className="category-tag">{issue.category}</span>

                                                {issue.priority && (
                                                    <span className={`priority-badge ${getPriorityClass(issue.priority)}`}>
                                                        {issue.priority}
                                                    </span>
                                                )}
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

                                                {issue.reporter && (
                                                    <div className="issue-reporter">
                                                        <span className="icon">👤</span>
                                                        <span>{issue.reporter}</span>
                                                    </div>
                                                )}

                                                {issue.updates !== undefined && (
                                                    <div className="issue-updates">
                                                        <span className="icon">💬</span>
                                                        <span>{issue.updates} updates</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="issue-actions">
                                                <Link to={`/issues/${issue.id}`} className="btn btn-sm">
                                                    View Details
                                                </Link>

                                                {user?.role === 'government' && issue.status === 'Pending' && (
                                                    <button className="btn btn-primary btn-sm">
                                                        Take Action
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="notifications-section">
                            <div className="section-header">
                                <h2>Notifications</h2>
                                <Link to="/dashboard/notifications" className="btn btn-outline btn-sm">
                                    View All
                                </Link>
                            </div>

                            {notifications.length === 0 ? (
                                <div className="empty-state">
                                    <p>No notifications yet.</p>
                                </div>
                            ) : (
                                <div className="notification-list">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        >
                                            <div className="notification-content">
                                                <p>{notification.message}</p>
                                                <span className="notification-date">{notification.date}</span>
                                            </div>
                                            {!notification.read && (
                                                <div className="notification-badge">New</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <section className="quick-actions">
                        <h2>Quick Actions</h2>
                        <div className="action-buttons">
                            {user?.role === 'citizen' && (
                                <>
                                    <Link to="/report-issue" className="btn btn-primary">
                                        Report New Issue
                                    </Link>
                                    <Link to="/dashboard/my-issues" className="btn btn-outline">
                                        View My Issues
                                    </Link>
                                </>
                            )}

                            {user?.role === 'government' && (
                                <>
                                    <Link to="/dashboard/pending-issues" className="btn btn-primary">
                                        View Pending Issues
                                    </Link>
                                    <Link to="/dashboard/analytics" className="btn btn-outline">
                                        View Analytics
                                    </Link>
                                    <Link to="/dashboard/alerts/create" className="btn btn-outline">
                                        Create Alert
                                    </Link>
                                </>
                            )}

                            <Link to="/profile" className="btn btn-outline">
                                Update Profile
                            </Link>
                        </div>
                    </section>
                </>
            )}
        </DashboardLayout>
    );
};

export default Dashboard;
