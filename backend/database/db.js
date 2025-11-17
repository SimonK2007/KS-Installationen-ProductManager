import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Datenbank initialisieren (Node.js native)
const db = new Database(join(__dirname, 'database.sqlite'));

// Tabellen erstellen
const initDatabase = () => {
  // Users Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      project_type TEXT,
      notes TEXT,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories Tabelle mit Hierarchie-Unterstützung
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER DEFAULT NULL,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Products Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      price REAL DEFAULT 0,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      is_custom INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Customer_Products Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      is_billed INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Indizes für bessere Performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_categories_parent 
    ON categories(parent_id);
    
    CREATE INDEX IF NOT EXISTS idx_products_category 
    ON products(category_id);
    
    CREATE INDEX IF NOT EXISTS idx_customer_products_customer 
    ON customer_products(customer_id);
    
    CREATE INDEX IF NOT EXISTS idx_customer_products_product 
    ON customer_products(product_id);
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_product_unique_unbilled
    ON customer_products(customer_id, product_id, is_billed);
  `);

  // Standard-User erstellen
  const userExists = db.prepare('SELECT id FROM users WHERE email = ?')
    .get('admin@firma.ch');

  if (!userExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
      .run('admin@firma.ch', hashedPassword);
    console.log('✅ Standard-User erstellt: admin@firma.ch / admin123');
  }

  // Standard-Kategorien mit Hierarchie
  const categoryExists = db.prepare('SELECT id FROM categories LIMIT 1').get();
  if (!categoryExists) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)'
    );

    // Haupt-Kategorien (parent_id = NULL)
    const bauMaterialId = insertCategory.run('Baumaterial', 'Materialien für den Bau', null).lastInsertRowid;
    const werkzeugeId = insertCategory.run('Werkzeuge', 'Verschiedene Werkzeuge', null).lastInsertRowid;
    const dienstleistungenId = insertCategory.run('Dienstleistungen', 'Angebotene Dienstleistungen', null).lastInsertRowid;

    // Unter-Kategorien für Baumaterial
    insertCategory.run('Holz', 'Holzmaterialien', bauMaterialId);
    insertCategory.run('Steine & Ziegel', 'Mauersteine und Ziegel', bauMaterialId);
    insertCategory.run('Beton & Zement', 'Betonmischungen und Zement', bauMaterialId);
    insertCategory.run('Dämmstoffe', 'Isolierung und Dämmung', bauMaterialId);

    // Unter-Kategorien für Werkzeuge
    insertCategory.run('Handwerkzeuge', 'Manuelle Werkzeuge', werkzeugeId);
    insertCategory.run('Elektrowerkzeuge', 'Elektrische Werkzeuge', werkzeugeId);
    insertCategory.run('Messgeräte', 'Mess- und Prüfgeräte', werkzeugeId);

    // Unter-Kategorien für Dienstleistungen
    insertCategory.run('Planung', 'Planungs- und Beratungsleistungen', dienstleistungenId);
    insertCategory.run('Bauarbeiten', 'Bauausführung', dienstleistungenId);
    insertCategory.run('Reparaturen', 'Reparatur- und Wartungsarbeiten', dienstleistungenId);

    console.log('✅ Standard-Kategorien mit Hierarchie erstellt');
  }

  console.log('✅ Datenbank initialisiert');
};

initDatabase();

export default db;