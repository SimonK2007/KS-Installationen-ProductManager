import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';
import CustomerForm from './CustomerForm';
import Modal from '../Common/Modal';
import LoadingSpinner from '../Common/LoadingSpinner';
import CustomSelectProduct from '../Products/CustomSelectProduct';
import { DownloadIcon } from 'lucide-react';

function CustomerDetail({ customer, onClose, onUpdate }) {
    const [customerProducts, setCustomerProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [localQuantities, setLocalQuantities] = useState({});
    // NEU: State für die ursprünglichen Mengen, um Änderungen zu erkennen
    const [initialQuantities, setInitialQuantities] = useState({});
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

            // Local quantities für Offline-Modus
            const q = {};
            cpData.forEach(cp => q[cp.id] = cp.quantity);

            setLocalQuantities(q);
            // NEU: Ursprüngliche Mengen speichern, um Änderungen zu verfolgen
            setInitialQuantities(q);

        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Produkt zu Kunde hinzufügen
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

    // Menge erhöhen im Online/Offline-Modus (lokal)
    const handleIncrease = (id) => {
        setLocalQuantities(prev => ({
            ...prev,
            [id]: Number(prev[id] || 0) + 1
        }));
    };

    // Menge reduzieren (nur lokal)
    const handleDecrease = (id) => {
        setLocalQuantities(prev => ({
            ...prev,
            [id]: Math.max(0, Number(prev[id] || 0) - 1)
        }));
    };

    // Menge im Offline-Modus bearbeiten
    const handleLocalChange = (id, newQuantity) => {
        // newQuantity kommt als String vom Input, muss zu Number konvertiert werden
        setLocalQuantities(prev => ({
            ...prev,
            [id]: Math.max(0, Number(newQuantity))
        }));
    };

    // Offline-Modus Mengen synchronisieren
    const handleSyncQuantities = async () => {
        try {
            const updates = Object.entries(localQuantities).map(([id, quantity]) => ({
                id: parseInt(id), quantity
            }));
            await apiCallWithAuth(`/customer-products/bulk-update`, token, {
                method: 'PUT',
                body: JSON.stringify({ updates })
            });

            // Nach erfolgreichem Speichern Daten neu laden und initialQuantities aktualisieren
            fetchData();
            alert('Änderungen gespeichert!');
        } catch (err) {
            alert('Fehler beim Speichern: ' + err.message);
        }
    };

    // Produkt entfernen
    const handleRemove = async (id) => {
        if (!window.confirm('Produkt wirklich entfernen?')) return;
        try {
            await apiCallWithAuth(`/customer-products/${id}`, token, { method: 'DELETE' });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const totalPrice = customerProducts.reduce(
        // Verwende localQuantities für die Berechnung, falle auf cp.quantity zurück (obwohl initialQuantities besser wäre, aber lokale Mengen sind die aktuellsten)
        (sum, cp) => sum + (cp.price || 0) * (localQuantities[cp.id] ?? cp.quantity),
        0
    );

    const groupedProducts = categories.map(category => ({
        ...category,
        products: products.filter(p => p.price && p.category_id === category.id)
    }));

    const handleAddCustomProduct = async (name, price) => {
        try {
            await apiCallWithAuth('/customer-products/custom', token, {
                method: "POST",
                body: JSON.stringify({
                    customer_id: customer.id,
                    name,
                    price: price ? parseFloat(price) : null
                })
            });
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleExportExcel = async () => {
        try {
            // fetch statt apiCallWithAuth, da letzterer evtl. auto-JSON erwartet!
            const response = await fetch(
                `/api/customer-products/export/excel/${customer.id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (!response.ok) throw new Error("Export fehlgeschlagen");

            const blob = await response.blob();
            // Download-Link erzeugen
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `Kundendaten-${customer.name}.xlsx`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Excel-Export fehlgeschlagen: ' + err.message);
        }
    };


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
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowEditModal(true)}>
                        Bearbeiten
                    </button>
                </div>

                <hr />

                <div className="products-section">
                    <div className="flex justify-between items-center mb-2">
                        <h3>Zugeordnete Produkte</h3>
                        <button className="btn btn-export" onClick={handleExportExcel}>
                            <DownloadIcon size={18} /> Exportieren
                        </button>

                    </div>

                    <div className="add-product-form">
                        <CustomSelectProduct
                            groupedProducts={groupedProducts}
                            selectedProductId={selectedProductId}
                            onSelect={setSelectedProductId}
                            onAddCustomProduct={(name, price) => handleAddCustomProduct(name, price)}
                        />
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
                        <p className="text-muted mt-2">Keine Produkte zugeordnet</p>
                    ) : (
                        <>
                            <div className="product-list mt-3">
                                {customerProducts.map(cp => (
                                    <div key={cp.id} className={`product-item flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 mb-2 rounded-lg border${cp.is_billed ? ' billed' : ''}`}>
                                        <div className="product-info">
                                            <h4>{cp.product_name} <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRemove(cp.id)}
                                            >×</button></h4>
                                            <p className="text-muted">{cp.category_name}</p>
                                        </div>
                                        <div className="product-actions flex items-center gap-2">
                                            <div className="quantity-controls flex items-center gap-1">
                                                <button
                                                    className="btn btn-lg btn-icon"
                                                    onClick={() => handleDecrease(cp.id)}
                                                    title="Menge verringern"
                                                >−</button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={localQuantities[cp.id] ?? cp.quantity}
                                                    onChange={e => handleLocalChange(cp.id, e.target.value)}
                                                    className="border rounded-md text-center w-1 px-1 py-0.5 text-sm"
                                                    style={{ margin: "0 4px", width: "80px" }}
                                                />
                                                <button
                                                    className="btn btn-lg btn-icon"
                                                    onClick={() => handleIncrease(cp.id)}
                                                    title="Menge erhöhen"
                                                >+</button>

                                                {/* NEU: Bedingtes Rendern des Speichern-Buttons */}
                                                {/* Zeige Button nur, wenn sich die lokale Menge von der initialen Menge unterscheidet */}
                                                {Number(localQuantities[cp.id] ?? cp.quantity) !== Number(initialQuantities[cp.id] ?? cp.quantity) && (
                                                    <div className="text-right mt-2">
                                                        <button
                                                            className="btn-sm btn-primary ml-2"
                                                            onClick={handleSyncQuantities}
                                                        >
                                                            speichern
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="total-price mt-4 text-right">
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