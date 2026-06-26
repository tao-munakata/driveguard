import { Router, Request, Response } from 'express';
import pool from '../db';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyToken);
router.use(requireRole('manager'));

router.get('/dashboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(*) AS total
      FROM driving_reports
    `);

    const alcoholFailsResult = await pool.query(`
      SELECT COUNT(*) AS alcohol_fails FROM alcohol_checks WHERE result = 'fail'
    `);

    const recentChecksResult = await pool.query(`
      SELECT ac.*, u.name as driver_name
      FROM alcohol_checks ac
      JOIN users u ON u.id = ac.driver_id
      ORDER BY ac.measured_at DESC
      LIMIT 10
    `);

    const recentReportsResult = await pool.query(`
      SELECT dr.*, u.name as driver_name, v.name as vehicle_name
      FROM driving_reports dr
      JOIN users u ON u.id = dr.driver_id
      JOIN vehicles v ON v.id = dr.vehicle_id
      ORDER BY dr.created_at DESC
      LIMIT 10
    `);

    res.json({
      ...statsResult.rows[0],
      alcohol_fails: parseInt(alcoholFailsResult.rows[0].alcohol_fails, 10),
      recent_checks: recentChecksResult.rows,
      recent_reports: recentReportsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

router.put('/reports/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const manager_id = req.user!.id;

    const check = await pool.query('SELECT id, status FROM driving_reports WHERE id = $1', [id]);
    if (!check.rows[0]) {
      res.status(404).json({ error: '日報が見つかりません' });
      return;
    }

    await pool.query('UPDATE driving_reports SET status = $1 WHERE id = $2', ['approved', id]);
    await pool.query(
      `INSERT INTO approvals (report_id, manager_id, action) VALUES ($1, $2, $3)`,
      [id, manager_id, 'approved']
    );

    res.json({ message: '承認しました' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

router.put('/reports/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const manager_id = req.user!.id;

    const check = await pool.query('SELECT id FROM driving_reports WHERE id = $1', [id]);
    if (!check.rows[0]) {
      res.status(404).json({ error: '日報が見つかりません' });
      return;
    }

    await pool.query('UPDATE driving_reports SET status = $1 WHERE id = $2', ['rejected', id]);
    await pool.query(
      `INSERT INTO approvals (report_id, manager_id, action, note) VALUES ($1, $2, $3, $4)`,
      [id, manager_id, 'rejected', note || null]
    );

    res.json({ message: '差し戻しました' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

export default router;
