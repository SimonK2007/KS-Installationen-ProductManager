import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showProductForm, setShowProductForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        category_id: '',
        price: '',
        description: ''
    });
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: ''
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                axios.get(`${API_URL}/products/all`),
                axios.get(`${API_URL}/products/categories`)
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            alert('Fehler beim Laden der Daten');
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/products`, productForm);
            setProductForm({
                name: '',
                category_id: '',
                price: '',
                description: ''
            });
            setShowProductForm(false);
            fetchData();
        } catch (error) {
            alert('Fehler beim Erstellen des Produkts');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/products/categories`, categoryForm);
            setCategoryForm({ name: '', description: '' });
            setShowCategoryForm(false);
            fetchData();
        } catch (error) {
            alert('Fehler beim Erstellen der Kategorie');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Produkt wirklich deaktivieren?')) {
            try {
                await axios.delete(`${API_URL}/products/${id}`);
                fetchData();
            } catch (error) {
                alert('Fehler beim Deaktivieren des Produkts');
            }
        }
    };

    const activeProducts = products.filter(p => p.is_active === 1);
    const inactiveProducts = products.filter(p => p.is_active === 0);

    return (
        <div style={styles.container}>
            <h1 style={styles.mainTitle}>Produktverwaltung</h1>

            {/* Kategorie-Verwaltung */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Kategorien</h2>
                    <button
                        onClick={() => setShowCategoryForm(!showCategoryForm)}
                        style={styles.addButton}
                    >
                        {showCategoryForm ? 'Abbrechen' : '+ Neue Kategorie'}
                    </button>
                </div>

                {showCategoryForm && (
                    <form onSubmit={handleCategorySubmit} style={styles.form}>
                        <input
                            type="text"
                            placeholder="Kategoriename *"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({
                                ...categoryForm,
                                name: e.target.value
                            })}
                            required
                            style={styles.input}
                        />
                        <input
                            type="text"
                            placeholder="Beschreibung"
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({
                                ...categoryForm,
                                description: e.target.value
                            })}
                            style={styles.input}
                        />
                        <button type="submit" style={styles.submitButton}>
                            Kategorie erstellen
                        </button>
                    </form>
                )}

                <div style={styles.categoryList}>
                    {categories.map(cat => (
                        <div key={cat.id} style={styles.categoryItem}>
                            <strong style={styles.categoryName}>{cat.name}</strong>
                            {cat.description && <p style={styles.categoryDesc}>{cat.description}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Produkt-Verwaltung */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Produkte</h2>
                    <button
                        onClick={() => setShowProductForm(!showProductForm)}
                        style={styles.addButton}
                    >
                        {showProductForm ? 'Abbrechen' : '+ Neues Produkt'}
                    </button>
                </div>

                {showProductForm && (
                    <form onSubmit={handleProductSubmit} style={styles.form}>
                        <input
                            type="text"
                            placeholder="Produktname *"
                            value={productForm.name}
                            onChange={(e) => setProductForm({
                                ...productForm,
                                name: e.target.value
                            })}
                            required
                            style={styles.input}
                        />
                        <select
                            value={productForm.category_id}
                            onChange={(e) => setProductForm({
                                ...productForm,
                                category_id: e.target.value
                            })}
                            required
                            style={styles.input}
                        >
                            <option value="">Kategorie wählen *</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Preis (CHF)"
                            value={productForm.price}
                            onChange={(e) => setProductForm({
                                ...productForm,
                                price: e.target.value
                            })}
                            style={styles.input}
                        />
                        <textarea
                            placeholder="Beschreibung"
                            value={productForm.description}
                            onChange={(e) => setProductForm({
                                ...productForm,
                                description: e.target.value
                            })}
                            style={{ ...styles.input, ...styles.textarea }}
                        />
                        <button type="submit" style={styles.submitButton}>
                            Produkt erstellen
                        </button>
                    </form>
                )}

                {/* Aktive Produkte */}
                <h3 style={styles.subsectionTitle}>Aktive Produkte ({activeProducts.length})</h3>
                <div style={styles.productGrid}>
                    {activeProducts.map(product => (
                        <div key={product.id} style={styles.productCard}>
                            <h4 style={styles.productName}>{product.name}</h4>
                            <p style={styles.productCategory}>{product.category_name}</p>
                            {product.description && (
                                <p style={styles.productDesc}>{product.description}</p>
                            )}
                            <p style={styles.productPrice}>CHF {product.price.toFixed(2)}</p>
                            <button
                                onClick={() => handleDeleteProduct(product.id)}
                                style={styles.deleteButton}
                            >
                                Deaktivieren
                            </button>
                        </div>
                    ))}
                </div>

                {/* Inaktive Produkte */}
                {inactiveProducts.length > 0 && (
                    <>
                        <h3 style={{ ...styles.subsectionTitle, marginTop: '2rem' }}>
                            Inaktive Produkte ({inactiveProducts.length})
                        </h3>
                        <div style={styles.productGrid}>
                            {inactiveProducts.map(product => (
                                <div key={product.id} style={styles.inactiveCard}>
                                    <h4 style={styles.productName}>{product.name}</h4>
                                    <p style={styles.productCategory}>{product.category_name}</p>
                                    <p style={styles.inactiveLabel}>DEAKTIVIERT</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem 1rem',
    },
    mainTitle: {
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        marginBottom: '2rem',
    },
    section: {
        backgroundColor: 'var(--color-surface)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-card-border)',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    sectionTitle: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: 0,
    },
    subsectionTitle: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-text)',
        marginBottom: '1rem',
    },
    addButton: {
        padding: 'var(--space-10) var(--space-20)',
        backgroundColor: 'var(--color-success)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--duration-fast) var(--ease-standard)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.5rem',
        backgroundColor: 'var(--color-secondary)',
        borderRadius: 'var(--radius-base)',
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
        padding: 'var(--space-10)',
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
    categoryList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
    },
    categoryItem: {
        padding: 'var(--space-16)',
        backgroundColor: 'var(--color-secondary)',
        borderRadius: 'var(--radius-base)',
        borderLeft: '4px solid var(--color-primary)',
    },
    categoryName: {
        color: 'var(--color-text)',
        fontSize: 'var(--font-size-base)',
        display: 'block',
        marginBottom: '0.5rem',
    },
    categoryDesc: {
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
        margin: 0,
    },
    productGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1.25rem',
        marginTop: '1rem',
    },
    productCard: {
        padding: '1.25rem',
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--radius-base)',
        backgroundColor: 'var(--color-background)',
        transition: 'all var(--duration-normal) var(--ease-standard)',
    },
    inactiveCard: {
        padding: '1.25rem',
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--radius-base)',
        backgroundColor: 'var(--color-secondary)',
        opacity: 0.7,
    },
    productName: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: '0 0 0.5rem 0',
    },
    productCategory: {
        color: 'var(--color-primary)',
        fontSize: 'var(--font-size-sm)',
        margin: '0.5rem 0',
    },
    productDesc: {
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)',
        margin: '0.75rem 0',
    },
    productPrice: {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--color-success)',
        margin: '0.75rem 0',
    },
    deleteButton: {
        width: '100%',
        padding: 'var(--space-8)',
        backgroundColor: 'var(--color-error)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-base)',
        cursor: 'pointer',
        marginTop: '0.75rem',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        transition: 'all var(--duration-fast) var(--ease-standard)',
    },
    inactiveLabel: {
        color: 'var(--color-error)',
        fontWeight: 'var(--font-weight-bold)',
        fontSize: 'var(--font-size-xs)',
        marginTop: '0.75rem',
    },
};

export default ProductManager;
