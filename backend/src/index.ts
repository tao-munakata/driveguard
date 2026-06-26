import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import alcoholRouter from './routes/alcohol';
import reportsRouter from './routes/reports';
import adminRouter from './routes/admin';
import pool from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/alcohol-checks', alcoholRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);

app.get('/api/vehicles', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
