// backend/src/db/index.js
// Wrapper đồng bộ cho sql.js — API tương tự better-sqlite3
// sql.js: pure JavaScript, không cần build native, chạy trên mọi máy

const path   = require('path');
const fs     = require('fs');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const DB_FILE = path.resolve(process.env.DB_PATH || './bibliosphere.db');

let _db = null; // sql.js Database instance

// ── Lưu DB ra file ───────────────────────────────────────────
function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

// ── Khởi tạo ─────────────────────────────────────────────────
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const buf = fs.readFileSync(DB_FILE);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  // Tạo tất cả bảng
  _db.run(`
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

  // Admin mặc định
  const adminRow = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminRow) {
    const hash = bcrypt.hashSync('admin123', 10);
    run('INSERT INTO users (username, password_hash, full_name, role) VALUES (?,?,?,?)',
        ['admin', hash, 'Admin Thu Vien', 'admin']);
    console.log('✅ Tài khoản admin mặc định: admin / admin123');
  }

  // Settings mặc định
  const defaults = {
    library_name: 'Thư viện Trường Đại học ABC',
    library_phone: '(024) 3869-1234',
    library_email: 'library@abc.edu.vn',
    library_address: '144 Xuân Thủy, Cầu Giấy, Hà Nội',
    borrow_days: '14', max_books_per_user: '5',
    fine_per_day: '2000', max_renewals: '2',
  };
  for (const [k, v] of Object.entries(defaults)) {
    run('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)', [k, v]);
  }

  persist();
  console.log('✅ Database sẵn sàng:', DB_FILE);
}

// ── Helpers đồng bộ ──────────────────────────────────────────
// Chạy câu lệnh (INSERT/UPDATE/DELETE)
function run(sql, params = []) {
  _db.run(sql, params);
  persist();
  // Lấy lastInsertRowid
  const row = queryOne('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: row?.id };
}

// Lấy 1 dòng
function queryOne(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// Lấy nhiều dòng
function queryAll(sql, params = []) {
  const results = [];
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

// ── Giả lập API better-sqlite3 dạng prepare().run/get/all ───
function prepare(sql) {
  return {
    run:  (...args) => { const p = Array.isArray(args[0]) ? args[0] : args; return run(sql, p); },
    get:  (...args) => { const p = Array.isArray(args[0]) ? args[0] : args; return queryOne(sql, p); },
    all:  (...args) => { const p = Array.isArray(args[0]) ? args[0] : args; return queryAll(sql, p); },
    bind: (...args) => prepare(sql),
  };
}

function exec(sql) { _db.run(sql); persist(); }

module.exports = { initDb, prepare, run, queryOne, queryAll, exec, persist };
