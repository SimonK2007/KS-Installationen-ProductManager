import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        if (window.confirm('Möchten Sie sich wirklich abmelden?')) {
            logout();
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h1>CRM System</h1>
                </div>
                <button
                    className="navbar-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
                    <div className="navbar-links">
                        <Link
                            to="/kunden"
                            className={`nav-link ${isActive('/kunden') || location.pathname === '/' ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Kunden
                        </Link>
                        <Link
                            to="/produkte"
                            className={`nav-link ${isActive('/produkte') ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Produkte
                        </Link>
                        <Link
                            to="/kategorien"
                            className={`nav-link ${isActive('/kategorien') ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Kategorien
                        </Link>
                    </div>
                    <div className="navbar-actions">
                        <button
                            onClick={toggleTheme}
                            className="btn-icon"
                            aria-label="Toggle Dark Mode"
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn btn-secondary"
                        >
                            Abmelden
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
