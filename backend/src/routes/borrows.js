// backend/src/routes/borrows.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const FINE_PER_DAY   = parseInt(process.env.FINE_PER_DAY)        || 2000;
const MAX_BOOKS      = parseInt(process.env.MAX_BOOKS_PER_USER)   || 5;
const BORROW_DAYS    = parseInt(process.env.DEFAULT_BORROW_DAYS)  || 14;

function today() { return new Date().toISOString().split('T')[0]; }
function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function calcFine(dueDate) {
  const diff = Math.floor((new Date(today()) - new Date(dueDate)) / 86400000);
  return Math.max(0, diff * FINE_PER_DAY);
}

const BORROW_JOIN = `
  SELECT b.*, m.full_name AS member_name, m.member_code, m.phone, m.email,
         bk.title AS book_title, bk.author
  FROM borrows b
  JOIN members m  ON m.id  = b.member_id
  JOIN books   bk ON bk.id = b.book_id
`;

// ── GET /borrows ──────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const { member_id, overdue_only } = req.query;
  let sql = BORROW_JOIN + " WHERE b.status = 'borrowing'";
  const params = [];

  if (member_id) { sql += ' AND b.member_id = ?'; params.push(member_id); }
  if (overdue_only === 'true') { sql += ` AND b.due_date < ?`; params.push(today()); }
  sql += ' ORDER BY b.due_date';

  res.json(db.prepare(sql).all(...params));
});

// ── POST /borrows ─────────────────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  const { member_id, book_id, borrow_days = BORROW_DAYS, note } = req.body;
  if (!member_id || !book_id)
    return res.status(400).json({ error: 'Cần cung cấp member_id và book_id.' });

  const member = db.prepare('SELECT * FROM members WHERE id=?').get(member_id);
  if (!member) return res.status(404).json({ error: `Không tìm thấy bạn đọc #${member_id}` });
  if (member.card_expiry && member.card_expiry < today())
    return res.status(400).json({ error: `Thẻ bạn đọc '${member.full_name}' đã hết hạn.` });

  const book = db.prepare('SELECT * FROM books WHERE id=?').get(book_id);
  if (!book) return res.status(404).json({ error: `Không tìm thấy sách #${book_id}` });
  if (book.available < 1)
    return res.status(400).json({ error: `Sách '${book.title}' đã hết bản để mượn.` });

  const current = db.prepare(
    "SELECT COUNT(*) as cnt FROM borrows WHERE member_id=? AND status='borrowing'"
  ).get(member_id).cnt;
  if (current >= MAX_BOOKS)
    return res.status(400).json({ error: `Bạn đọc đang mượn ${current}/${MAX_BOOKS} sách, không thể mượn thêm.` });

  const borrow_date = today();
  const due_date    = addDays(parseInt(borrow_days));

  const result = db.prepare(`
    INSERT INTO borrows (member_id, book_id, borrow_date, due_date, note, status, created_by)
    VALUES (?, ?, ?, ?, ?, 'borrowing', ?)
  `).run(member_id, book_id, borrow_date, due_date, note || null, req.user.id);

  db.prepare('UPDATE books SET available = available - 1 WHERE id=?').run(book_id);

  res.status(201).json(db.prepare(BORROW_JOIN + ' WHERE b.id=?').get(result.lastInsertRowid));
});

// ── PUT /borrows/:id/return ───────────────────────────────────
router.put('/:id/return', requireAuth, (req, res) => {
  const borrow = db.prepare('SELECT * FROM borrows WHERE id=?').get(req.params.id);
  if (!borrow) return res.status(404).json({ error: `Không tìm thấy phiếu mượn #${req.params.id}` });
  if (borrow.status === 'returned')
    return res.status(400).json({ error: `Phiếu #${req.params.id} đã được trả trước đó.` });

  const return_date = today();
  const fine = calcFine(borrow.due_date);

  db.prepare(`
    UPDATE borrows SET status='returned', return_date=?, fine=? WHERE id=?
  `).run(return_date, fine, req.params.id);
  db.prepare('UPDATE books SET available = available + 1 WHERE id=?').run(borrow.book_id);

  res.json(db.prepare(BORROW_JOIN + ' WHERE b.id=?').get(req.params.id));
});

// ── PUT /borrows/:id/extend ───────────────────────────────────
router.put('/:id/extend', requireAuth, (req, res) => {
  const borrow = db.prepare('SELECT * FROM borrows WHERE id=?').get(req.params.id);
  if (!borrow) return res.status(404).json({ error: `Không tìm thấy phiếu mượn #${req.params.id}` });
  if (borrow.status !== 'borrowing')
    return res.status(400).json({ error: 'Chỉ có thể gia hạn phiếu đang mượn.' });
  if (borrow.due_date < today())
    return res.status(400).json({ error: 'Phiếu đã quá hạn, không thể gia hạn.' });

  const extra = parseInt(req.query.extra_days) || BORROW_DAYS;
  const d = new Date(borrow.due_date);
  d.setDate(d.getDate() + extra);
  const new_due = d.toISOString().split('T')[0];

  db.prepare('UPDATE borrows SET due_date=? WHERE id=?').run(new_due, req.params.id);
  res.json(db.prepare(BORROW_JOIN + ' WHERE b.id=?').get(req.params.id));
});

module.exports = router;
