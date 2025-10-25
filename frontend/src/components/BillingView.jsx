import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BillingView = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [customerProducts, setCustomerProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, [customerId]);

    const fetchData = async () => {
        try {
            const [customerRes, productsRes] = await Promise.all([
                axios.get(`${API_URL}/customers/${customerId}`),
                axios.get(`${API_URL}/customer-products/customer/${customerId}`)
            ]);

            setCustomer(customerRes.data);
            setCustomerProducts(productsRes.data);
        } catch (error) {
            alert('Fehler beim Laden der Daten');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBilled = async (id) => {
        try {
            await axios.put(`${API_URL}/customer-products/${id}/toggle-billed`);
            fetchData();
        } catch (error) {
            alert('Fehler beim Aktualisieren des Status');
        }
    };

    const handleDecrease = async (id) => {
        try {
            await axios.put(`${API_URL}/customer-products/${id}/decrease`);
            fetchData();
        } catch (error) {
            alert('Fehler beim Verringern der Anzahl');
        }
    };

    const calculateTotal = (items) => {
        return items.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
        );
    };

    const unbilledItems = customerProducts.filter(cp => cp.is_billed === 0);
    const billedItems = customerProducts.filter(cp => cp.is_billed === 1);

    if (loading) {
        return <div style={styles.loading}>Lädt...</div>;
    }

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/')} style={styles.backButton}>
                ← Zurück zur Übersicht
            </button>

            <h1>Abrechnung für {customer?.name}</h1>

            {/* Nicht verrechnete Produkte */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    Nicht verrechnet ({unbilledItems.length})
                </h2>
                {unbilledItems.length > 0 ? (
                    <div>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Produkt</th>
                                    <th style={styles.th}>Kategorie</th>
                                    <th style={styles.th}>Anzahl</th>
                                    <th style={styles.th}>Einzelpreis</th>
                                    <th style={styles.th}>Total</th>
                                    <th style={styles.th}>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unbilledItems.map(item => (
                                    <tr key={item.id}>
                                        <td style={styles.td}>
                                            {item.product_name}
                                            {item.is_active === 0 && (
                                                <span style={styles.inactiveBadge}> (Inaktiv)</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{item.category_name}</td>
                                        <td style={styles.td}>
                                            <div style={styles.quantityControl}>
                                                <button
                                                    onClick={() => handleDecrease(item.id)}
                                                    style={styles.quantityButton}
                                                >
                                                    -
                                                </button>
                                                <span style={styles.quantity}>{item.quantity}</span>
                                                <span style={styles.quantityButton}></span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>CHF {item.price.toFixed(2)}</td>
                                        <td style={styles.td}>
                                            CHF {(item.price * item.quantity).toFixed(2)}
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => handleToggleBilled(item.id)}
                                                style={styles.checkButton}
                                            >
                                                ✓ Verrechnet
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={styles.total}>
                            <strong>Summe nicht verrechnet: </strong>
                            CHF {calculateTotal(unbilledItems).toFixed(2)}
                        </div>
                    </div>
                ) : (
                    <p style={styles.empty}>Keine nicht verrechneten Produkte</p>
                )}
            </div>

            {/* Verrechnete Produkte */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    Bereits verrechnet ({billedItems.length})
                </h2>
                {billedItems.length > 0 ? (
                    <div>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Produkt</th>
                                    <th style={styles.th}>Kategorie</th>
                                    <th style={styles.th}>Anzahl</th>
                                    <th style={styles.th}>Einzelpreis</th>
                                    <th style={styles.th}>Total</th>
                                    <th style={styles.th}>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billedItems.map(item => (
                                    <tr key={item.id} style={styles.billedRow}>
                                        <td style={styles.td}>
                                            {item.product_name}
                                            {item.is_active === 0 && (
                                                <span style={styles.inactiveBadge}> (Inaktiv)</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{item.category_name}</td>
                                        <td style={styles.td}>{item.quantity}</td>
                                        <td style={styles.td}>CHF {item.price.toFixed(2)}</td>
                                        <td style={styles.td}>
                                            CHF {(item.price * item.quantity).toFixed(2)}
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => handleToggleBilled(item.id)}
                                                style={styles.uncheckButton}
                                            >
                                                ↶ Zurücksetzen
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={styles.total}>
                            <strong>Summe verrechnet: </strong>
                            CHF {calculateTotal(billedItems).toFixed(2)}
                        </div>
                    </div>
                ) : (
                    <p style={styles.empty}>Noch keine verrechneten Produkte</p>
                )}
            </div>

            {/* Gesamtsumme */}
            <div style={styles.grandTotal}>
                <h3>GESAMTSUMME: CHF {calculateTotal(customerProducts).toFixed(2)}</h3>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
    },
    backButton: {
        padding: '8px 16px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '20px',
    },
    section: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
        marginBottom: '20px',
        color: '#333',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #dee2e6',
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #dee2e6',
    },
    billedRow: {
        backgroundColor: '#f8f9fa',
    },
    quantityControl: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    quantityButton: {
        width: '30px',
        height: '30px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    quantity: {
        fontWeight: 'bold',
        minWidth: '30px',
        textAlign: 'center',
    },
    checkButton: {
        padding: '6px 12px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    uncheckButton: {
        padding: '6px 12px',
        backgroundColor: '#ffc107',
        color: '#333',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    inactiveBadge: {
        color: '#dc3545',
        fontSize: '12px',
        fontStyle: 'italic',
    },
    total: {
        textAlign: 'right',
        marginTop: '15px',
        fontSize: '18px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
    },
    grandTotal: {
        backgroundColor: '#28a745',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
    },
    empty: {
        textAlign: 'center',
        padding: '20px',
        color: '#666',
    },
};

export default BillingView;