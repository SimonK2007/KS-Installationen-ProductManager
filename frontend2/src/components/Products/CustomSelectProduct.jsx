import React, { useState } from 'react';

function CustomSelectProduct({
    groupedProducts,
    selectedProductId,
    onSelect,
    onAddCustomProduct
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState([]);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customProductName, setCustomProductName] = useState('');
    const [customProductPrice, setCustomProductPrice] = useState('');

    const toggleCategory = (catId) => {
        setOpenCategories((prev) =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        );
    };

    // Finde das ausgewählte Produkt für die Anzeige
    const selectedProduct = groupedProducts
        .flatMap(cat => cat.products)
        .find(p => String(p.id) === String(selectedProductId));

    const handleSelectProduct = (productId) => {
        onSelect(String(productId));
        setIsOpen(false); // Dropdown schließen nach Auswahl
    };

    return (
        <div className="custom-select-dropdown">
            {/* Anzeige des ausgewählten Produkts */}
            <div
                className='dropdown-set-open'
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>
                    {selectedProduct
                        ? `${selectedProduct.name} – €${selectedProduct.price || 0}`
                        : 'Produkt auswählen...'}
                </span>
                <span>{isOpen ? '▲' : '▼'}</span>
            </div>

            {/* Dropdown Liste */}
            {isOpen && (
                <div className="select-list">
                    {/* Option für kundenspezifisches Produkt */}
                    <div
                        className={`user-defined-product ${showCustomInput ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowCustomInput(s => !s);
                        }}
                    >
                        + Benutzerdefiniertes Produkt
                    </div>

                    {showCustomInput && (
                        <div
                            className="custom-product-inputs"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="text"
                                placeholder="Produktname"
                                value={customProductName}
                                onChange={e => setCustomProductName(e.target.value)}
                                autoFocus
                            />
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Preis (optional)"
                                value={customProductPrice}
                                onChange={e => setCustomProductPrice(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="btn btn-primary btn-sm"
                                    disabled={!customProductName.trim()}
                                    onClick={() => {
                                        onAddCustomProduct(customProductName.trim(), customProductPrice);
                                        setCustomProductName('');
                                        setCustomProductPrice('');
                                        setShowCustomInput(false);
                                        setIsOpen(false);
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Hinzufügen
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomProductName('');
                                        setCustomProductPrice('');
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Kategorien und Produkte */}
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {groupedProducts.map(category => (
                            <div key={category.id}>
                                <div
                                    className="category-header"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCategory(category.id);
                                    }}
                                >
                                    <span>{category.name}</span>
                                    <span style={{ marginLeft: 'auto' }}>
                                        {openCategories.includes(category.id) ? '▲' : '▼'}
                                    </span>
                                </div>
                                {openCategories.includes(category.id) && (
                                    <div style={{ paddingLeft: 14 }}>
                                        {category.products.map(product => (
                                            <div
                                                key={product.id}
                                                className={String(selectedProductId) === String(product.id) ? 'selected' : ''}
                                                style={{
                                                    padding: '8px 4px',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectProduct(product.id);
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (String(selectedProductId) !== String(product.id)) {
                                                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (String(selectedProductId) !== String(product.id)) {
                                                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                                    }
                                                }}
                                            >
                                                {product.name} – €{product.price || 0}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomSelectProduct;