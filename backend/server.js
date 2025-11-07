import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes importieren
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import customerProductRoutes from './routes/customerProducts.js';

// Umgebungsvariablen laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customer-products', customerProductRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route nicht gefunden' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Interner Server-Fehler',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const os = require('os');
const ip = os.networkInterfaces();
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log(`✅ Server läuft auf Port ${PORT}`);
    console.log(`🌐 API erreichbar unter: http://[DEINE ÖFFENTLICHE AWS-IP]:${PORT}/api`);
    console.log('='.repeat(50));
});

