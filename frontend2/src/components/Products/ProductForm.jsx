import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiCallWithAuth } from '../../services/api';

function ProductForm({ product = null, categories, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category_id: product.category_id || '',
        price: product.price || '',
        description: product.description || ''
      });
    }
  }, [product]);

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
      const endpoint = product ? `/products/${product.id}` : '/products';
      const method = product ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price) || 0
      };

      await apiCallWithAuth(endpoint, token, {
        method,
        body: JSON.stringify(submitData)
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
        <label htmlFor="category_id">Kategorie *</label>
        <select
          id="category_id"
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">Wählen Sie eine Kategorie</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="price">Preis (€)</label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange}
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
        >{loading ? 'Lädt...' : product ? 'Aktualisieren' : 'Erstellen'}</button>
      </div>
    </form>
  );
}

export default ProductForm;
