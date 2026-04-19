import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// 日次実施履歴取得
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { target_date } = req.query; // YYYY-MM-DD
        if (!target_date) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '対象日付が必要です。' } });
        }

        const db = await getDB();
        
        // 当日の実施状況を取得。存在しないマスタータスクも考慮してLEFT JOIN
        const history = await db.all(`
            SELECT 
                t.id as task_id,
                t.title,
                t.task_detail,
                t.estimated_time_minutes,
                h.id as history_id,
                h.status,
                h.completion_comment,
                h.actual_time_minutes
            FROM daily_tasks t
            LEFT JOIN daily_task_histories h ON t.id = h.daily_task_id AND h.target_date = ?
            WHERE t.assigned_user_id = ? AND t.is_active = 1
            ORDER BY t.task_order ASC
        `, [target_date, req.user?.id]);

        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 日次実施状況の保存・更新
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { daily_task_id, target_date, status, completion_comment, actual_time_minutes } = req.body;

        if (!daily_task_id || !target_date || !status) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '必須項目が不足しています。' } });
        }

        const db = await getDB();

        // タスク所有権チェック
        const task = await db.get('SELECT id FROM daily_tasks WHERE id = ? AND assigned_user_id = ?', [daily_task_id, req.user?.id]);
        if (!task) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'タスクが見つかりません。' } });
        }


        // 既存履歴チェック
        const existing = await db.get(`
            SELECT id FROM daily_task_histories 
            WHERE daily_task_id = ? AND target_date = ?
        `, [daily_task_id, target_date]);

        if (existing) {
            await db.run(`
                UPDATE daily_task_histories
                SET status = ?, 
                    completion_comment = ?, 
                    actual_time_minutes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, completion_comment, actual_time_minutes, existing.id]);
        } else {
            await db.run(`
                INSERT INTO daily_task_histories (daily_task_id, target_date, status, completion_comment, actual_time_minutes)
                VALUES (?, ?, ?, ?, ?)
            `, [daily_task_id, target_date, status, completion_comment, actual_time_minutes]);
        }

        res.json({ message: '実施状況を保存しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
