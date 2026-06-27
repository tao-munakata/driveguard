import { Hono } from 'hono';
import { authMiddleware } from '../middleware';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();
app.use('*', authMiddleware);

app.get('/', async (c) => {
  const user = c.get('user');
  const { driver_id, date } = c.req.query();

  let sql = `
    SELECT ac.*, u.name as driver_name
    FROM alcohol_checks ac
    JOIN users u ON ac.driver_id = u.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (user.role === 'driver') {
    sql += ' AND ac.driver_id = ?';
    params.push(user.id);
  } else if (driver_id) {
    sql += ' AND ac.driver_id = ?';
    params.push(driver_id);
  }

  if (date) {
    sql += ' AND date(ac.measured_at) = ?';
    params.push(date);
  }

  sql += ' ORDER BY ac.measured_at DESC LIMIT 50';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const { report_id, phase, value } = await c.req.json();
  const result = value >= 0.15 ? 'fail' : 'pass';
  const id = crypto.randomUUID();
  const measured_at = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO alcohol_checks (id, driver_id, report_id, phase, value, result, measured_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user.id, report_id || null, phase, value, result, measured_at).run();

  const row = await c.env.DB.prepare('SELECT * FROM alcohol_checks WHERE id = ?').bind(id).first();
  return c.json(row, 201);
});

export default app;
