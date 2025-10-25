import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken);
// Alle Produkte eines Kunden abrufen
router.get('/customer/:customerId', (req, res) => {
    try {
        const customerProducts = db.prepare(`
      SELECT 
        cp.*,
        p.name as product_name,
        p.price,
        p.description,
        p.is_active,
        c.name as category_name
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE cp.customer_id = ?
      ORDER BY cp.added_at DESC
    `).all(req.params.customerId);
        res.json(customerProducts);
    } catch (error) {
        res.status(500).json({
            error: 'Fehler beim Abrufen der Kundenprodukte'
        });
    }
});
// Produkt zu Kunde hinzufügen oder Anzahl erhöhen
router.post('/', (req, res) => {
    try {
        const { customer_id, product_id } = req.body;
        if (!customer_id || !product_id) {
            return res.status(400).json({
                error: 'Kunden-ID und Produkt-ID sind erforderlich'
            });
        }
        // Prüfen ob Zuordnung bereits existiert
        const existing = db.prepare(`
      SELECT * FROM customer_products 
      WHERE customer_id = ? AND product_id = ?
    `).get(customer_id, product_id);
        if (existing) {
            // Anzahl erhöhen
            db.prepare(`
        UPDATE customer_products 
1.8 Customer-Product Routes (backend/routes/customerProducts.js)
        SET quantity = quantity + 1 
        WHERE id = ?
      `).run(existing.id);
            const updated = db.prepare(`
        SELECT 
          cp.*,
          p.name as product_name,
          p.price,
          c.name as category_name
        FROM customer_products cp
        INNER JOIN products p ON cp.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE cp.id = ?
      `).get(existing.id);
            return res.json(updated);
        }
        // Neue Zuordnung erstellen
        const result = db.prepare(`
      INSERT INTO customer_products (customer_id, product_id, quantity)
      VALUES (?, ?, 1)
    `).run(customer_id, product_id);
        const newEntry = db.prepare(`
      SELECT 
        cp.*,
        p.name as product_name,
        p.price,
        c.name as category_name
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE cp.id = ?
    `).get(result.lastInsertRowid);
        res.status(201).json(newEntry);
    } catch (error) {
        res.status(500).json({
            error: 'Fehler beim Hinzufügen des Produkts zum Kunden'
        });
    }
});
// Anzahl verringern oder Zuordnung löschen
router.put('/:id/decrease', (req, res) => {
    try {
        const entry = db.prepare(
            'SELECT * FROM customer_products WHERE id = ?'
        ).get(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: 'Eintrag nicht gefunden' });
        }
        if (entry.quantity > 1) {
            // Anzahl verringern
            db.prepare(`
        UPDATE customer_products 
        SET quantity = quantity - 1 
        WHERE id = ?
      `).run(req.params.id);
            const updated = db.prepare(`
        SELECT 
          cp.*,
          p.name as product_name,
          p.price
        FROM customer_products cp
        INNER JOIN products p ON cp.product_id = p.id
        WHERE cp.id = ?
      `).get(req.params.id);
            return res.json(updated);
        } else {
            // Eintrag löschen wenn Anzahl 0 wäre
            db.prepare('DELETE FROM customer_products WHERE id = ?')
                .run(req.params.id);
            return res.json({ message: 'Produkt entfernt', deleted: true });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Fehler beim Verringern der Produktanzahl'
        });
    }
});
// Abrechnungsstatus umschalten
router.put('/:id/toggle-billed', (req, res) => {
    try {
        const entry = db.prepare(
            'SELECT is_billed FROM customer_products WHERE id = ?'
        ).get(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: 'Eintrag nicht gefunden' });
        }
        const newStatus = entry.is_billed === 1 ? 0 : 1;
        db.prepare('UPDATE customer_products SET is_billed = ? WHERE id = ?')
            .run(newStatus, req.params.id);
        const updated = db.prepare(`
      SELECT 
        cp.*,
        p.name as product_name,
        p.price
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      WHERE cp.id = ?
`).get(req.params.id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({
            error: 'Fehler beim Aktualisieren des Abrechnungsstatus'
        });
    }
});
// Zuordnung direkt löschen
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM customer_products WHERE id = ?')
            .run(req.params.id);
        res.json({ message: 'Produkt vom Kunden entfernt' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Entfernen des Produkts' });
    }
});
export default router;