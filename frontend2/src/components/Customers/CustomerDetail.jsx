import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';
import CustomerForm from './CustomerForm';
import Modal from '../Common/Modal';
import LoadingSpinner from '../Common/LoadingSpinner';

function CustomerDetail({ customer, onClose, onUpdate }) {
    const [customerProducts, setCustomerProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [customer.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cpData, pData, cData] = await Promise.all([
                apiCallWithAuth(`/customer-products/customer/${customer.id}`, token),
                apiCallWithAuth('/products', token),
                apiCallWithAuth('/products/categories', token)
            ]);
            setCustomerProducts(cpData);
            setProducts(pData);
            setCategories(cData);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async () => {
        if (!selectedProductId) return;
        try {
            await apiCallWithAuth('/customer-products', token, {
                method: 'POST',
                body: JSON.stringify({
                    customer_id: customer.id,
                    product_id: parseInt(selectedProductId)
                })
            });
            setSelectedProductId('');
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDecrease = async (id) => {
        try {
            await apiCallWithAuth(`/customer-products/${id}/decrease`, token, {
                method: 'PUT'
            });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleBilled = async (id) => {
        try {
            await apiCallWithAuth(`/customer-products/${id}/toggle-billed`, token, {
                method: 'PUT'
            });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Produkt wirklich entfernen?')) return;
        try {
            await apiCallWithAuth(`/customer-products/${id}`, token, {
                method: 'DELETE'
            });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const totalPrice = customerProducts.reduce((sum, cp) => {
        return sum + (cp.price || 0) * cp.quantity;
    }, 0);

    const groupedProducts = categories.map(category => ({
        ...category,
        products: products.filter(p => p.category_id === category.id)
    }));

    return (
        <Modal isOpen={true} onClose={onClose} title={customer.name} size="large">
            <div className="customer-detail">
                <div className="customer-info">
                    <div className="info-row">
                        {customer.email && <p><strong>E-Mail:</strong> {customer.email}</p>}
                        {customer.phone && <p><strong>Telefon:</strong> {customer.phone}</p>}
                    </div>
                    <div className="info-row">
                        {customer.address && <p><strong>Adresse:</strong> {customer.address}</p>}
                        {customer.project_type && <p><strong>Projekttyp:</strong> {customer.project_type}</p>}
                    </div>
                    {customer.notes && (
                        <div className="info-row">
                            <p><strong>Notizen:</strong> {customer.notes}</p>
                        </div>
                    )}
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowEditModal(true)}
                    >
                        Bearbeiten
                    </button>
                </div>
                <hr />
                <div className="products-section">
                    <h3>Zugeordnete Produkte</h3>
                    <div className="add-product-form">
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="select-input"
                        >
                            <option value="">Produkt auswählen...</option>
                            {groupedProducts.map(category => (
                                <optgroup key={category.id} label={category.name}>
                                    {category.products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - €{product.price || 0}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <button
                            className="btn btn-primary"
                            onClick={handleAddProduct}
                            disabled={!selectedProductId}
                        >
                            Hinzufügen
                        </button>
                    </div>
                    {loading ? (
                        <LoadingSpinner size="small" />
                    ) : customerProducts.length === 0 ? (
                        <p className="text-muted">Keine Produkte zugeordnet</p>
                    ) : (
                        <>
                            <div className="product-list">
                                {customerProducts.map(cp => (
                                    <div key={cp.id} className={`product-item ${cp.is_billed ? 'billed' : ''}`}>
                                        <div className="product-info">
                                            <h4>{cp.product_name}</h4>
                                            <p className="text-muted">{cp.category_name}</p>
                                            <p className="product-price">
                                                €{cp.price || 0} × {cp.quantity} = €{(cp.price || 0) * cp.quantity}
                                            </p>
                                        </div>
                                        <div className="product-actions">
                                            <div className="quantity-controls">
                                                <button
                                                    className="btn btn-sm btn-icon"
                                                    onClick={() => handleDecrease(cp.id)}
                                                    title="Menge verringern"
                                                >-</button>
                                                <span className="quantity">{cp.quantity}</span>
                                                <button
                                                    className="btn btn-sm btn-icon"
                                                    onClick={handleAddProduct}
                                                    title="Menge erhöhen"
                                                >+</button>
                                            </div>
                                            <button
                                                className={`btn btn-sm ${cp.is_billed ? 'btn-success' : 'btn-warning'}`}
                                                onClick={() => handleToggleBilled(cp.id)}
                                                title={cp.is_billed ? 'Als nicht abgerechnet markieren' : 'Als abgerechnet markieren'}
                                            >{cp.is_billed ? '✓ Abgerechnet' : 'Nicht abgerechnet'}</button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRemove(cp.id)}
                                                title="Entfernen"
                                            >×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="total-price">
                                <h3>Gesamtpreis: €{totalPrice.toFixed(2)}</h3>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Kunde bearbeiten"
            >
                <CustomerForm
                    customer={customer}
                    onSuccess={() => {
                        setShowEditModal(false);
                        onUpdate();
                        onClose();
                    }}
                    onCancel={() => setShowEditModal(false)}
                />
            </Modal>
        </Modal>
    );
}

export default CustomerDetail;
