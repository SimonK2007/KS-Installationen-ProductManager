import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Datenbank initialisieren (Node.js native)
const db = new DatabaseSync(join(__dirname, 'database.sqlite'));


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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
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
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Alten Index löschen, falls vorhanden (wegen der alten Struktur)
  db.exec(`
  DROP INDEX IF EXISTS idx_customer_product_unique;
`);

  function columnExists(table, column) {
    const result = db.prepare(
      `PRAGMA table_info(${table})`
    ).all();
    return result.some(row => row.name === column);
  }

  if (!columnExists('customers', 'is_archived')) {
    db.exec('ALTER TABLE customers ADD COLUMN is_archived INTEGER DEFAULT 0;');
  }
  if (!columnExists('products', 'is_archived')) {
    db.exec('ALTER TABLE products ADD COLUMN is_archived INTEGER DEFAULT 0;');
  }
  if (!columnExists('categories', 'is_archived')) {
    db.exec('ALTER TABLE categories ADD COLUMN is_archived INTEGER DEFAULT 0;');
  }


  // Neuen Index anlegen, der is_billed berücksichtigt
  db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_product_unique_unbilled
  ON customer_products(customer_id, product_id, is_billed);
`);


  // Indizes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category 
    ON products(category_id);
    
    CREATE INDEX IF NOT EXISTS idx_customer_products_customer 
    ON customer_products(customer_id);
    
    CREATE INDEX IF NOT EXISTS idx_customer_products_product 
    ON customer_products(product_id);
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

  // Standard-Kategorien
  const categoryExists = db.prepare('SELECT id FROM categories LIMIT 1').get();
  if (!categoryExists) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, description) VALUES (?, ?)'
    );
    insertCategory.run('Baumaterial', 'Materialien für den Bau');
    insertCategory.run('Werkzeuge', 'Verschiedene Werkzeuge');
    insertCategory.run('Dienstleistungen', 'Angebotene Dienstleistungen');
    console.log('✅ Standard-Kategorien erstellt');
  }

  console.log('✅ Datenbank initialisiert');
};

initDatabase();

export default db;
