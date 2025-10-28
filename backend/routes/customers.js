// routes/customers.js
import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
// import PDFDocument from 'pdfkit';

const router = express.Router();
router.use(authenticateToken);

// Nur aktive Kunden
router.get('/', (req, res) => {
    try {
        const customers = db.prepare(`
      SELECT * FROM customers
      WHERE is_archived = 0
      ORDER BY created_at DESC
    `).all();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Kunden' });
    }
});

// Archivierte Kunden anzeigen
router.get('/archived/list', (req, res) => {
    try {
        const archived = db.prepare(`
      SELECT * FROM customers
      WHERE is_archived = 1
      ORDER BY name
    `).all();
        res.json(archived);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen der archivierten Kunden' });
    }
});

// Kunde wieder aktivieren
router.put('/:id/restore', (req, res) => {
    try {
        db.prepare('UPDATE customers SET is_archived = 0 WHERE id = ?').run(req.params.id);
        res.json({ message: 'Kunde reaktiviert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Wiederherstellen des Kunden' });
    }
});

router.get('/:id', (req, res) => {
    try {
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Kunde nicht gefunden' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Abrufen des Kunden' });
    }
});

router.post('/', (req, res) => {
    try {
        const { name, address, phone, email, project_type, notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });

        const result = db.prepare(`
      INSERT INTO customers (name, address, phone, email, project_type, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, address, phone, email, project_type, notes);

        const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Erstellen des Kunden' });
    }
});

router.put('/:id', (req, res) => {
    try {
        const { name, address, phone, email, project_type, notes } = req.body;
        db.prepare(`
      UPDATE customers
      SET name = ?, address = ?, phone = ?, email = ?, project_type = ?, notes = ?
      WHERE id = ?
    `).run(name, address, phone, email, project_type, notes, req.params.id);

        const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Kunden' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        db.prepare('UPDATE customers SET is_archived = 1 WHERE id = ?').run(req.params.id);
        res.json({ message: 'Kunde archiviert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Archivieren des Kunden' });
    }
});

/* ----------------------------
   Billing: Liste & PDF-Export
   ----------------------------
   - GET /customers/:id/billing       -> liefert alle (noch) unabgerechneten Einträge (is_billed = 0)
     return: [{ id, product_id, name, price, quantity, category_name, lineTotal }]
   - GET /customers/:id/billing/pdf   -> erzeugt ein einfaches PDF (via pdfkit) und streamt es
*/
router.get('/:id/billing', (req, res) => {
    try {
        const customerId = req.params.id;

        const items = db.prepare(`
      SELECT
        cp.id as id,
        p.id as product_id,
        p.name AS name,
        p.price AS price,
        cp.quantity AS quantity,
        c.name AS category_name,
        (COALESCE(p.price,0) * COALESCE(cp.quantity,1)) AS lineTotal
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE cp.customer_id = ? AND cp.is_billed = 0
      ORDER BY c.name, p.name
    `).all(customerId);

        // Gesamt berechnen
        const total = items.reduce((s, it) => s + (it.lineTotal || 0), 0);

        res.json({ items, total });
    } catch (error) {
        console.error('billing list error:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Abrechnung', detail: error.message });
    }
});

// router.get('/:id/billing/pdf', (req, res) => {
//     try {
//         const customerId = req.params.id;
//         const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
//         if (!customer) return res.status(404).json({ error: 'Kunde nicht gefunden' });

//         const items = db.prepare(`
//       SELECT
//         p.name as name,
//         p.price as price,
//         cp.quantity as quantity,
//         (COALESCE(p.price,0) * COALESCE(cp.quantity,1)) as lineTotal
//       FROM customer_products cp
//       INNER JOIN products p ON cp.product_id = p.id
//       WHERE cp.customer_id = ? AND cp.is_billed = 0
//     `).all(customerId);

//         const total = items.reduce((s, it) => s + (it.lineTotal || 0), 0);

//         // PDF generieren mit pdfkit
//         const doc = new PDFDocument({ margin: 40 });
//         res.setHeader('Content-Type', 'application/pdf');
//         // inline download name
//         const safeName = (customer.name || 'kunde').replace(/[^a-z0-9\-_\.]/ig, '_');
//         res.setHeader('Content-Disposition', `attachment; filename="rechnung_${safeName}.pdf"`);

//         doc.fontSize(18).text(`Rechnung / Abrechnung`, { align: 'center' });
//         doc.moveDown();
//         doc.fontSize(12).text(`Kunde: ${customer.name}`);
//         if (customer.address) doc.text(`Adresse: ${customer.address}`);
//         if (customer.email) doc.text(`E-Mail: ${customer.email}`);
//         if (customer.phone) doc.text(`Telefon: ${customer.phone}`);
//         doc.moveDown();

//         // Tabelle Kopf
//         doc.fontSize(12);
//         doc.text('Pos', { continued: true, width: 30 });
//         doc.text('Bezeichnung', { continued: true, width: 300 });
//         doc.text('Menge', { continued: true, width: 60, align: 'right' });
//         doc.text('Preis', { continued: true, width: 80, align: 'right' });
//         doc.text('Zwischensumme', { align: 'right' });
//         doc.moveDown(0.5);

//         items.forEach((it, idx) => {
//             doc.text(String(idx + 1), { continued: true, width: 30 });
//             doc.text(it.name, { continued: true, width: 300 });
//             doc.text(String(it.quantity), { continued: true, width: 60, align: 'right' });
//             doc.text((it.price || 0).toFixed(2) + ' €', { continued: true, width: 80, align: 'right' });
//             doc.text((it.lineTotal || 0).toFixed(2) + ' €', { align: 'right' });
//         });

//         doc.moveDown();
//         doc.fontSize(14).text(`Gesamt: ${total.toFixed(2)} €`, { align: 'right' });

//         doc.end();
//         doc.pipe(res);
//     } catch (error) {
//         console.error('billing pdf error:', error);
//         res.status(500).json({ error: 'Fehler beim Erstellen des PDF', detail: error.message });
//     }
// });

export default router;
