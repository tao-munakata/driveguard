import { Router, Request, Response } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { driver_id, date } = req.query;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (req.user!.role === 'driver') {
      params.push(req.user!.id);
      conditions.push(`ac.driver_id = $${params.length}`);
    } else if (driver_id) {
      params.push(driver_id);
      conditions.push(`ac.driver_id = $${params.length}`);
    }

    if (date) {
      params.push(date);
      conditions.push(`DATE(ac.measured_at) = $${params.length}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT ac.*, u.name as driver_name
      FROM alcohol_checks ac
      JOIN users u ON u.id = ac.driver_id
      ${where}
      ORDER BY ac.measured_at DESC
    `;
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

router.post('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { report_id, phase, value } = req.body;
    if (phase === undefined || value === undefined) {
      res.status(400).json({ error: 'phase と value は必須です' });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 0.999) {
      res.status(400).json({ error: 'value は 0.000〜0.999 の範囲で入力してください' });
      return;
    }

    const result_val = numValue >= 0.15 ? 'fail' : 'pass';
    const driver_id = req.user!.id;

    const result = await pool.query(
      `INSERT INTO alcohol_checks (driver_id, report_id, phase, value, result, measured_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [driver_id, report_id || null, phase, numValue, result_val]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

export default router;
