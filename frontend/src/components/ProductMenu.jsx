import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProductMenu = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, [customerId]);

    const fetchData = async () => {
        try {
            const [customerRes, categoriesRes, productsRes] = await Promise.all([
                axios.get(`${API_URL}/customers/${customerId}`),
                axios.get(`${API_URL}/products/categories`),
                axios.get(`${API_URL}/products`)
            ]);

            setCustomer(customerRes.data);
            setCategories(categoriesRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            showToast('Fehler beim Laden der Daten', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    const handleQuantityChange = (productId, change) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(0, (prev[productId] || 0) + change)
        }));
    };

    const handleAddProduct = async (productId, productName) => {
        const quantity = quantities[productId] || 1;

        if (quantity === 0) {
            showToast('Anzahl muss mindestens 1 sein', 'error');
            return;
        }

        try {
            // Mehrfach hinzufügen basierend auf Anzahl
            for (let i = 0; i < quantity; i++) {
                await axios.post(`${API_URL}/customer-products`, {
                    customer_id: customerId,
                    product_id: productId
                });
            }

            showToast(`${quantity}x "${productName}" hinzugefügt`, 'success');
            setQuantities(prev => ({ ...prev, [productId]: 0 }));
        } catch (error) {
            showToast('Fehler beim Hinzufügen', 'error');
        }
    };

    const filteredProducts = selectedCategory
        ? products.filter(p => p.category_id === selectedCategory)
        : [];

    if (loading) {
        return <div style={styles.loading}>
            <div style={styles.spinner}></div>
        </div>;
    }

    return (
        <div style={styles.container}>
            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    ...styles.toast,
                    ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)
                }}>
                    <span style={styles.toastIcon}>
                        {toast.type === 'success' ? '✓' : '⚠'}
                    </span>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div style={styles.header}>
                <button onClick={() => navigate('/')} style={styles.backButton}>
                    ← Zurück
                </button>
                <h1 style={styles.title}>Produkte für {customer?.name}</h1>
            </div>

            {!selectedCategory ? (
                <div style={styles.content}>
                    <h2 style={styles.subtitle}>Kategorie wählen</h2>
                    <div style={styles.categoryGrid}>
                        {categories.map(category => {
                            const categoryProducts = products.filter(
                                p => p.category_id === category.id
                            );
                            return (
                                <div
                                    key={category.id}
                                    style={styles.categoryCard}
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    <div style={styles.categoryIcon}>📦</div>
                                    <h3 style={styles.categoryName}>{category.name}</h3>
                                    {category.description && (
                                        <p style={styles.categoryDesc}>{category.description}</p>
                                    )}
                                    <div style={styles.categoryBadge}>
                                        {categoryProducts.length} Produkt(e)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div style={styles.content}>
                    <div style={styles.headerRow}>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            style={styles.backButton}
                        >
                            ← Kategorien
                        </button>
                        <h2 style={styles.subtitle}>
                            {categories.find(c => c.id === selectedCategory)?.name}
                        </h2>
                    </div>

                    <div style={styles.productGrid}>
                        {filteredProducts.map(product => {
                            const currentQty = quantities[product.id] || 0;

                            return (
                                <div key={product.id} style={styles.productCard}>
                                    <div style={styles.productHeader}>
                                        <h3 style={styles.productName}>{product.name}</h3>
                                        {product.price > 0 && (
                                            <div style={styles.price}>
                                                CHF {product.price.toFixed(2)}
                                            </div>
                                        )}
                                    </div>

                                    {product.description && (
                                        <p style={styles.productDesc}>{product.description}</p>
                                    )}

                                    <div style={styles.productFooter}>
                                        <div style={styles.quantityControl}>
                                            <button
                                                onClick={() => handleQuantityChange(product.id, -1)}
                                                style={styles.quantityBtn}
                                                disabled={currentQty <= 0}
                                            >
                                                −
                                            </button>
                                            <span style={styles.quantityDisplay}>{currentQty}</span>
                                            <button
                                                onClick={() => handleQuantityChange(product.id, 1)}
                                                style={styles.quantityBtn}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleAddProduct(product.id, product.name)}
                                            style={styles.addButton}
                                            disabled={currentQty === 0}
                                        >
                                            {currentQty === 0 ? 'Anzahl wählen' : 'Hinzufügen'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div style={styles.empty}>
                            <div style={styles.emptyIcon}>📭</div>
                            <p>Keine Produkte in dieser Kategorie</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        paddingBottom: '2rem',
    },
    header: {
        backgroundColor: 'var(--color-surface)',
        padding: '1rem',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid var(--color-card-border)',
    },
    title: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: '0.5rem 0 0 0',
    },
    subtitle: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        marginBottom: '1.5rem',
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem 1rem',
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
    },
    backButton: {
        padding: 'var(--space-8) var(--space-16)',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-btn-primary-text)',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        cursor: 'pointer',
        transition: 'all var(--duration-fast) var(--ease-standard)',
        boxShadow: 'var(--shadow-sm)',
    },
    categoryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
    },
    categoryCard: {
        backgroundColor: 'var(--color-surface)',
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-card-border)',
        cursor: 'pointer',
        transition: 'all var(--duration-normal) var(--ease-standard)',
        textAlign: 'center',
    },
    categoryIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    categoryName: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: '0.5rem 0',
    },
    categoryDesc: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        margin: '0.5rem 0',
    },
    categoryBadge: {
        display: 'inline-block',
        marginTop: '1rem',
        padding: 'var(--space-6) var(--space-16)',
        backgroundColor: 'var(--color-secondary)',
        color: 'var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
    },
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.25rem',
    },
    productCard: {
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-card-border)',
        transition: 'all var(--duration-normal) var(--ease-standard)',
    },
    productHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '0.75rem',
        gap: '1rem',
    },
    productName: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: 0,
        flex: 1,
    },
    price: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--color-success)',
    },
    productDesc: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        margin: '0.5rem 0 1.25rem 0',
        lineHeight: 'var(--line-height-normal)',
    },
    productFooter: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
    },
    quantityControl: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-8)',
        backgroundColor: 'var(--color-secondary)',
        borderRadius: 'var(--radius-base)',
        padding: 'var(--space-4)',
    },
    quantityBtn: {
        width: '36px',
        height: '36px',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-primary)',
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        cursor: 'pointer',
        transition: 'all var(--duration-fast) var(--ease-standard)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityDisplay: {
        minWidth: '40px',
        textAlign: 'center',
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
    },
    addButton: {
        flex: 1,
        padding: 'var(--space-12)',
        backgroundColor: 'var(--color-success)',
        color: 'var(--color-btn-primary-text)',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-semibold)',
        cursor: 'pointer',
        transition: 'all var(--duration-fast) var(--ease-standard)',
        boxShadow: 'var(--shadow-sm)',
    },
    toast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: 'var(--space-12) var(--space-20)',
        borderRadius: 'var(--radius-base)',
        color: 'white',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-base)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-12)',
    },
    toastSuccess: {
        backgroundColor: 'var(--color-success)',
    },
    toastError: {
        backgroundColor: 'var(--color-error)',
    },
    toastIcon: {
        fontSize: 'var(--font-size-xl)',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
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

export default ProductMenu;
