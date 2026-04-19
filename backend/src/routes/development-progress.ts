import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// 月次進捗一覧取得
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { development_task_id, target_year, target_month } = req.query;
        const db = await getDB();

        let query = `
            SELECT p.*, u.user_name as submitted_user_name, t.title as task_title
            FROM development_progress p
            JOIN development_tasks t ON p.development_task_id = t.id
            JOIN users u ON p.submitted_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (development_task_id) {
            query += ' AND p.development_task_id = ?';
            params.push(development_task_id);
        }
        if (target_year) {
            query += ' AND p.target_year = ?';
            params.push(target_year);
        }
        if (target_month) {
            query += ' AND p.target_month = ?';
            params.push(target_month);
        }

        if (req.user?.role_code !== 'admin') {
            query += ' AND (t.assigned_user_id = ? OR p.submitted_by = ?)';
            params.push(req.user?.id, req.user?.id);
        }

        query += ' ORDER BY p.target_year DESC, p.target_month DESC, p.created_at DESC';

        const progress = await db.all(query, params);
        res.json(progress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 月次進捗の登録・更新
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { 
            development_task_id, 
            target_year, 
            target_month, 
            progress_percent, 
            progress_comment, 
            delay_reason, 
            next_month_plan 
        } = req.body;

        if (!development_task_id || !target_year || !target_month || progress_percent === undefined) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '必須項目が不足しています。' } });
        }

        const db = await getDB();

        const task = await db.get('SELECT assigned_user_id FROM development_tasks WHERE id = ?', [development_task_id]);
        if (!task) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '対象のタスクが見つかりません。' } });
        }

        if (req.user?.role_code !== 'admin' && task.assigned_user_id !== req.user?.id) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'このタスクの進捗を報告する権限がありません。' } });
        }

        const existing = await db.get(`
            SELECT id FROM development_progress 
            WHERE development_task_id = ? AND target_year = ? AND target_month = ?
        `, [development_task_id, target_year, target_month]);

        if (existing) {
            await db.run(`
                UPDATE development_progress
                SET progress_percent = ?, 
                    progress_comment = ?, 
                    delay_reason = ?, 
                    next_month_plan = ?,
                    submitted_by = ?,
                    submitted_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [progress_percent, progress_comment, delay_reason, next_month_plan, req.user?.id, existing.id]);
            
            res.json({ message: '進捗を更新しました。' });
        } else {
            await db.run(`
                INSERT INTO development_progress (
                    development_task_id, target_year, target_month, progress_percent, 
                    progress_comment, delay_reason, next_month_plan, submitted_by, submitted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [development_task_id, target_year, target_month, progress_percent, progress_comment, delay_reason, next_month_plan, req.user?.id]);
            
            res.status(201).json({ message: '進捗を登録しました。' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 月次進捗の削除
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDB();

        const progress = await db.get('SELECT submitted_by FROM development_progress WHERE id = ?', [id]);
        
        if (!progress) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '対象の進捗データが見つかりません。' } });
        }

        if (req.user?.role_code !== 'admin' && progress.submitted_by !== req.user?.id) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'この進捗データを削除する権限がありません。' } });
        }

        await db.run('DELETE FROM development_progress WHERE id = ?', [id]);
        res.json({ message: '進捗データを削除しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
