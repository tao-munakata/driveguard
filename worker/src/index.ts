import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import alcoholRoutes from './routes/alcohol';
import reportsRoutes from './routes/reports';
import vehiclesRoutes from './routes/vehicles';
import adminRoutes from './routes/admin';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: '*', allowHeaders: ['Authorization', 'Content-Type'] }));

app.get('/', (c) => c.json({ status: 'ok', service: 'DriveGuard API', version: '0.1.0' }));

app.route('/auth', authRoutes);
app.route('/alcohol-checks', alcoholRoutes);
app.route('/reports', reportsRoutes);
app.route('/vehicles', vehiclesRoutes);
app.route('/admin', adminRoutes);

export default app;
