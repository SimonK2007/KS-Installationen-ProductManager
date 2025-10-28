import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';

function CategoryForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

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
            await apiCallWithAuth('/products/categories', token, {
                method: 'POST',
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
                <label htmlFor="description">Beschreibung</label>
                <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
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
                >Abbrechen</button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >{loading ? 'Lädt...' : 'Erstellen'}</button>
            </div>
        </form>
    );
}

export default CategoryForm;
