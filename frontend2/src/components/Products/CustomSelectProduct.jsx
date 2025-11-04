import React, { useState } from 'react';

// props:
// - groupedProducts: [{id, name, products: [..]}]
// - onSelect(product)
// - selectedProductId
// - onAddCustomProduct(price)

function CustomSelectProduct({
    groupedProducts,
    selectedProductId,
    onSelect,
    onAddCustomProduct
}) {
    const [openCategories, setOpenCategories] = useState([]);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customProductName, setCustomProductName] = useState('');
    const [customProductPrice, setCustomProductPrice] = useState('');

    const toggleCategory = (catId) =>
        setOpenCategories((prev) =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        );

    // Render
    return (
        <div className="custom-select-dropdown">
            <div className="select-list" style={{ border: '1px solid #ccc', borderRadius: 6, width: 300, background: 'white', maxHeight: 300, overflowY: 'auto', position: 'relative', zIndex: 99 }}>
                {/* Option für kundenspezifisches Produkt */}
                <div
                    style={{ padding: 8, cursor: 'pointer', background: showCustomInput ? '#f0f0f0' : 'white', borderBottom: '1px solid #eee' }}
                    onClick={() => setShowCustomInput(s => !s)}
                >
                    + neues Produkt
                </div>
                {showCustomInput && (
                    <div className="custom-product-inputs">
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
                            placeholder="Preis (optional)"
                            value={customProductPrice}
                            onChange={e => setCustomProductPrice(e.target.value)}
                        />
                        <button className="btn btn-primary"
                            disabled={!customProductName}
                            onClick={() => {
                                onAddCustomProduct(customProductName, customProductPrice);
                                setCustomProductName('');
                                setCustomProductPrice('');
                                setShowCustomInput(false);
                            }}>
                            Hinzufügen
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowCustomInput(false)}
                        >Abbrechen</button>
                    </div>
                )}

                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {groupedProducts.map(category => (
                        <div key={category.id}>
                            <div
                                style={{ cursor: 'pointer', fontWeight: 600, padding: 8, background: openCategories.includes(category.id) ? '#f5f5f5' : 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}
                                onClick={() => toggleCategory(category.id)}
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
                                            style={{
                                                padding: '6px 0',
                                                cursor: 'pointer',
                                                background: selectedProductId === product.id ? '#e1e6f9' : 'white'
                                            }}
                                            onClick={() => onSelect(product.id)}
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
        </div>
    );
}

export default CustomSelectProduct;
