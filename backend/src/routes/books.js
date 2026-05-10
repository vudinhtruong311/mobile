// backend/src/routes/books.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── GET /books ────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { q, category, available_only } = req.query;
  let sql = 'SELECT * FROM books WHERE 1=1';
  const params = [];

  if (q) {
    sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (available_only === 'true') sql += ' AND available > 0';
  sql += ' ORDER BY title';

  res.json(db.prepare(sql).all(...params));
});

// ── GET /books/:id ────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: `Không tìm thấy sách #${req.params.id}` });
  res.json(book);
});

// ── POST /books ───────────────────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  const { title, author, publisher, isbn, year, category, quantity = 1, description } = req.body;
  if (!title || !author)
    return res.status(400).json({ error: 'Tên sách và tác giả không được để trống.' });
  if (quantity < 1)
    return res.status(400).json({ error: 'Số lượng phải >= 1.' });

  try {
    const result = db.prepare(`
      INSERT INTO books (title, author, publisher, isbn, year, category, quantity, available, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, author, publisher || null, isbn || null, year || null, category || null, quantity, quantity, description || null);

    res.status(201).json(db.prepare('SELECT * FROM books WHERE id=?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE'))
      return res.status(400).json({ error: `ISBN '${isbn}' đã tồn tại.` });
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /books/:id ────────────────────────────────────────────
router.put('/:id', requireAuth, (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id=?').get(req.params.id);
  if (!book) return res.status(404).json({ error: `Không tìm thấy sách #${req.params.id}` });

  const allowed = ['title','author','publisher','isbn','year','category','quantity','description'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  // Tự tính lại available khi thay đổi quantity
  if ('quantity' in updates) {
    const borrowed = book.quantity - book.available;
    const newAvail = updates.quantity - borrowed;
    if (newAvail < 0)
      return res.status(400).json({ error: 'Số lượng mới nhỏ hơn số đang mượn.' });
    updates.available = newAvail;
  }

  if (!Object.keys(updates).length)
    return res.status(400).json({ error: 'Không có trường hợp lệ.' });

  const set = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE books SET ${set} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json(db.prepare('SELECT * FROM books WHERE id=?').get(req.params.id));
});

// ── DELETE /books/:id ─────────────────────────────────────────
router.delete('/:id', requireAuth, (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id=?').get(req.params.id);
  if (!book) return res.status(404).json({ error: `Không tìm thấy sách #${req.params.id}` });

  const borrowed = book.quantity - book.available;
  if (borrowed > 0)
    return res.status(400).json({ error: `Không thể xóa: ${borrowed} cuốn đang được mượn.` });

  try {
    // Xóa lịch sử mượn đã trả trước để tránh lỗi FOREIGN KEY
    db.prepare("DELETE FROM borrows WHERE book_id = ? AND status = 'returned'").run(req.params.id);
    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    res.json({ message: `Đã xóa sách #${req.params.id}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /books/meta/categories ────────────────────────────────
router.get('/meta/categories', (req, res) => {
  const rows = db.prepare(
    'SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category'
  ).all();
  res.json(rows.map(r => r.category));
});

module.exports = router;
