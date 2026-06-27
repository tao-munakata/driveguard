import { Hono } from 'hono';
import { authMiddleware } from '../middleware';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();
app.use('*', authMiddleware);

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM vehicles ORDER BY name').all();
  return c.json(results);
});

export default app;
