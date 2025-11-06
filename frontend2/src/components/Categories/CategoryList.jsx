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
    const [showEditModal, setShowEditModal] = useState(false);
    const [editCategory, setEditCategory] = useState(null);

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

    // 🔍 DEBUGGING: Console-Logs hinzufügen
    console.log('CategoryList Render:', {
        showAddModal,
        showEditModal,
        editCategory,
        categoriesCount: displayCategories.length
    });

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
                        onClick={() => {
                            console.log('🆕 Neue Kategorie Button geklickt');
                            setShowAddModal(true);
                            console.log('showAddModal nach setzen:', true);
                        }}
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
                        <div key={category.id} className="card" onClick={() => {
                            console.log('📝 Card geklickt:', category);
                            setEditCategory(category);
                            setShowEditModal(true);
                        }}>
                            <div className="card-header">
                                <h3>{category.name}</h3>
                                <div>
                                    {showArchived && <span className="badge badge-warning">Archiviert</span>}
                                    {!showArchived && (
                                        <span className="badge">
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
                                        className="btn btn-sm btn-secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('✏️ Bearbeiten Button geklickt:', category);
                                            setEditCategory(category);
                                            setShowEditModal(true);
                                            console.log('States gesetzt:', { showEditModal: true, editCategory: category });
                                        }}
                                    >
                                        Bearbeiten
                                    </button>
                                )}

                                {!showArchived && (
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchive(category.id)
                                        }}
                                    >
                                        Archivieren
                                    </button>
                                )}

                                {showArchived && (
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRestore(category.id)
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

            {/* 🔍 DEBUGGING: Beide Modal-Prop-Varianten testen */}
            <Modal
                isOpen={showAddModal}
                show={showAddModal}
                onClose={() => {
                    console.log('❌ Add Modal schließen');
                    setShowAddModal(false);
                }}
                title="Neue Kategorie"
            >
                <CategoryForm
                    onSuccess={() => {
                        console.log('✅ Kategorie erfolgreich hinzugefügt');
                        setShowAddModal(false);
                        fetchData();
                    }}
                    onCancel={() => {
                        console.log('🚫 Abgebrochen');
                        setShowAddModal(false);
                    }}
                    initialCategory={null}
                    isEdit={false}
                />
            </Modal>

            <Modal
                isOpen={showEditModal}
                show={showEditModal}
                onClose={() => {
                    console.log('❌ Edit Modal schließen');
                    setShowEditModal(false);
                    setEditCategory(null);
                }}
                title="Kategorie bearbeiten"
            >
                <CategoryForm
                    onSuccess={() => {
                        console.log('✅ Kategorie erfolgreich bearbeitet');
                        setShowEditModal(false);
                        setEditCategory(null);
                        fetchData();
                    }}
                    onCancel={() => {
                        console.log('🚫 Bearbeiten abgebrochen');
                        setShowEditModal(false);
                        setEditCategory(null);
                    }}
                    initialCategory={editCategory}
                    isEdit={true}
                />
            </Modal>
        </div>
    );
}

export default CategoryList;