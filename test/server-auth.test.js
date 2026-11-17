'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const nodeTest = require('node:test');
const speakeasy = require('speakeasy');
const fs = require('node:fs');
const serverSource = fs.readFileSync(require.resolve('../server'), 'utf8');
const hasTestableServer = serverSource.includes('function createApp') &&
    serverSource.includes('module.exports');
const test = hasTestableServer
    ? nodeTest
    : (name, callback) => nodeTest(name, { skip: 'server.js does not export a testable app' }, callback);
const server = hasTestableServer ? require('../server') : {};
const { createApp, decryptTotpSecret } = server;

class FakePool {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
    }

    async query(statement, values = []) {
        const sql = statement.replace(/\s+/g, ' ').trim().toLowerCase();
        if (sql.startsWith('insert into users')) {
            const [name, email, password, role] = values;
            if (this.users.has(email.toLowerCase())) {
                const error = new Error('duplicate key');
                error.code = '23505';
                error.constraint = 'users_email_unique_idx';
                throw error;
            }
            const user = {
                name,
                email,
                password,
                role,
                is_2fa_enabled: false,
                totp_secret: null,
                pending_totp_secret: null,
                recovery_codes: []
            };
            this.users.set(email.toLowerCase(), user);
            return { rows: [{ name, email, role, is_2fa_enabled: false }], rowCount: 1 };
        }
        if (sql.startsWith('select name, email, password, role, is_2fa_enabled')) {
            const user = this.users.get(values[0].toLowerCase());
            return { rows: user ? [{ ...user, recovery_codes: [...user.recovery_codes] }] : [], rowCount: user ? 1 : 0 };
        }
        if (sql.startsWith('select password from users where lower(email)')) {
            const user = this.users.get(values[0].toLowerCase());
            return { rows: user ? [{ password: user.password }] : [], rowCount: user ? 1 : 0 };
        }
        if (sql.startsWith('update users set password =')) {
            const user = this.users.get(values[1]);
            if (user) user.password = values[0];
            return { rows: [], rowCount: user ? 1 : 0 };
        }
        if (sql.startsWith('insert into auth_sessions')) {
            this.sessions.set(values[0], { email: values[1], expiresAt: values[2] });
            return { rows: [], rowCount: 1 };
        }
        if (sql.startsWith('select u.name, u.email, u.role, u.is_2fa_enabled')) {
            const session = this.sessions.get(values[0]);
            if (!session || session.expiresAt <= new Date()) return { rows: [], rowCount: 0 };
            const user = this.users.get(session.email);
            return {
                rows: user ? [{
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    is_2fa_enabled: user.is_2fa_enabled
                }] : [],
                rowCount: user ? 1 : 0
            };
        }
        if (sql.startsWith('delete from auth_sessions')) {
            const deleted = this.sessions.delete(values[0]);
            return { rows: [], rowCount: deleted ? 1 : 0 };
        }
        if (sql.startsWith('update users set pending_totp_secret')) {
            const user = this.users.get(values[1].toLowerCase());
            if (!user || user.is_2fa_enabled) return { rows: [], rowCount: 0 };
            user.pending_totp_secret = values[0];
            return { rows: [{ email: user.email }], rowCount: 1 };
        }
        if (sql.startsWith('select pending_totp_secret, is_2fa_enabled')) {
            const user = this.users.get(values[0].toLowerCase());
            return {
                rows: user ? [{
                    pending_totp_secret: user.pending_totp_secret,
                    is_2fa_enabled: user.is_2fa_enabled
                }] : [],
                rowCount: user ? 1 : 0
            };
        }
        if (sql.startsWith('update users set totp_secret =')) {
            const [secret, recoveryCodes, email] = values;
            const user = this.users.get(email.toLowerCase());
            if (!user || user.pending_totp_secret !== secret || user.is_2fa_enabled) {
                return { rows: [], rowCount: 0 };
            }
            user.totp_secret = secret;
            user.is_2fa_enabled = true;
            user.pending_totp_secret = null;
            user.recovery_codes = [...recoveryCodes];
            return { rows: [{ email: user.email }], rowCount: 1 };
        }
        if (sql.startsWith('update users set recovery_codes = array_remove')) {
            const [hash, email] = values;
            const user = this.users.get(email.toLowerCase());
            if (!user || !user.recovery_codes.includes(hash)) return { rows: [], rowCount: 0 };
            user.recovery_codes = user.recovery_codes.filter(code => code !== hash);
            return { rows: [{ email: user.email }], rowCount: 1 };
        }
        throw new Error(`Unexpected SQL in auth test: ${sql}`);
    }
}

async function startTestServer(pool) {
    const totpKey = Buffer.alloc(32, 7);
    const app = createApp(pool, { secureCookies: false, totpEncryptionKey: totpKey });
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    return {
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        totpKey,
        close: () => new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        })
    };
}

function sessionCookie(response) {
    const header = response.headers.get('set-cookie') || '';
    const match = header.match(/studenttrack_session=([^;]*)/);
    return match ? `studenttrack_session=${match[1]}` : '';
}

async function post(baseUrl, route, body, cookie) {
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers.Cookie = cookie;
    return fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
}

