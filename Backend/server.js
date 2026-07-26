const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;
const databasePath = path.join(__dirname, 'expense-tracker.db');
const db = new Database(databasePath);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

db.prepare(createUsersTable).run();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);

  if (existingUser) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();
  const insert = db.prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)');

  try {
    const result = insert.run(name.trim(), normalizedEmail, passwordHash, createdAt);
    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: result.lastInsertRowid, name: name.trim(), email: normalizedEmail }
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to create account right now.' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(normalizedEmail);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({
    message: 'Login successful.',
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

app.listen(port, () => {
  console.log(`Auth server running at http://localhost:${port}`);
});
