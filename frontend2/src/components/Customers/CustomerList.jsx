import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';
import CustomerForm from './CustomerForm';
import CustomerDetail from './CustomerDetail';
import Modal from '../Common/Modal';
import LoadingSpinner from '../Common/LoadingSpinner';

function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [archivedCustomers, setArchivedCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showArchived]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            if (showArchived) {
                const data = await apiCallWithAuth('/customers/archived/list', token);
                setArchivedCustomers(data);
            } else {
                const data = await apiCallWithAuth('/customers', token);
                setCustomers(data);
            }
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            console.log(customers)
            setLoading(false);
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm('Möchten Sie diesen Kunden wirklich archivieren?')) return;

        try {
            await apiCallWithAuth(`/customers/${id}`, token, { method: 'DELETE' });
            fetchCustomers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm('Möchten Sie diesen Kunden wiederherstellen?')) return;

        try {
            await apiCallWithAuth(`/customers/${id}/restore`, token, { method: 'PUT' });
            fetchCustomers();
        } catch (err) {
            alert(err.message);
        }
    };

    const displayCustomers = showArchived ? archivedCustomers : customers;
    const filteredCustomers = displayCustomers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)

    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Kunden</h1>
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
                        + Neuer Kunde
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Kunden suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {filteredCustomers.length === 0 ? (
                <div className="empty-state">
                    <p>{showArchived ? 'Keine archivierten Kunden' : 'Keine Kunden gefunden'}</p>
                </div>
            ) : (
                <div className="card-grid">
                    {filteredCustomers.map(customer => (
                        <div key={customer.id} className="card" onClick={() => setSelectedCustomer(customer)}>
                            <div className="card-header">
                                <h3>{customer.name}</h3>
                                {showArchived && <span className="badge badge-warning">Archiviert</span>}
                            </div>
                            <div className="card-body">
                                {customer.email && (
                                    <p className="text-muted">
                                        <strong>E-Mail:</strong> {customer.email}
                                    </p>
                                )}
                                {customer.phone && (
                                    <p className="text-muted">
                                        <strong>Telefon:</strong> {customer.phone}
                                    </p>
                                )}
                                {customer.project_type && (
                                    <p className="text-muted">
                                        <strong>Projekttyp:</strong> {customer.project_type}
                                    </p>
                                )}
                            </div>
                            <div className="card-actions flex justify-end gap-2">
                                {!showArchived && (
                                    <>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => setSelectedCustomer(customer)}
                                        >
                                            Details
                                        </button>
                                        <button
                                            className="btn btn-sm btn-warning"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleArchive(customer.id)
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
                                            handleRestore(customer.id)
                                        }}
                                    >
                                        Wiederherstellen
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Neuer Kunde"
            >
                <CustomerForm
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchCustomers();
                    }}
                    onCancel={() => setShowAddModal(false)}
                />
            </Modal>

            {
                selectedCustomer && (
                    <CustomerDetail
                        customer={selectedCustomer}
                        onClose={() => setSelectedCustomer(null)}
                        onUpdate={fetchCustomers}
                    />
                )
            }
        </div >
    );
}

export default CustomerList;