test('registration hashes passwords and creates a revocable HTTP-only session', async t => {
    const pool = new FakePool();
    const server = await startTestServer(pool);
    t.after(() => server.close());

    const crossOriginAttempt = await fetch(`${server.baseUrl}/api/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Origin: 'https://attacker.example'
        },
        body: JSON.stringify({
            name: 'Blocked User',
            email: 'blocked@example.test',
            password: 'a-strong-password',
            role: 'teacher'
        })
    });
    assert.equal(crossOriginAttempt.status, 403);
    assert.equal(pool.users.size, 0);

    const response = await post(server.baseUrl, '/api/register', {
        name: 'Test Teacher',
        email: 'teacher@example.test',
        password: 'a-strong-password',
        role: 'teacher'
    });
    assert.equal(response.status, 201);
    assert.match(pool.users.get('teacher@example.test').password, /^scrypt\$/);
    assert.notEqual(pool.users.get('teacher@example.test').password, 'a-strong-password');
    assert.match(response.headers.get('set-cookie'), /HttpOnly/);
    assert.match(response.headers.get('set-cookie'), /SameSite=Strict/);

    const cookie = sessionCookie(response);
    const sessionResponse = await fetch(`${server.baseUrl}/api/session`, { headers: { Cookie: cookie } });
    assert.equal(sessionResponse.status, 200);
    assert.equal((await sessionResponse.json()).user.email, 'teacher@example.test');

    const logoutResponse = await post(server.baseUrl, '/api/logout', {}, cookie);
    assert.equal(logoutResponse.status, 200);
    const expiredSessionResponse = await fetch(`${server.baseUrl}/api/session`, { headers: { Cookie: cookie } });
    assert.equal(expiredSessionResponse.status, 200);
    assert.equal((await expiredSessionResponse.json()).authenticated, false);
});

test('2FA enrollment stays pending until verified and login requires a valid code', async t => {
    const pool = new FakePool();
    const server = await startTestServer(pool);
    t.after(() => server.close());

    const registration = await post(server.baseUrl, '/api/register', {
        name: 'Test Teacher',
        email: 'teacher@example.test',
        password: 'a-strong-password',
        role: 'teacher'
    });
    const cookie = sessionCookie(registration);
    const rejectedSetup = await post(server.baseUrl, '/api/2fa/setup', {
        password: 'wrong-password'
    }, cookie);
    assert.equal(rejectedSetup.status, 401);
    assert.equal(pool.users.get('teacher@example.test').pending_totp_secret, null);

    const setup = await post(server.baseUrl, '/api/2fa/setup', {
        password: 'a-strong-password'
    }, cookie);
    assert.equal(setup.status, 200);
    assert.match((await setup.json()).qrCode, /^data:image\/png;base64,/);

    const user = pool.users.get('teacher@example.test');
    assert.equal(user.is_2fa_enabled, false);
    assert.ok(user.pending_totp_secret);
    const originalSecret = decryptTotpSecret(user.pending_totp_secret, server.totpKey);
    assert.match(user.pending_totp_secret, /^v1\./);
    const token = speakeasy.totp({ secret: originalSecret, encoding: 'base32' });
    const verify = await post(server.baseUrl, '/api/2fa/verify', { token }, cookie);
    const verifyResult = await verify.json();
    assert.equal(verify.status, 200);
    assert.equal(verifyResult.verified, true);
    assert.equal(verifyResult.recoveryCodes.length, 10);
    assert.equal(user.is_2fa_enabled, true);
    assert.equal(user.pending_totp_secret, null);

    await post(server.baseUrl, '/api/logout', {}, cookie);
    const challenge = await post(server.baseUrl, '/api/login', {
        email: 'teacher@example.test',
        password: 'a-strong-password',
        role: 'teacher'
    });
    assert.equal(challenge.status, 200);
    assert.equal((await challenge.json()).requires2fa, true);
    assert.equal(challenge.headers.get('set-cookie'), null);

    const invalidCode = await post(server.baseUrl, '/api/login', {
        email: 'teacher@example.test',
        password: 'a-strong-password',
        role: 'teacher',
        token: '000000'
    });
    assert.equal(invalidCode.status, 401);
    assert.equal(invalidCode.headers.get('set-cookie'), null);

    const storedSecret = decryptTotpSecret(user.totp_secret, server.totpKey);
    const validToken = speakeasy.totp({ secret: storedSecret, encoding: 'base32' });
    const successfulLogin = await post(server.baseUrl, '/api/login', {
        email: 'teacher@example.test',
        password: 'a-strong-password',
        role: 'teacher',
        token: validToken
    });
    assert.equal(successfulLogin.status, 200);
    assert.ok(sessionCookie(successfulLogin));

    const recoveryCode = verifyResult.recoveryCodes[0];
    await post(server.baseUrl, '/api/logout', {}, sessionCookie(successfulLogin));
    const recoveryLogin = await post(server.baseUrl, '/api/login', {
        email: 'teacher@example.test',
        password: 'a-strong-password',
        role: 'teacher',
        token: recoveryCode
    });
    assert.equal(recoveryLogin.status, 200);
    assert.equal(user.recovery_codes.length, 9);

    await post(server.baseUrl, '/api/logout', {}, sessionCookie(recoveryLogin));
    const reusedRecoveryCode = await post(server.baseUrl, '/api/login', {
        email: 'teacher@example.test',
        password: 'a-strong-password',
        role: 'teacher',
        token: recoveryCode
    });
    assert.equal(reusedRecoveryCode.status, 401);
});

test('legacy plaintext server passwords are upgraded after successful login', async t => {
    const pool = new FakePool();
    pool.users.set('legacy@example.test', {
        name: 'Legacy Teacher',
        email: 'legacy@example.test',
        password: 'old-plaintext-password',
        role: 'teacher',
        is_2fa_enabled: false,
        totp_secret: null,
        pending_totp_secret: null,
        recovery_codes: []
    });
    const server = await startTestServer(pool);
    t.after(() => server.close());

    const response = await post(server.baseUrl, '/api/login', {
        email: 'legacy@example.test',
        password: 'old-plaintext-password',
        role: 'teacher'
    });
    assert.equal(response.status, 200);
    assert.match(pool.users.get('legacy@example.test').password, /^scrypt\$/);
    assert.notEqual(pool.users.get('legacy@example.test').password, 'old-plaintext-password');
});
