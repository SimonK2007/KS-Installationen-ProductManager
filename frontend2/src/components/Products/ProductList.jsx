import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';
import ProductForm from './ProductForm';
import Modal from '../Common/Modal';
import LoadingSpinner from '../Common/LoadingSpinner';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [showInactive]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const endpoint = showInactive ? '/products/all' : '/products';
            const [pData, cData] = await Promise.all([
                apiCallWithAuth(endpoint, token),
                apiCallWithAuth('/products/categories', token)
            ]);
            setProducts(pData);
            setCategories(cData);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Produkt wirklich deaktivieren?')) return;

        try {
            await apiCallWithAuth(`/products/${id}`, token, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const groupedProducts = categories.map(category => ({
        ...category,
        products: products.filter(p => p.category_id === category.id)
    }));

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Produkte</h1>
                <div>
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                        />
                        Inaktive anzeigen
                    </label>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        + Neues Produkt
                    </button>
                </div>
            </div>
            {groupedProducts.map(category => {
                if (category.products.length === 0) return null;
                return (
                    <div key={category.id} className="category-section">
                        <h2>{category.name}</h2>
                        {category.description && (
                            <p className="text-muted">{category.description}</p>
                        )}
                        <div className="card-grid">
                            {category.products.map(product => (
                                <div
                                    key={product.id}
                                    className={`card ${product.is_active === 0 ? 'inactive' : ''}`}
                                >
                                    <div className="card-header">
                                        <h3>{product.name}</h3>
                                        {product.is_active === 0 && (
                                            <span className="badge badge-warning">Inaktiv</span>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        <p className="product-price">€{product.price || 0}</p>
                                        {product.description && (
                                            <p className="text-muted">{product.description}</p>
                                        )}
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => setEditingProduct(product)}
                                        >
                                            Bearbeiten
                                        </button>
                                        {product.is_active !== 0 && (
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                Deaktivieren
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {products.length === 0 && (
                <div className="empty-state">
                    <p>Keine Produkte vorhanden</p>
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
            {editingProduct && (
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
            )}
        </div>
    );
}

export default ProductList;
