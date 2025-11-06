import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';
import ProductForm from './ProductForm';
import Modal from '../Common/Modal';
import LoadingSpinner from '../Common/LoadingSpinner';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [archivedProducts, setArchivedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetchData();
    }, [showArchived]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cData] = await Promise.all([
                apiCallWithAuth('/products/categories', token)
            ]);

            if (showArchived) {
                const pData = await apiCallWithAuth('/products/archived/list', token);
                setArchivedProducts(pData);
            } else {
                const pData = await apiCallWithAuth('/products', token);
                setProducts(pData);
            }

            setCategories(cData);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm('Produkt wirklich archivieren?')) return;
        try {
            await apiCallWithAuth(`/products/${id}`, token, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm('Produkt wiederherstellen?')) return;
        try {
            await apiCallWithAuth(`/products/${id}/restore`, token, { method: 'PUT' });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const displayProducts = showArchived ? archivedProducts : products;

    // Hierarchische Gruppierung
    const getMainCategories = () => {
        return categories.filter(cat => !cat.parent_id);
    };

    const getSubCategories = (parentId) => {
        return categories.filter(cat => cat.parent_id === parentId);
    };

    const getProductsByCategory = (categoryId) => {
        return displayProducts.filter(p => p.category_id === categoryId);
    };

    const [openCategories, setOpenCategories] = useState([]);

    const toggleCategory = (categoryId) => {
        setOpenCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="content-container">
            <div className="header-actions">
                <h1>Produkte</h1>
                <div className="button-group">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="btn btn-secondary"
                    >
                        {showArchived ? 'Aktive anzeigen' : 'Archiv anzeigen'}
                    </button>
                    {!showArchived && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary"
                        >
                            + Neues Produkt
                        </button>
                    )}
                </div>
            </div>

            {displayProducts.length === 0 ? (
                <div className="empty-state">
                    {showArchived ? 'Keine archivierten Produkte' : 'Keine Produkte vorhanden'}
                </div>
            ) : (
                <div className="products-by-category">
                    {getMainCategories().map(mainCategory => {
                        const mainCategoryProducts = getProductsByCategory(mainCategory.id);
                        const subCategories = getSubCategories(mainCategory.id);
                        const hasProducts = mainCategoryProducts.length > 0 ||
                            subCategories.some(sub => getProductsByCategory(sub.id).length > 0);

                        if (!hasProducts) return null;

                        return (
                            <div key={mainCategory.id} className="category-section">
                                {/* Hauptkategorie Header */}
                                <div
                                    className="category-header-clickable"
                                    onClick={() => toggleCategory(mainCategory.id)}
                                >
                                    <h2>
                                        <span className={`toggle-icon ${openCategories.includes(mainCategory.id) ? 'open' : ''}`}>
                                            ▶
                                        </span>
                                        {mainCategory.name}
                                    </h2>
                                    {mainCategory.description && (
                                        <p className="category-description">{mainCategory.description}</p>
                                    )}
                                </div>

                                {/* Produkte der Hauptkategorie */}
                                {openCategories.includes(mainCategory.id) && (
                                    <>
                                        {mainCategoryProducts.length > 0 && (
                                            <div className="products-grid">
                                                {mainCategoryProducts.map(product => (
                                                    <div key={product.id} className="product-card">
                                                        <div className="product-header">
                                                            <h3>{product.name}</h3>
                                                            <span className="product-price">€{product.price || 0}</span>
                                                        </div>
                                                        {product.description && (
                                                            <p className="product-description">{product.description}</p>
                                                        )}
                                                        <div className="product-actions">
                                                            {!showArchived ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => setEditingProduct(product)}
                                                                        className="btn btn-sm btn-secondary"
                                                                    >
                                                                        Bearbeiten
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleArchive(product.id)}
                                                                        className="btn btn-sm btn-danger"
                                                                    >
                                                                        Archivieren
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleRestore(product.id)}
                                                                    className="btn btn-sm btn-primary"
                                                                >
                                                                    Wiederherstellen
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Unterkategorien */}
                                        {subCategories.map(subCategory => {
                                            const subCategoryProducts = getProductsByCategory(subCategory.id);
                                            if (subCategoryProducts.length === 0) return null;

                                            return (
                                                <div key={subCategory.id} className="subcategory-section">
                                                    <h3 className="subcategory-title">
                                                        ↳ {subCategory.name}
                                                    </h3>
                                                    {subCategory.description && (
                                                        <p className="category-description-small">{subCategory.description}</p>
                                                    )}
                                                    <div className="products-grid">
                                                        {subCategoryProducts.map(product => (
                                                            <div key={product.id} className="product-card">
                                                                <div className="product-header">
                                                                    <h3>{product.name}</h3>
                                                                    <span className="product-price">€{product.price || 0}</span>
                                                                </div>
                                                                {product.description && (
                                                                    <p className="product-description">{product.description}</p>
                                                                )}
                                                                <div className="product-actions">
                                                                    {!showArchived ? (
                                                                        <>
                                                                            <button
                                                                                onClick={() => setEditingProduct(product)}
                                                                                className="btn btn-sm btn-secondary"
                                                                            >
                                                                                Bearbeiten
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleArchive(product.id)}
                                                                                className="btn btn-sm btn-danger"
                                                                            >
                                                                                Archivieren
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleRestore(product.id)}
                                                                            className="btn btn-sm btn-primary"
                                                                        >
                                                                            Wiederherstellen
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}


            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Neues Produkt"
            >
                <ProductForm
                    categories={categories}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchData();
                    }}
                    onCancel={() => setShowAddModal(false)}
                />


            </Modal>

            <Modal
                isOpen={editingProduct}
                onClose={() => setEditingProduct(false)}
                title="Neues Produkt"
            >
                <ProductForm
                    product={editingProduct}
                    categories={categories}
                    onSuccess={() => {
                        setEditingProduct(false);
                        fetchData();
                    }}
                    onCancel={() => setEditingProduct(false)}
                />


            </Modal>

        </div>
    );
}

export default ProductList;