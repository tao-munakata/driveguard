import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'driveguard_jwt_secret_2026';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      secret,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

router.get('/me', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'ユーザーが見つかりません' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

export default router;
