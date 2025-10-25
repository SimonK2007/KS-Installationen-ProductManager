import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <h2 style={styles.logo}>Kundenverwaltung</h2>

                <div style={styles.links}>
                    <Link
                        to="/"
                        style={{ ...styles.link, ...(isActive('/') && styles.activeLink) }}
                    >
                        Kunden
                    </Link>
                    <Link
                        to="/products"
                        style={{ ...styles.link, ...(isActive('/products') && styles.activeLink) }}
                    >
                        Produkte
                    </Link>
                </div>

                <div style={styles.userSection}>
                    <button onClick={toggleTheme} style={styles.themeButton} title="Dark Mode umschalten">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <span style={styles.userEmail}>{user?.email}</span>
                    <button onClick={logout} style={styles.logoutBtn}>
                        Abmelden
                    </button>
                </div>
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        backgroundColor: 'var(--color-surface)',
        padding: '1rem 0',
        boxShadow: 'var(--shadow-md)',
        borderBottom: '1px solid var(--color-card-border)',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    logo: {
        color: 'var(--color-text)',
        margin: 0,
        fontSize: 'var(--font-size-xl)',
    },
    links: {
        display: 'flex',
        gap: '20px',
    },
    link: {
        color: 'var(--color-text)',
        textDecoration: 'none',
        padding: '8px 16px',
        borderRadius: 'var(--radius-base)',
        transition: 'all var(--duration-fast) var(--ease-standard)',
        fontWeight: 'var(--font-weight-medium)',
    },
    activeLink: {
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-btn-primary-text)',
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    themeButton: {
        width: '40px',
        height: '40px',
        backgroundColor: 'var(--color-secondary)',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        fontSize: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all var(--duration-fast) var(--ease-standard)',
    },
    userEmail: {
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
        display: 'none',
    },
    logoutBtn: {
        padding: '8px 16px',
        backgroundColor: 'var(--color-error)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
    },
    '@media (min-width: 640px)': {
        userEmail: {
            display: 'inline',
        },
    },
};

export default Navbar;