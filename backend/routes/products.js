import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken);
// Alle Kategorien abrufen
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare('SELECT * FROM categories ORDER BY name')
            .all();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
    }
});
// Neue Kategorie erstellen
router.post('/categories', (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name ist erforderlich' });
        }
        const result = db.prepare(
            'INSERT INTO categories (name, description) VALUES (?, ?)'
        ).run(name, description);
        const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?')
            .get(result.lastInsertRowid);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Erstellen der Kategorie' });
    }
});
// Alle aktiven Produkte abrufen (gruppiert nach Kategorie)
router.get('/', (req, res) => {
    try {
        const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY c.name, p.name
    `).all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Produkte' });
    }
});
// Alle Produkte abrufen (inkl. inaktive)
router.get('/all', (req, res) => {
    try {
        const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.is_active DESC, c.name, p.name
    `).all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Produkte' });
    }
});
// Neues Produkt erstellen
router.post('/', (req, res) => {
    try {
        const { name, category_id, price, description } = req.body;
        if (!name || !category_id) {
            return res.status(400).json({
                error: 'Name und Kategorie sind erforderlich'
            });
        }
        const result = db.prepare(`
      INSERT INTO products (name, category_id, price, description)
      VALUES (?, ?, ?, ?)
`).run(name, category_id, price || 0, description);
        const newProduct = db.prepare(`
 SELECT p.*, c.name as category_name
 FROM products p
 LEFT JOIN categories c ON p.category_id = c.id
 WHERE p.id = ?
 `).get(result.lastInsertRowid);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Erstellen des Produkts' });
    }
});
// Produkt aktualisieren
router.put('/:id', (req, res) => {
    try {
        const { name, category_id, price, description } = req.body;
        db.prepare(`
 UPDATE products 
SET name = ?, category_id = ?, price = ?, description = ?
 WHERE id = ?
 `).run(name, category_id, price, description, req.params.id);
        const updatedProduct = db.prepare(`
 SELECT p.*, c.name as category_name
 FROM products p
 LEFT JOIN categories c ON p.category_id = c.id
 WHERE p.id = ?
 `).get(req.params.id);
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Produkts' });
    }
});
// Produkt "löschen" (soft delete - is_active auf 0 setzen)
router.delete('/:id', (req, res) => {
    try {
        db.prepare('UPDATE products SET is_active = 0 WHERE id = ?')
            .run(req.params.id);
        res.json({ message: 'Produkt deaktiviert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Deaktivieren des Produkts' });
    }
});
export default router;