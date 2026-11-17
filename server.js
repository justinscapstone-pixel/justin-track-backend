const express = require('express');
const { Pool } = require('pg');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Track active logged-in user on this local server
let activeUserEmail = null;

function generateRecoveryCodes() {
    return Array.from({ length: 6 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
    );
}

// 1. Check Session (Called when page reloads)
app.get('/api/session', async (req, res) => {
    try {
        if (!activeUserEmail) {
            return res.json({ authenticated: false });
        }
        const result = await pool.query(
            'SELECT name, email, role, is_2fa_enabled FROM users WHERE LOWER(email) = LOWER($1)',
            [activeUserEmail]
        );
        if (result.rows.length === 0) {
            activeUserEmail = null;
            return res.json({ authenticated: false });
        }
        const user = result.rows[0];
        res.json({
            authenticated: true,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                is2faEnabled: user.is_2fa_enabled
            }
        });
    } catch (err) {
        console.error('SESSION ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// 2. Register New Account
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, LOWER($2), $3, LOWER($4)) RETURNING name, email, role, is_2fa_enabled',
            [name, email, password, role]
        );
        const user = result.rows[0];
        activeUserEmail = user.email;
        res.json({
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                is2faEnabled: user.is_2fa_enabled
            }
        });
    } catch (err) {
        console.error('REGISTER ERROR:', err.message);
        res.status(400).json({ message: 'Email already registered or database error.' });
    }
});

// 3. Login (Handles Password + 2FA Code on Every Sign-In)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role, token } = req.body;
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND password = $2 AND LOWER(role) = LOWER($3)',
            [email, password, role]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email, password, or portal role.' });
        }

        const user = result.rows[0];

        // If 2FA is enabled on this account, require 6-digit code
        if (user.is_2fa_enabled) {
            if (!token) {
                return res.json({ requires2fa: true });
            }
            const verified = speakeasy.totp.verify({
                secret: user.totp_secret,
                encoding: 'base32',
                token: String(token).trim(),
                window: 1
            });
            if (!verified) {
                return res.status(401).json({ message: 'Invalid 6-digit Google Authenticator code.' });
            }
        }

        activeUserEmail = user.email;
        res.json({
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                is2faEnabled: user.is_2fa_enabled
            }
        });
    } catch (err) {
        console.error('LOGIN ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// 4. Logout
app.post('/api/logout', (req, res) => {
    activeUserEmail = null;
    res.json({ success: true });
});

// 5. Start 2FA Setup (Verifies Password & Returns QR Code)
app.post('/api/2fa/setup', async (req, res) => {
    try {
        const { password } = req.body;
        if (!activeUserEmail) {
            return res.status(401).json({ message: 'Not signed in. Please log in again.' });
        }

        const userCheck = await pool.query(
            'SELECT password FROM users WHERE LOWER(email) = LOWER($1)',
            [activeUserEmail]
        );
        if (userCheck.rows.length === 0 || userCheck.rows[0].password !== password) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const secret = speakeasy.generateSecret({
            name: `StudentTrack (${activeUserEmail})`,
            issuer: 'StudentTrack'
        });

        await pool.query(
            'UPDATE users SET totp_secret = $1 WHERE LOWER(email) = LOWER($2)',
            [secret.base32, activeUserEmail]
        );

        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        res.json({ qrCode });
    } catch (err) {
        console.error('2FA SETUP ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// 6. Verify 6-Digit Code & Enable 2FA
app.post('/api/2fa/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!activeUserEmail) {
            return res.status(401).json({ message: 'Not signed in.' });
        }

        const result = await pool.query(
            'SELECT totp_secret FROM users WHERE LOWER(email) = LOWER($1)',
            [activeUserEmail]
        );
        if (result.rows.length === 0 || !result.rows[0].totp_secret) {
            return res.status(404).json({ message: '2FA setup was not started.' });
        }

        const verified = speakeasy.totp.verify({
            secret: result.rows[0].totp_secret,
            encoding: 'base32',
            token: String(token).trim(),
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid 6-digit code. Try again.' });
        }

        await pool.query(
            'UPDATE users SET is_2fa_enabled = TRUE WHERE LOWER(email) = LOWER($1)',
            [activeUserEmail]
        );

        res.json({
            verified: true,
            recoveryCodes: generateRecoveryCodes()
        });
    } catch (err) {
        console.error('2FA VERIFY ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));