import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.delete('/categories/:id', (req, res) => {
    try {
        db.prepare('UPDATE categories SET is_archived = 1 WHERE id = ?')
            .run(req.params.id);
        res.json({ message: 'Kategorie archiviert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Archivieren der Kategorie' });
    }
});

// Nur aktive Kategorien anzeigen
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare(`
          SELECT * FROM categories
          WHERE is_archived = 0
          ORDER BY name
        `).all();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
    }
});

// Archivierte Kategorien anzeigen
router.get('/categories/archived', (req, res) => {
    try {
        const archived = db.prepare(`
          SELECT * FROM categories
          WHERE is_archived = 1
          ORDER BY name
        `).all();
        res.json(archived);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen archivierter Kategorien' });
    }
});

// Wiederherstellen
router.put('/categories/:id/restore', (req, res) => {
    try {
        db.prepare('UPDATE categories SET is_archived = 0 WHERE id = ?')
            .run(req.params.id);
        res.json({ message: 'Kategorie reaktiviert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Wiederherstellen der Kategorie' });
    }
});


// Produkt aktiv/inaktiv toggeln
router.put('/:id/toggle-active', (req, res) => {
    try {
        const prod = db.prepare('SELECT is_active FROM products WHERE id=?').get(req.params.id);
        if (!prod) return res.status(404).json({ error: 'Produkt nicht gefunden' });
        db.prepare('UPDATE products SET is_active=? WHERE id=?').run(prod.is_active ? 0 : 1, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktivieren/Deaktivieren', detail: error.message });
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
router.get('/', (req, res) => {
    try {
        const products = db.prepare(`
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.is_active = 1 AND p.is_archived = 0
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
      WHERE p.is_custom = 0 AND p.is_active = 1 AND p.is_archived = 0
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.is_active DESC, c.name, p.name
    `).all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Produkte' });
    }
});

// Archivierte Produkte
router.get('/archived/list', (req, res) => {
    try {
        const archived = db.prepare(`
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.is_custom = 0 AND p.is_active = 1 AND p.is_archived = 1
          ORDER BY c.name, p.name
        `).all();
        res.json(archived);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der archivierten Produkte' });
    }
});

// Wiederherstellen
router.put('/:id/restore', (req, res) => {
    try {
        db.prepare('UPDATE products SET is_archived = 0 WHERE id = ?')
            .run(req.params.id);
        res.json({ message: 'Produkt reaktiviert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Wiederherstellen' });
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
// Produkt archivieren
router.delete('/:id', (req, res) => {
    try {
        db.prepare('UPDATE products SET is_archived = 1 WHERE id = ?')
            .run(req.params.id);
        res.json({ message: 'Produkt archiviert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Archivieren des Produkts' });
    }
});

export default router;