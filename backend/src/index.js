require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const db      = require('./db');

const authRouter    = require('./routes/auth');
const booksRouter   = require('./routes/books');
const membersRouter = require('./routes/members');
const borrowsRouter = require('./routes/borrows');
const reportsRouter = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/auth',    authRouter);
app.use('/books',   booksRouter);
app.use('/members', membersRouter);
app.use('/borrows', borrowsRouter);
app.use('/reports', reportsRouter);

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ message: 'BiblioSphere API dang chay. /health de kiem tra.' }));

// Cron: cap nhat trang thai qua han moi ngay 00:05
cron.schedule('5 0 * * *', () => {
  const today = new Date().toISOString().split('T')[0];
  db.run("UPDATE borrows SET status='overdue' WHERE status='borrowing' AND due_date < ?", [today]);
  console.log('[Cron] Da cap nhat phieu qua han');
});

// Khoi dong async - phai init DB truoc
db.initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nBiblioSphere API: http://0.0.0.0:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`TK mac dinh: admin / admin123\n`);
  });
}).catch(err => {
  console.error('Khong the khoi dong:', err);
  process.exit(1);
});
