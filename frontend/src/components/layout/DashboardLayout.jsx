import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="app-container">
            <Header />
            <div className="dashboard-container">
                <Sidebar />
                <main className="dashboard-content">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default DashboardLayout;
