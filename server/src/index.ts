// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './auth.routes';
import { authGuard } from './middleware';
import { getPool } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// เส้นตรวจสุขภาพ DB
app.get('/health/db', async (_req, res) => {
  try {
    const pool = await getPool();
    const now = await pool.request().query('SELECT SYSDATETIMEOFFSET() AS now');
    res.json({ ok: true, now: now.recordset[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

// เส้นพื้นฐาน + auth
app.get('/', (_req, res) => res.send('Auth API running 🚀'));
app.use('/auth', authRoutes);

// เส้นที่ต้องมี token
app.get('/protected', authGuard, (req, res) => {
  res.json({ message: 'ok', user: (req as any).user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
