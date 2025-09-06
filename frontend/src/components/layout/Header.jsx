import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const Header = () => {
    const { isAuthenticated, logout, user, isGovernment, isCitizen } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    // Check if the current route is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    <Link to="/" className="logo">
                        <h1>CivicPulse</h1>
                    </Link>

                    <nav className="main-nav">
                        <ul className="nav-links">
                            <li>
                                <Link to="/" className={isActive('/') ? 'active' : ''}>
                                    Home
                                </Link>
                            </li>

                            {isAuthenticated && (
                                <li>
                                    <Link
                                        to="/dashboard"
                                        className={isActive('/dashboard') ? 'active' : ''}
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                            )}

                            {isAuthenticated && isCitizen && (
                                <li>
                                    <Link
                                        to="/report-issue"
                                        className={isActive('/report-issue') ? 'active' : ''}
                                    >
                                        Report Issue
                                    </Link>
                                </li>
                            )}

                            {isAuthenticated && isGovernment && (
                                <li>
                                    <Link
                                        to="/analytics"
                                        className={isActive('/analytics') ? 'active' : ''}
                                    >
                                        Analytics
                                    </Link>
                                </li>
                            )}

                            <li>
                                <Link
                                    to="/about"
                                    className={isActive('/about') ? 'active' : ''}
                                >
                                    About
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div className="header-actions">
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>

                        {isAuthenticated ? (
                            <div className="user-menu">
                                <Link to="/profile" className="profile-link">
                                    <div className="avatar">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <span className="user-name">{user?.name || 'User'}</span>
                                </Link>
                                <button onClick={logout} className="logout-btn">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn btn-primary">
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-outline">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
