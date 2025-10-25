import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        project_type: '',
        notes: ''
    });

    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_URL}/customers`);
            setCustomers(response.data);
        } catch (error) {
            alert('Fehler beim Laden der Kunden');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/customers`, formData);
            setFormData({
                name: '',
                address: '',
                phone: '',
                email: '',
                project_type: '',
                notes: ''
            });
            setShowForm(false);
            fetchCustomers();
        } catch (error) {
            alert('Fehler beim Erstellen des Kunden');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Kunde wirklich löschen?')) {
            try {
                await axios.delete(`${API_URL}/customers/${id}`);
                fetchCustomers();
            } catch (error) {
                alert('Fehler beim Löschen des Kunden');
            }
        }
    };

    if (loading) {
        return <div style={styles.loading}>
            <div style={styles.spinner}></div>
        </div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Kunden</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={styles.addButton}
                >
                    {showForm ? 'Abbrechen' : '+ Neuer Kunde'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGrid}>
                        <input
                            type="text"
                            placeholder="Name *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={styles.input}
                        />
                        <input
                            type="text"
                            placeholder="Adresse"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            style={styles.input}
                        />
                        <input
                            type="tel"
                            placeholder="Telefon"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            style={styles.input}
                        />
                        <input
                            type="email"
                            placeholder="E-Mail"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={styles.input}
                        />
                        <input
                            type="text"
                            placeholder="Projektart"
                            value={formData.project_type}
                            onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                            style={styles.input}
                        />
                        <textarea
                            placeholder="Notizen"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            style={{ ...styles.input, ...styles.textarea }}
                        />
                    </div>
                    <button type="submit" style={styles.submitButton}>
                        Kunde erstellen
                    </button>
                </form>
            )}

            <div style={styles.grid}>
                {customers.map(customer => (
                    <div key={customer.id} style={styles.card}>
                        <h3 style={styles.cardTitle}>{customer.name}</h3>
                        <div style={styles.cardInfo}>
                            {customer.address && <p style={styles.infoText}>📍 {customer.address}</p>}
                            {customer.phone && <p style={styles.infoText}>📞 {customer.phone}</p>}
                            {customer.email && <p style={styles.infoText}>📧 {customer.email}</p>}
                            {customer.project_type && (
                                <p style={styles.infoText}><strong>Projekt:</strong> {customer.project_type}</p>
                            )}
                        </div>
                        <div style={styles.cardActions}>
                            <button
                                onClick={() => navigate(`/customer/${customer.id}/products`)}
                                style={styles.actionButton}
                            >
                                Produkte zuweisen
                            </button>
                            <button
                                onClick={() => navigate(`/customer/${customer.id}/billing`)}
                                style={{ ...styles.actionButton, ...styles.billingButton }}
                            >
                                Abrechnung
                            </button>
                            <button
                                onClick={() => handleDelete(customer.id)}
                                style={{ ...styles.actionButton, ...styles.deleteButton }}
                            >
                                Löschen
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {customers.length === 0 && (
                <div style={styles.empty}>
                    <div style={styles.emptyIcon}>📭</div>
                    <p>Keine Kunden vorhanden. Erstellen Sie einen neuen Kunden.</p>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem 1rem',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    title: {
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: 0,
    },
    addButton: {
        padding: 'var(--space-10) var(--space-20)',
        backgroundColor: 'var(--color-success)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-medium)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--duration-fast) var(--ease-standard)',
    },
    form: {
        backgroundColor: 'var(--color-surface)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-card-border)',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    input: {
        padding: 'var(--space-10)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-base)',
        fontSize: 'var(--font-size-sm)',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
        transition: 'all var(--duration-fast) var(--ease-standard)',
    },
    textarea: {
        minHeight: '80px',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    submitButton: {
        padding: 'var(--space-10) var(--space-20)',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-btn-primary-text)',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-medium)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--duration-fast) var(--ease-standard)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
    },
    card: {
        backgroundColor: 'var(--color-surface)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-card-border)',
        transition: 'all var(--duration-normal) var(--ease-standard)',
    },
    cardTitle: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: '0 0 1rem 0',
    },
    cardInfo: {
        margin: '1rem 0',
    },
    infoText: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        margin: '0.5rem 0',
    },
    cardActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginTop: '1.5rem',
    },
    actionButton: {
        padding: 'var(--space-10) var(--space-16)',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-btn-primary-text)',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        transition: 'all var(--duration-fast) var(--ease-standard)',
        boxShadow: 'var(--shadow-sm)',
    },
    billingButton: {
        backgroundColor: 'var(--color-info)',
    },
    deleteButton: {
        backgroundColor: 'var(--color-error)',
        color: 'white',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid var(--color-secondary)',
        borderTop: '4px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    empty: {
        textAlign: 'center',
        padding: '4rem 1rem',
        color: 'var(--color-text-secondary)',
    },
    emptyIcon: {
        fontSize: '4rem',
        marginBottom: '1rem',
    },
};

export default CustomerList;