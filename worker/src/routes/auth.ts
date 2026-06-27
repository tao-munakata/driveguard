import { Hono } from 'hono';
import { verifyPassword, signToken } from '../auth';
import { authMiddleware } from '../middleware';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();

app.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first<any>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401);
  }

  const token = await signToken(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    c.env.JWT_SECRET
  );

  return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/me', authMiddleware, (c) => {
  return c.json(c.get('user'));
});

export default app;
