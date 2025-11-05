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
    const groupedProducts = categories.map(category => ({
        ...category,
        products: displayProducts.filter(p => p.category_id === category.id)
    }));

    const [openCategories, setOpenCategories] = useState([]); // IDs der geöffneten Kategorien

    const toggleCategory = (categoryId) => {
        setOpenCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };



    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Produkte</h1>
                <div>
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                        />
                        Archivierte anzeigen
                    </label>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        + Neues Produkt
                    </button>
                </div>
            </div>

            {groupedProducts.map(category => (
                <div key={category.id} className="category-section">
                    <div
                        className="category-header"
                        onClick={() => toggleCategory(category.id)}
                    >
                        <h2 style={{ margin: 0, flex: 1 }}>{category.name}</h2>
                        <span style={{ marginLeft: 12 }}>
                            {openCategories.includes(category.id) ? '▲' : '▼'}
                        </span>
                    </div>
                    {category.description && (
                        <p className="text-muted">{category.description}</p>
                    )}
                    {openCategories.includes(category.id) && category.products.length > 0 && (
                        <div className="card-grid">
                            {category.products.map(product => (
                                <div key={product.id} className="card" onClick={() => setEditingProduct(product)}>
                                    <div className="card-header">
                                        <h3>{product.name}</h3>
                                        {showArchived && (
                                            <span className="badge badge-warning">Archiviert</span>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        <p className="product-price">€{product.price || 0}</p>
                                        {product.description && (
                                            <p className="text-muted">{product.description}</p>
                                        )}
                                    </div>
                                    <div className="card-actions">
                                        {!showArchived && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => setEditingProduct(product)}
                                                >
                                                    Bearbeiten
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleArchive(product.id)
                                                    }}
                                                >
                                                    Archivieren
                                                </button>
                                            </>
                                        )}
                                        {showArchived && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRestore(product.id)
                                                }}
                                            >
                                                Wiederherstellen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {openCategories.includes(category.id) && category.products.length === 0 && (
                        <div className="empty-state"><p>Keine Produkte vorhanden</p></div>
                    )}
                </div>
            ))}


            {
                displayProducts.length === 0 && (
                    <div className="empty-state">
                        <p>{showArchived ? 'Keine archivierten Produkte' : 'Keine Produkte vorhanden'}</p>
                    </div>
                )
            }

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

            {
                editingProduct && (
                    <Modal
                        isOpen={true}
                        onClose={() => setEditingProduct(null)}
                        title="Produkt bearbeiten"
                    >
                        <ProductForm
                            product={editingProduct}
                            categories={categories}
                            onSuccess={() => {
                                setEditingProduct(null);
                                fetchData();
                            }}
                            onCancel={() => setEditingProduct(null)}
                        />
                    </Modal>
                )
            }
        </div >
    );
}

export default ProductList;
