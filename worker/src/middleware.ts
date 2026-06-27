import { createMiddleware } from 'hono/factory';
import { verifyToken } from './auth';
import type { Env } from './index';

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: { user: { id: string; email: string; role: string; name: string } } }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: '認証が必要です' }, 401);
    }
    try {
      const token = authHeader.slice(7);
      const user = await verifyToken(token, c.env.JWT_SECRET);
      c.set('user', user);
      await next();
    } catch {
      return c.json({ error: 'トークンが無効です' }, 401);
    }
  }
);

export const requireRole = (role: string) =>
  createMiddleware<{ Bindings: Env; Variables: { user: { id: string; email: string; role: string; name: string } } }>(
    async (c, next) => {
      const user = c.get('user');
      if (user.role !== role) {
        return c.json({ error: 'アクセス権限がありません' }, 403);
      }
      await next();
    }
  );
