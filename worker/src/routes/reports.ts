import { Hono } from 'hono';
import { authMiddleware } from '../middleware';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();
app.use('*', authMiddleware);

app.get('/', async (c) => {
  const user = c.get('user');
  const { driver_id, date_from, date_to, status } = c.req.query();

  let sql = `
    SELECT dr.*, u.name as driver_name, v.name as vehicle_name
    FROM driving_reports dr
    JOIN users u ON dr.driver_id = u.id
    JOIN vehicles v ON dr.vehicle_id = v.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (user.role === 'driver') {
    sql += ' AND dr.driver_id = ?';
    params.push(user.id);
  } else if (driver_id) {
    sql += ' AND dr.driver_id = ?';
    params.push(driver_id);
  }

  if (date_from) { sql += ' AND dr.report_date >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND dr.report_date <= ?'; params.push(date_to); }
  if (status) { sql += ' AND dr.status = ?'; params.push(status); }

  sql += ' ORDER BY dr.report_date DESC, dr.created_at DESC LIMIT 100';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const { report_date, vehicle_id, work_content } = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO driving_reports (id, report_date, driver_id, vehicle_id, work_content) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, report_date, user.id, vehicle_id, work_content).run();

  const row = await c.env.DB.prepare(`
    SELECT dr.*, u.name as driver_name, v.name as vehicle_name
    FROM driving_reports dr
    JOIN users u ON dr.driver_id = u.id
    JOIN vehicles v ON dr.vehicle_id = v.id
    WHERE dr.id = ?
  `).bind(id).first();
  return c.json(row, 201);
});

app.get('/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');

  const report = await c.env.DB.prepare(`
    SELECT dr.*, u.name as driver_name, v.name as vehicle_name
    FROM driving_reports dr
    JOIN users u ON dr.driver_id = u.id
    JOIN vehicles v ON dr.vehicle_id = v.id
    WHERE dr.id = ?
  `).bind(id).first<any>();

  if (!report) return c.json({ error: '見つかりません' }, 404);
  if (user.role === 'driver' && report.driver_id !== user.id) return c.json({ error: 'アクセス権限がありません' }, 403);

  const { results: trips } = await c.env.DB.prepare('SELECT * FROM trip_records WHERE report_id = ?').bind(id).all();
  const { results: checks } = await c.env.DB.prepare(`
    SELECT ac.*, u.name as driver_name FROM alcohol_checks ac JOIN users u ON ac.driver_id = u.id WHERE ac.report_id = ?
  `).bind(id).all();

  return c.json({ ...report, trip_records: trips, alcohol_checks: checks });
});

app.put('/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');
  const data = await c.req.json();

  const report = await c.env.DB.prepare('SELECT * FROM driving_reports WHERE id = ?').bind(id).first<any>();
  if (!report) return c.json({ error: '見つかりません' }, 404);
  if (user.role === 'driver' && report.driver_id !== user.id) return c.json({ error: 'アクセス権限がありません' }, 403);

  const fields = ['report_date', 'vehicle_id', 'work_content'].filter(f => data[f] !== undefined);
  if (fields.length === 0) return c.json({ error: '更新するフィールドがありません' }, 400);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => data[f]);

  await c.env.DB.prepare(`UPDATE driving_reports SET ${setClause} WHERE id = ?`).bind(...values, id).run();

  const updated = await c.env.DB.prepare(`
    SELECT dr.*, u.name as driver_name, v.name as vehicle_name
    FROM driving_reports dr JOIN users u ON dr.driver_id = u.id JOIN vehicles v ON dr.vehicle_id = v.id
    WHERE dr.id = ?
  `).bind(id).first();
  return c.json(updated);
});

app.post('/:id/trips', async (c) => {
  const { id } = c.req.param();
  const { depart_at, arrive_at, distance_km, refueled, fuel_amount, fuel_cost, fuel_place } = await c.req.json();
  const tripId = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO trip_records (id, report_id, depart_at, arrive_at, distance_km, refueled, fuel_amount, fuel_cost, fuel_place) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(tripId, id, depart_at, arrive_at, distance_km, refueled ? 1 : 0, fuel_amount || null, fuel_cost || null, fuel_place || null).run();

  const row = await c.env.DB.prepare('SELECT * FROM trip_records WHERE id = ?').bind(tripId).first();
  return c.json(row, 201);
});

export default app;
