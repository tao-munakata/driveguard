import { Router, Request, Response } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { driver_id, date_from, date_to, status } = req.query;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (req.user!.role === 'driver') {
      params.push(req.user!.id);
      conditions.push(`dr.driver_id = $${params.length}`);
    } else if (driver_id) {
      params.push(driver_id);
      conditions.push(`dr.driver_id = $${params.length}`);
    }

    if (date_from) {
      params.push(date_from);
      conditions.push(`dr.report_date >= $${params.length}`);
    }
    if (date_to) {
      params.push(date_to);
      conditions.push(`dr.report_date <= $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`dr.status = $${params.length}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT dr.*, u.name as driver_name, v.name as vehicle_name, v.plate as vehicle_plate
      FROM driving_reports dr
      JOIN users u ON u.id = dr.driver_id
      JOIN vehicles v ON v.id = dr.vehicle_id
      ${where}
      ORDER BY dr.report_date DESC, dr.created_at DESC
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
    const { report_date, vehicle_id, work_content } = req.body;
    if (!report_date || !vehicle_id || !work_content) {
      res.status(400).json({ error: '日付・車両・業務内容は必須です' });
      return;
    }
    const driver_id = req.user!.id;
    const result = await pool.query(
      `INSERT INTO driving_reports (report_date, driver_id, vehicle_id, work_content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [report_date, driver_id, vehicle_id, work_content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

router.get('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reportResult = await pool.query(
      `SELECT dr.*, u.name as driver_name, v.name as vehicle_name, v.plate as vehicle_plate
       FROM driving_reports dr
       JOIN users u ON u.id = dr.driver_id
       JOIN vehicles v ON v.id = dr.vehicle_id
       WHERE dr.id = $1`,
      [id]
    );
    if (!reportResult.rows[0]) {
      res.status(404).json({ error: '日報が見つかりません' });
      return;
    }
    const report = reportResult.rows[0];
    if (req.user!.role === 'driver' && report.driver_id !== req.user!.id) {
      res.status(403).json({ error: 'アクセス権限がありません' });
      return;
    }

    const tripsResult = await pool.query(
      'SELECT * FROM trip_records WHERE report_id = $1 ORDER BY depart_at',
      [id]
    );
    const alcoholResult = await pool.query(
      'SELECT * FROM alcohol_checks WHERE report_id = $1 ORDER BY measured_at',
      [id]
    );

    res.json({ ...report, trips: tripsResult.rows, alcohol_checks: alcoholResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

router.put('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { report_date, vehicle_id, work_content } = req.body;

    const existing = await pool.query('SELECT * FROM driving_reports WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      res.status(404).json({ error: '日報が見つかりません' });
      return;
    }
    const report = existing.rows[0];
    if (req.user!.role === 'driver') {
      if (report.driver_id !== req.user!.id) {
        res.status(403).json({ error: 'アクセス権限がありません' });
        return;
      }
      if (report.status !== 'pending') {
        res.status(400).json({ error: '承認済みまたは差し戻し済みの日報は編集できません' });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE driving_reports SET report_date=$1, vehicle_id=$2, work_content=$3
       WHERE id=$4 RETURNING *`,
      [report_date || report.report_date, vehicle_id || report.vehicle_id, work_content || report.work_content, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

router.post('/:id/trips', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { depart_at, arrive_at, distance_km, refueled, fuel_amount, fuel_cost, fuel_place } = req.body;

    if (!depart_at || !arrive_at || distance_km === undefined) {
      res.status(400).json({ error: '出発時刻・到着時刻・走行距離は必須です' });
      return;
    }

    const reportCheck = await pool.query('SELECT id FROM driving_reports WHERE id = $1', [id]);
    if (!reportCheck.rows[0]) {
      res.status(404).json({ error: '日報が見つかりません' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO trip_records (report_id, depart_at, arrive_at, distance_km, refueled, fuel_amount, fuel_cost, fuel_place)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, depart_at, arrive_at, distance_km, refueled || false, fuel_amount || null, fuel_cost || null, fuel_place || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

export default router;
