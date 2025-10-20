import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, sql } from './db';
import { authGuard } from './middleware';
import { requireRole } from './middleware';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password, fullName, role } = parsed.data;

  const pool = await getPool();
  const exist = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT 1 FROM dbo.[User] WHERE Email=@email');
  if (exist.recordset.length) return res.status(409).json({ message: 'Email already registered' });

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  await pool.request()
    .input('email', sql.NVarChar, email)
    .input('hash', sql.VarBinary, Buffer.from(hash))
    .input('salt', sql.VarBinary, Buffer.from(salt))
    .input('fullName', sql.NVarChar, fullName)
    .input('role', sql.NVarChar, role)
    .query(`INSERT INTO dbo.[User](Email,PasswordHash,PasswordSalt,FullName,Role)
            VALUES(@email,@hash,@salt,@fullName,@role)`);

  res.status(201).json({ message: 'Registered' });
});

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { email, password } = parsed.data;
  const pool = await getPool();

  const rs = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT Id, Email, PasswordHash, Role FROM dbo.[User] WHERE Email=@email');

  if (!rs.recordset.length) return res.status(401).json({ message: 'Invalid credentials' });

  const user = rs.recordset[0];
  const hashStr = Buffer.from(user.PasswordHash).toString();
  const ok = bcrypt.compareSync(password, hashStr);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: user.Id, email: user.Email, role: user.Role },
    process.env.JWT_SECRET!,
    { expiresIn: '2h' }
  );

  res.json({ token });
});

router.get('/protected', authGuard, (req, res) => {
  res.json({
    message: 'ok',
    user: (req as any).user,
  });
});

export default router;

router.get('/profile', authGuard, async (req, res) => {
  const user = (req as any).user; // { sub, email, role, ... }
  const pool = await getPool();
  const rs = await pool.request()
    .input('id', sql.Int, user.sub)
    .query('SELECT Id, Email, FullName, Role, CreatedAt FROM dbo.[User] WHERE Id=@id');

  if (!rs.recordset.length) return res.status(404).json({ message: 'User not found' });
  res.json({ profile: rs.recordset[0] });
});

// รายชื่อผู้ใช้ทั้งหมด (เฉพาะ ADMIN)
router.get('/users', authGuard, requireRole('ADMIN'), async (_req, res) => {
  const pool = await getPool();
  const rs = await pool.request()
    .query('SELECT Id, Email, FullName, Role, CreatedAt FROM dbo.[User] ORDER BY Id DESC');
  res.json({ users: rs.recordset });
});
