import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';
import CategoryForm from './CategoryForm';
import Modal from '../Common/Modal';
import LoadingSpinner from '../Common/LoadingSpinner';

function CategoryList() {
    const [categories, setCategories] = useState([]);
    const [archivedCategories, setArchivedCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetchData();
    }, [showArchived]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pData] = await Promise.all([
                apiCallWithAuth('/products', token)
            ]);

            if (showArchived) {
                const cData = await apiCallWithAuth('/products/categories/archived', token);
                setArchivedCategories(cData);
            } else {
                const cData = await apiCallWithAuth('/products/categories', token);
                setCategories(cData);
            }

            setProducts(pData);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm('Kategorie wirklich archivieren?')) return;

        try {
            await apiCallWithAuth(`/products/categories/${id}`, token, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm('Kategorie wiederherstellen?')) return;

        try {
            await apiCallWithAuth(`/products/categories/${id}/restore`, token, { method: 'PUT' });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const getProductCount = (categoryId) => {
        return products.filter(p => p.category_id === categoryId).length;
    };

    const displayCategories = showArchived ? archivedCategories : categories;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Kategorien</h1>
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
                        + Neue Kategorie
                    </button>
                </div>
            </div>

            {displayCategories.length === 0 ? (
                <div className="empty-state">
                    <p>{showArchived ? 'Keine archivierten Kategorien' : 'Keine Kategorien vorhanden'}</p>
                </div>
            ) : (
                <div className="card-grid">
                    {displayCategories.map(category => (
                        <div key={category.id} className="card">
                            <div className="card-header">
                                <h3>{category.name}</h3>
                                <div>
                                    {showArchived && <span className="badge badge-warning">Archiviert</span>}
                                    {!showArchived && (
                                        <span className="badge badge-info">
                                            {getProductCount(category.id)} Produkte
                                        </span>
                                    )}
                                </div>
                            </div>
                            {category.description && (
                                <div className="card-body">
                                    <p className="text-muted">{category.description}</p>
                                </div>
                            )}
                            <div className="card-actions">
                                {!showArchived && (
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={() => handleArchive(category.id)}
                                    >
                                        Archivieren
                                    </button>
                                )}
                                {showArchived && (
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleRestore(category.id)}
                                    >
                                        Wiederherstellen
                                    </button>
                                )}
                            </div>
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
