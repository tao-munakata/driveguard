import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();
app.use('*', authMiddleware, requireRole('manager'));

app.get('/dashboard', async (c) => {
  const [pending, approved, rejected, total, alcohol_fails] = await Promise.all([
    c.env.DB.prepare("SELECT count(*) as cnt FROM driving_reports WHERE status='pending'").first<any>(),
    c.env.DB.prepare("SELECT count(*) as cnt FROM driving_reports WHERE status='approved'").first<any>(),
    c.env.DB.prepare("SELECT count(*) as cnt FROM driving_reports WHERE status='rejected'").first<any>(),
    c.env.DB.prepare("SELECT count(*) as cnt FROM driving_reports").first<any>(),
    c.env.DB.prepare("SELECT count(*) as cnt FROM alcohol_checks WHERE result='fail'").first<any>(),
  ]);

  const { results: recent_reports } = await c.env.DB.prepare(`
    SELECT dr.*, u.name as driver_name, v.name as vehicle_name
    FROM driving_reports dr
    JOIN users u ON dr.driver_id = u.id
    JOIN vehicles v ON dr.vehicle_id = v.id
    ORDER BY dr.created_at DESC LIMIT 20
  `).all();

  const { results: recent_checks } = await c.env.DB.prepare(`
    SELECT ac.*, u.name as driver_name
    FROM alcohol_checks ac
    JOIN users u ON ac.driver_id = u.id
    ORDER BY ac.measured_at DESC LIMIT 20
  `).all();

  return c.json({
    pending: pending?.cnt || 0,
    approved: approved?.cnt || 0,
    rejected: rejected?.cnt || 0,
    total: total?.cnt || 0,
    alcohol_fails: alcohol_fails?.cnt || 0,
    recent_reports,
    recent_checks,
  });
});

app.put('/reports/:id/approve', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');

  await c.env.DB.prepare("UPDATE driving_reports SET status='approved' WHERE id=?").bind(id).run();
  await c.env.DB.prepare(
    "INSERT INTO approvals (id, report_id, manager_id, action) VALUES (?, ?, ?, 'approved')"
  ).bind(crypto.randomUUID(), id, user.id).run();

  return c.json({ success: true });
});

app.put('/reports/:id/reject', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');
  const { note } = await c.req.json().catch(() => ({ note: '' }));

  await c.env.DB.prepare("UPDATE driving_reports SET status='rejected' WHERE id=?").bind(id).run();
  await c.env.DB.prepare(
    "INSERT INTO approvals (id, report_id, manager_id, action, note) VALUES (?, ?, ?, 'rejected', ?)"
  ).bind(crypto.randomUUID(), id, user.id, note || null).run();

  return c.json({ success: true });
});

export default app;
