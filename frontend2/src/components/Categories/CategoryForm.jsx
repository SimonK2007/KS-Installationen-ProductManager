import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';

function CategoryForm({ onSuccess, onCancel, initialCategory, isEdit }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent_id: ''
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        // Kategorien laden für Parent-Auswahl
        fetchCategories();

        if (isEdit && initialCategory) {
            setFormData({
                name: initialCategory.name || '',
                description: initialCategory.description || '',
                parent_id: initialCategory.parent_id || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                parent_id: ''
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCategory, isEdit]);

    const fetchCategories = async () => {
        try {
            const data = await apiCallWithAuth('/products/categories', token);
            setCategories(data);
        } catch (err) {
            console.error('Fehler beim Laden der Kategorien:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Verhindere, dass eine Kategorie sich selbst als Parent hat
            if (isEdit && initialCategory && parseInt(formData.parent_id) === initialCategory.id) {
                setError('Eine Kategorie kann nicht ihre eigene Unterkategorie sein');
                setLoading(false);
                return;
            }

            const submitData = {
                name: formData.name,
                description: formData.description,
                parent_id: formData.parent_id === '' ? null : parseInt(formData.parent_id)
            };

            if (isEdit && initialCategory) {
                await apiCallWithAuth(`/products/categories/${initialCategory.id}`, token, {
                    method: 'PUT',
                    body: JSON.stringify(submitData)
                });
            } else {
                await apiCallWithAuth('/products/categories', token, {
                    method: 'POST',
                    body: JSON.stringify(submitData)
                });
            }
            onSuccess();
        } catch (err) {
            setError(err.message || 'Ein Fehler ist aufgetreten');
        } finally {
            setLoading(false);
        }
    };

    // Verfügbare Parent-Kategorien filtern (ohne die aktuelle Kategorie bei Edit)
    const availableParentCategories = isEdit && initialCategory
        ? categories.filter(cat => cat.id !== initialCategory.id)
        : categories;

    return (
        <form onSubmit={handleSubmit} className="form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                    type="text"
                    id="name"
                    name="name"
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
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    rows="3"
                />
            </div>

            <div className="form-group">
                <label htmlFor="parent_id">Übergeordnete Kategorie (optional)</label>
                <select
                    id="parent_id"
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleChange}
                    disabled={loading}
                >
                    <option value="">--- Hauptkategorie ---</option>
                    {availableParentCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                <small className="form-hint">
                    Leer lassen für eine Hauptkategorie, oder eine übergeordnete Kategorie auswählen.
                </small>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-secondary"
                    disabled={loading}
                >
                    Abbrechen
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Wird gespeichert...' : (isEdit ? 'Aktualisieren' : 'Erstellen')}
                </button>
            </div>
        </form>
    );
}

export default CategoryForm;