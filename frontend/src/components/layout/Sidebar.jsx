import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
    const { isGovernment, isCitizen } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h3>Dashboard</h3>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <NavLink
                            to="/dashboard"
                            end
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            <span className="icon">📊</span>
                            <span>Overview</span>
                        </NavLink>
                    </li>

                    {isCitizen && (
                        <>
                            <li>
                                <NavLink
                                    to="/dashboard/my-issues"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span className="icon">📝</span>
                                    <span>My Issues</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/dashboard/notifications"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span className="icon">🔔</span>
                                    <span>Notifications</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/report-issue"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span className="icon">➕</span>
                                    <span>Report New Issue</span>
                                </NavLink>
                            </li>
                        </>
                    )}

                    {isGovernment && (
                        <>
                            <li>
                                <NavLink
                                    to="/dashboard/pending-issues"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span className="icon">⏳</span>
                                    <span>Pending Issues</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/dashboard/resolved-issues"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span className="icon">✅</span>
                                    <span>Resolved Issues</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/dashboard/analytics"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span className="icon">📈</span>
                                    <span>Analytics</span>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/dashboard/alerts"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span className="icon">🚨</span>
                                    <span>Manage Alerts</span>
                                </NavLink>
                            </li>
                        </>
                    )}

                    <li className="divider"></li>

                    <li>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            <span className="icon">👤</span>
                            <span>Profile</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => isActive ? 'active' : ''}
                        >
                            <span className="icon">⚙️</span>
                            <span>Settings</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
