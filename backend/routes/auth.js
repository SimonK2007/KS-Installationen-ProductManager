import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
const router = express.Router();
// Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email und Passwort sind erforderlich'
            });
        }
        // User finden
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }
        // Passwort prüfen
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
        }
        // JWT Token erstellen
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server-Fehler beim Login' });
    }
});
// Token validieren
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ valid: false });
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, user: verified });
    } catch (error) {
        res.status(403).json({ valid: false });
    }
});
export default router;