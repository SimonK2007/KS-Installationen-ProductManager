import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/', (req, res) => {
  try {
    const { customer_id, product_id, quantity = 1 } = req.body;

    if (!customer_id || !product_id) {
      return res.status(400).json({
        error: 'Kunden-ID und Produkt-ID sind erforderlich'
      });
    }

    // Nur nach NICHT-VERRECHNETEN Einträgen suchen
    const existing = db.prepare(`
      SELECT * FROM customer_products
      WHERE customer_id = ? AND product_id = ? AND is_billed = 0
    `).get(customer_id, product_id);

    if (existing) {
      // Anzahl um die gewünschte Menge erhöhen
      db.prepare(`
        UPDATE customer_products
        SET quantity = quantity + ?
        WHERE id = ?
      `).run(quantity, existing.id);

      const updated = db.prepare(`
        SELECT
          cp.*,
          p.name AS product_name,
          p.price,
          c.name AS category_name
        FROM customer_products cp
        INNER JOIN products p ON cp.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE cp.id = ?
      `).get(existing.id);

      return res.json(updated);
    }

    // Neues "nicht verrechnetes" Produkt anlegen
    const result = db.prepare(`
      INSERT INTO customer_products (customer_id, product_id, quantity, is_billed)
      VALUES (?, ?, ?, 0)
    `).run(customer_id, product_id, quantity);

    const newEntry = db.prepare(`
      SELECT
        cp.*,
        p.name AS product_name,
        p.price,
        c.name AS category_name
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE cp.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newEntry);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Fehler beim Hinzufügen des Produkts zum Kunden'
    });
  }
});




// Produkte und Zuordnung-Liste für Kunde
router.get('/customer/:customerId', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        cp.*,
        p.name AS product_name,
        p.price,
        p.is_active,
        p.category_id,
        c.name AS category_name
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE cp.customer_id = ?
      ORDER BY c.name, p.name
    `).all(req.params.customerId);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen', detail: error.message });
  }
});

// Summary: Anzahl Produkte pro Kunde
router.get('/customer/:customerId/summary', (req, res) => {
  const result = db.prepare(`
    SELECT
      SUM(quantity) as totalProducts,
      COUNT(DISTINCT product_id) as distinctProducts
    FROM customer_products
    WHERE customer_id = ?
  `).get(req.params.customerId);
  res.json(result);
});

// (Optional) Produkt von Kunde verringern
router.put('/:id/decrease', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM customer_products WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    if (entry.quantity > 1) {
      db.prepare(`UPDATE customer_products SET quantity = quantity - 1 WHERE id = ?`).run(req.params.id);
      const updated = db.prepare('SELECT * FROM customer_products WHERE id = ?').get(req.params.id);
      return res.json(updated);
    } else {
      db.prepare('DELETE FROM customer_products WHERE id = ?').run(req.params.id);
      return res.json({ deleted: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Verringern', detail: error.message });
  }
});
router.put('/:id/increase', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM customer_products WHERE id = ?').get(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    db.prepare(`UPDATE customer_products SET quantity = quantity + 1 WHERE id = ?`).run(req.params.id);

    const updated = db.prepare('SELECT * FROM customer_products WHERE id = ?').get(req.params.id);

    return res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erhöhen', detail: error.message });
  }
});

router.put('/bulk-update', (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Keine Updates angegeben' });
    }

    const updateStmt = db.prepare(`
      UPDATE customer_products
      SET quantity = ?
      WHERE id = ?
    `);

    db.prepare('BEGIN').run();
    try {
      for (const { id, quantity } of updates) {
        updateStmt.run(quantity, id);
      }
      db.prepare('COMMIT').run();
      res.json({ success: true, updated: updates.length });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fehler beim Massen-Update', detail: error.message });
  }
});


// Einzelne Menge direkt setzen
router.put('/:id', (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'Ungültige Menge' });
    }

    const entry = db.prepare('SELECT * FROM customer_products WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Eintrag nicht gefunden' });

    db.prepare('UPDATE customer_products SET quantity = ? WHERE id = ?').run(quantity, req.params.id);

    const updated = db.prepare(`
      SELECT cp.*, p.name AS product_name, p.price, c.name AS category_name
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE cp.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Menge', detail: error.message });
  }
});



// Toggle abgerechnet/unabgerechnet
router.put('/:id/toggle-billed', (req, res) => {
  try {
    const entry = db.prepare(`
      SELECT * FROM customer_products WHERE id = ?
    `).get(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    const newStatus = entry.is_billed === 1 ? 0 : 1;

    // Prüfen, ob es bereits ein Duplikat mit neuem Status gibt
    const duplicate = db.prepare(`
      SELECT * FROM customer_products
      WHERE customer_id = ? AND product_id = ? AND is_billed = ?
    `).get(entry.customer_id, entry.product_id, newStatus);

    if (duplicate) {
      // Wenn schon vorhanden: Mengen zusammenführen
      db.prepare(`
        UPDATE customer_products
        SET quantity = quantity + ?
        WHERE id = ?
      `).run(entry.quantity, duplicate.id);

      // Den alten (zu togglenden) Eintrag löschen
      db.prepare(`DELETE FROM customer_products WHERE id = ?`).run(entry.id);

      const updated = db.prepare(`
        SELECT * FROM customer_products WHERE id = ?
      `).get(duplicate.id);

      return res.json(updated);
    }

    // Kein Duplikat → einfach Status toggeln
    db.prepare(`
      UPDATE customer_products
      SET is_billed = ?
      WHERE id = ?
    `).run(newStatus, entry.id);

    const updated = db.prepare(`
      SELECT * FROM customer_products WHERE id = ?
    `).get(entry.id);

    res.json(updated);

  } catch (error) {
    console.error('toggle-billed error:', error);
    res.status(500).json({
      error: 'Fehler beim Aktualisieren',
      detail: error.message
    });
  }
});
router.post('/custom', async (req, res) => {
  const { customer_id, name, price } = req.body;
  if (!customer_id || !name) {
    return res.status(400).json({ error: 'Kunden-ID und Produktname sind erforderlich' });
  }
  try {
    // Produkt mit is_custom = 1 anlegen
    const prodResult = db.prepare(`
      INSERT INTO products (name, price, is_custom, is_active, is_archived)
      VALUES (?, ?, 1, 1, 0)
    `).run(name, price ? price : 0);  // Setze Default-Preis auf 0, falls nicht übergeben

    const productId = prodResult.lastInsertRowid;

    // Nur diesem Kunden zuordnen (Tabellen- und Feldnamen KORREKT!)
    const custResult = db.prepare(`
      INSERT INTO customer_products (customer_id, product_id, quantity, is_billed)
      VALUES (?, ?, 1, 0)
    `).run(customer_id, productId);

    // Rückgabe: neues Assignment samt Produktdaten
    const newProductAssignment = db.prepare(`
      SELECT cp.*, p.name AS product_name, p.price
      FROM customer_products cp
      INNER JOIN products p ON cp.product_id = p.id
      WHERE cp.id = ?
    `).get(custResult.lastInsertRowid);

    res.status(201).json(newProductAssignment);
  } catch (error) {
    console.error('Fehler im Custom-Insert:', error);  // Logge ausführlich!
    res.status(500).json({ error: 'Fehler beim Hinzufügen des kundenspezifischen Produkts', detail: error.message });
  }
});

export default router;
