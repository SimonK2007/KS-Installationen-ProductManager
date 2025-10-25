import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
// Alle Routen sind geschützt
router.use(authenticateToken);
// Alle Kunden abrufen
router.get('/', (req, res) => {
    try {
        const customers = db.prepare(`
      SELECT * FROM customers 
      ORDER BY created_at DESC
    `).all();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Kunden' });
    }
});
// Einzelnen Kunden abrufen
router.get('/:id', (req, res) => {
    try {
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?')
            .get(req.params.id);

        if (!customer) {
            return res.status(404).json({ error: 'Kunde nicht gefunden' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen des Kunden' });
    }
});
// Neuen Kunden erstellen
router.post('/', (req, res) => {
    try {
        const { name, address, phone, email, project_type, notes } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name ist erforderlich' });
        }
        const result = db.prepare(`
      INSERT INTO customers (name, address, phone, email, project_type, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, address, phone, email, project_type, notes);
        const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?')
            .get(result.lastInsertRowid);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Erstellen des Kunden' });
    }
});
// Kunden aktualisieren
router.put('/:id', (req, res) => {
    try {
        const { name, address, phone, email, project_type, notes } = req.body;
        db.prepare(`
      UPDATE customers 
      SET name = ?, address = ?, phone = ?, email = ?, 
          project_type = ?, notes = ?
WHERE id = ?
 `).run(name, address, phone, email, project_type, notes, req.params.id);
        const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?')
            .get(req.params.id);
        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Kunden' });
    }
});
// Kunden löschen
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
        res.json({ message: 'Kunde erfolgreich gelöscht' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Löschen des Kunden' });
    }
});
export default router;