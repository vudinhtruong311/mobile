// backend/src/db/init.js
require('dotenv').config();
const Database = require('sql.js');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const DB_PATH = process.env.DB_PATH || './bibliosphere.db';
const db = new Database(path.resolve(DB_PATH));

// Bật foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ── Tạo tất cả bảng ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    full_name     TEXT,
    email         TEXT,
    phone         TEXT,
    department    TEXT,
    bio           TEXT,
    role          TEXT    DEFAULT 'staff',
    created_at    TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS books (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    author      TEXT    NOT NULL,
    publisher   TEXT,
    isbn        TEXT    UNIQUE,
    year        INTEGER,
    category    TEXT,
    quantity    INTEGER NOT NULL DEFAULT 1,
    available   INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS members (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name   TEXT NOT NULL,
    member_code TEXT UNIQUE NOT NULL,
    email       TEXT,
    phone       TEXT,
    member_type TEXT DEFAULT 'Sinh vien',
    card_expiry TEXT,
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS borrows (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id   INTEGER NOT NULL REFERENCES members(id),
    book_id     INTEGER NOT NULL REFERENCES books(id),
    borrow_date TEXT NOT NULL DEFAULT (date('now','localtime')),
    due_date    TEXT NOT NULL,
    return_date TEXT,
    fine        REAL DEFAULT 0,
    note        TEXT,
    status      TEXT DEFAULT 'borrowing',
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ── Admin mặc định ────────────────────────────────────────────
const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES ('admin', ?, 'Admin Thu Vien', 'admin')
  `).run(hash);
  console.log('✅ Tạo tài khoản admin mặc định: admin / admin123');
}

// ── Cài đặt mặc định ─────────────────────────────────────────
const defaultSettings = {
  library_name:        'Thư viện Trường Đại học ABC',
  library_phone:       '(024) 3869-1234',
  library_email:       'library@abc.edu.vn',
  library_address:     '144 Xuân Thủy, Cầu Giấy, Hà Nội',
  borrow_days:         '14',
  max_books_per_user:  '5',
  fine_per_day:        '2000',
  max_renewals:        '2',
};
const insertSetting = db.prepare(
  "INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)"
);
Object.entries(defaultSettings).forEach(([k, v]) => insertSetting.run(k, v));

console.log('✅ Database sẵn sàng:', DB_PATH);
module.exports = db;
