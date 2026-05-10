// backend/src/routes/members.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── GET /members ──────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const { q, member_type } = req.query;
  let sql = 'SELECT * FROM members WHERE 1=1';
  const params = [];

  if (q) {
    sql += ' AND (full_name LIKE ? OR member_code LIKE ? OR email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (member_type) { sql += ' AND member_type = ?'; params.push(member_type); }
  sql += ' ORDER BY full_name';

  res.json(db.prepare(sql).all(...params));
});

// ── GET /members/:id ──────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM members WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: `Không tìm thấy bạn đọc #${req.params.id}` });
  res.json(m);
});

// ── POST /members ─────────────────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  const { full_name, member_code, email, phone, member_type = 'Sinh vien', card_years = 1 } = req.body;
  if (!full_name || !member_code)
    return res.status(400).json({ error: 'Họ tên và mã số không được để trống.' });

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + parseInt(card_years));
  const card_expiry = expiry.toISOString().split('T')[0];

  try {
    const result = db.prepare(`
      INSERT INTO members (full_name, member_code, email, phone, member_type, card_expiry)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(full_name, member_code, email || null, phone || null, member_type, card_expiry);

    res.status(201).json(db.prepare('SELECT * FROM members WHERE id=?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE'))
      return res.status(400).json({ error: `Mã số '${member_code}' đã tồn tại.` });
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /members/:id ──────────────────────────────────────────
router.put('/:id', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM members WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: `Không tìm thấy bạn đọc #${req.params.id}` });

  const allowed = ['full_name','email','phone','member_type','card_expiry'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length)
    return res.status(400).json({ error: 'Không có trường hợp lệ.' });

  const set = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE members SET ${set} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json(db.prepare('SELECT * FROM members WHERE id=?').get(req.params.id));
});

// ── DELETE /members/:id ───────────────────────────────────────
router.delete('/:id', requireAuth, (req, res) => {
  const m = db.prepare('SELECT * FROM members WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: `Không tìm thấy bạn đọc #${req.params.id}` });

  const active = db.prepare(
    "SELECT COUNT(*) as cnt FROM borrows WHERE member_id=? AND status='borrowing'"
  ).get(req.params.id).cnt;
  if (active > 0)
    return res.status(400).json({ error: `Không thể xóa: bạn đọc đang mượn ${active} sách.` });

  db.prepare('DELETE FROM members WHERE id=?').run(req.params.id);
  res.json({ message: `Đã xóa bạn đọc #${req.params.id}` });
});

module.exports = router;
