import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';

function CustomerForm({ customer = null, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        project_type: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                address: customer.address || '',
                phone: customer.phone || '',
                email: customer.email || '',
                project_type: customer.project_type || '',
                notes: customer.notes || ''
            });
        }
    }, [customer]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = customer ? `/customers/${customer.id}` : '/customers';
            const method = customer ? 'PUT' : 'POST';

            await apiCallWithAuth(endpoint, token, {
                method,
                body: JSON.stringify(formData)
            });

            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="email">E-Mail</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="phone">Telefon</label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="address">Adresse</label>
                <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="project_type">Projekttyp</label>
                <input
                    id="project_type"
                    name="project_type"
                    type="text"
                    value={formData.project_type}
                    onChange={handleChange}
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="notes">Notizen</label>
                <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={loading}
                />
            </div>
            <div className="form-actions">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Abbrechen
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Lädt...' : customer ? 'Aktualisieren' : 'Erstellen'}
                </button>
            </div>
        </form>
    );
}

export default CustomerForm;
