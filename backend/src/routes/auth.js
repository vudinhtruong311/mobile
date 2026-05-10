// backend/src/routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SECRET  = process.env.JWT_SECRET || 'bibliosphere_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

// ── POST /auth/login ──────────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Cần nhập tên đăng nhập và mật khẩu.' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET, { expiresIn: EXPIRES }
  );

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// ── POST /auth/register ───────────────────────────────────────
router.post('/register', (req, res) => {
  const { username, password, full_name, email, role = 'staff' } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Cần nhập tên đăng nhập và mật khẩu.' });
  if (username.trim().length < 3)
    return res.status(400).json({ error: 'Tên đăng nhập tối thiểu 3 ký tự.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự.' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(username.trim().toLowerCase(), hash, full_name, email, role);
    const user = db.prepare('SELECT id,username,full_name,email,role,created_at FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (e) {
    if (e.message.includes('UNIQUE'))
      return res.status(400).json({ error: `Tên đăng nhập '${username}' đã tồn tại.` });
    res.status(500).json({ error: e.message });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id,username,full_name,email,phone,department,bio,role,created_at FROM users WHERE id=?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  res.json(user);
});

// ── PUT /auth/profile ─────────────────────────────────────────
router.put('/profile', requireAuth, (req, res) => {
  const allowed = ['full_name','email','phone','department','bio'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length)
    return res.status(400).json({ error: 'Không có trường hợp lệ.' });

  const set = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${set} WHERE id = ?`).run(...Object.values(updates), req.user.id);
  const user = db.prepare('SELECT id,username,full_name,email,phone,department,bio,role FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

// ── PUT /auth/password ────────────────────────────────────────
router.put('/password', requireAuth, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: 'Cần nhập mật khẩu cũ và mới.' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự.' });

  const user = db.prepare('SELECT password_hash FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(old_password, user.password_hash))
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });

  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ message: 'Đổi mật khẩu thành công.' });
});

// ── POST /auth/logout ─────────────────────────────────────────
router.post('/logout', requireAuth, (req, res) => {
  // JWT stateless — client tự xóa token
  res.json({ message: 'Đã đăng xuất.' });
});

module.exports = router;
