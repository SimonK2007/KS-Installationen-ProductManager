import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';
import CategoryForm from './CategoryForm';
import Modal from '../Common/Modal';
import LoadingSpinner from '../Common/LoadingSpinner';

function CategoryList() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cData, pData] = await Promise.all([
                apiCallWithAuth('/products/categories', token),
                apiCallWithAuth('/products', token)
            ]);
            setCategories(cData);
            setProducts(pData);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getProductCount = (categoryId) => {
        return products.filter(p => p.category_id === categoryId).length;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Kategorien</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                >
                    + Neue Kategorie
                </button>
            </div>
            {categories.length === 0 ? (
                <div className="empty-state">
                    <p>Keine Kategorien vorhanden</p>
                </div>
            ) : (
                <div className="card-grid">
                    {categories.map(category => (
                        <div key={category.id} className="card">
                            <div className="card-header">
                                <h3>{category.name}</h3>
                                <span className="badge badge-info">
                                    {getProductCount(category.id)} Produkte
                                </span>
                            </div>
                            {category.description && (
                                <div className="card-body">
                                    <p className="text-muted">{category.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Neue Kategorie"
            >
                <CategoryForm
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchData();
                    }}
                    onCancel={() => setShowAddModal(false)}
                />
            </Modal>
        </div>
    );
}

export default CategoryList;
