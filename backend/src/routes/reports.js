// backend/src/routes/reports.js
const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function today() { return new Date().toISOString().split('T')[0]; }

// ── GET /reports/dashboard ────────────────────────────────────
router.get('/dashboard', requireAuth, (req, res) => {
  const t = today();
  const monthStart = t.substring(0, 7) + '-01';

  res.json({
    total_books:           db.prepare('SELECT COALESCE(SUM(quantity),0) as v FROM books').get().v,
    available_books:       db.prepare('SELECT COALESCE(SUM(available),0) as v FROM books').get().v,
    borrowed_books:        db.prepare('SELECT COALESCE(SUM(quantity-available),0) as v FROM books').get().v,
    total_members:         db.prepare('SELECT COUNT(*) as v FROM members').get().v,
    active_borrows:        db.prepare("SELECT COUNT(*) as v FROM borrows WHERE status='borrowing'").get().v,
    overdue_count:         db.prepare("SELECT COUNT(*) as v FROM borrows WHERE status='borrowing' AND due_date<?").get(t).v,
    monthly_borrows:       db.prepare('SELECT COUNT(*) as v FROM borrows WHERE borrow_date>=?').get(monthStart).v,
    total_fine_collected:  db.prepare('SELECT COALESCE(SUM(fine),0) as v FROM borrows WHERE fine>0').get().v,
    uncollected_fine:      db.prepare("SELECT COALESCE(SUM((julianday(?)-julianday(due_date))*2000),0) as v FROM borrows WHERE status='borrowing' AND due_date<?").get(t, t).v,
  });
});

// ── GET /reports/top-books ────────────────────────────────────
router.get('/top-books', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(db.prepare(`
    SELECT bk.id, bk.title, bk.author, bk.category, COUNT(b.id) AS borrow_count
    FROM borrows b JOIN books bk ON bk.id = b.book_id
    GROUP BY bk.id ORDER BY borrow_count DESC LIMIT ?
  `).all(limit));
});

// ── GET /reports/top-members ──────────────────────────────────
router.get('/top-members', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(db.prepare(`
    SELECT m.id, m.full_name, m.member_code, m.member_type,
           COUNT(b.id) AS borrow_count,
           SUM(CASE WHEN b.status='borrowing' THEN 1 ELSE 0 END) AS currently_borrowing
    FROM borrows b JOIN members m ON m.id = b.member_id
    GROUP BY m.id ORDER BY borrow_count DESC LIMIT ?
  `).all(limit));
});

// ── GET /reports/monthly ──────────────────────────────────────
router.get('/monthly', requireAuth, (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const rows = db.prepare(`
    SELECT strftime('%m', borrow_date) AS month,
           COUNT(*) AS total_borrows,
           SUM(CASE WHEN return_date IS NOT NULL THEN 1 ELSE 0 END) AS returned,
           COALESCE(SUM(fine),0) AS total_fine
    FROM borrows WHERE strftime('%Y', borrow_date) = ?
    GROUP BY month ORDER BY month
  `).all(String(year));

  const map = Object.fromEntries(rows.map(r => [r.month, r]));
  const full = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return map[m] || { month: m, total_borrows: 0, returned: 0, total_fine: 0 };
  });
  res.json(full);
});

// ── GET /reports/overdue ──────────────────────────────────────
router.get('/overdue', requireAuth, (req, res) => {
  const t = today();
  const items = db.prepare(`
    SELECT b.id, b.due_date, b.borrow_date,
           m.full_name, m.member_code, m.phone, m.email,
           bk.title AS book_title,
           CAST(julianday(?) - julianday(b.due_date) AS INTEGER) AS days_overdue,
           (CAST(julianday(?) - julianday(b.due_date) AS INTEGER) * 2000) AS estimated_fine
    FROM borrows b
    JOIN members m  ON m.id  = b.member_id
    JOIN books   bk ON bk.id = b.book_id
    WHERE b.status = 'borrowing' AND b.due_date < ?
    ORDER BY b.due_date
  `).all(t, t, t);

  res.json({ count: items.length, total_estimated_fine: items.reduce((s, i) => s + i.estimated_fine, 0), items });
});

// ── GET /reports/rarely-borrowed ─────────────────────────────
router.get('/rarely-borrowed', requireAuth, (req, res) => {
  const threshold = parseInt(req.query.threshold) || 2;
  res.json(db.prepare(`
    SELECT bk.id, bk.title, bk.author, bk.category, bk.quantity, bk.available,
           COUNT(b.id) AS borrow_count
    FROM books bk LEFT JOIN borrows b ON b.book_id = bk.id
    GROUP BY bk.id HAVING borrow_count < ? ORDER BY borrow_count, bk.title
  `).all(threshold));
});

// ── GET /settings ─────────────────────────────────────────────
router.get('/settings', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

// ── PUT /settings ─────────────────────────────────────────────
router.put('/settings', requireAdmin, (req, res) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)');
  const upsert = db.transaction((updates) => {
    for (const [k, v] of Object.entries(updates)) stmt.run(k, String(v));
  });
  upsert(req.body);
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

module.exports = router;
