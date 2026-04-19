import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// 開発プロジェクト一覧取得
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const db = await getDB();
        const developments = await db.all(`
            WITH task_latest_progress AS (
                SELECT development_task_id, progress_percent
                FROM development_progress
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER(PARTITION BY development_task_id ORDER BY target_year DESC, target_month DESC) as rn
                        FROM development_progress
                    ) WHERE rn = 1
                )
            ),
            project_stats AS (
                SELECT 
                    dt.development_id,
                    COUNT(dt.id) as total_tasks,
                    SUM(CASE WHEN tlp.progress_percent = 100 THEN 1 ELSE 0 END) as completed_tasks
                FROM development_tasks dt
                LEFT JOIN task_latest_progress tlp ON dt.id = tlp.development_task_id
                GROUP BY dt.development_id
            )
            SELECT d.*, u.user_name as owner_name,
                   CASE 
                       WHEN ps.total_tasks > 0 AND ps.total_tasks = ps.completed_tasks THEN 1 
                       ELSE 0 
                   END as is_all_tasks_completed
            FROM developments d
            LEFT JOIN users u ON d.owner_user_id = u.id
            LEFT JOIN project_stats ps ON d.id = ps.development_id
            ORDER BY d.created_at DESC
        `);
        res.json(developments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 開発プロジェクト詳細取得
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        const development = await db.get(`
            SELECT d.*, u.user_name as owner_name 
            FROM developments d
            LEFT JOIN users u ON d.owner_user_id = u.id
            WHERE d.id = ?
        `, [id]);

        if (!development) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '開発プロジェクトが見つかりません。' } });
        }

        const tasks = await db.all(`
            WITH task_latest_progress AS (
                SELECT development_task_id, progress_percent
                FROM development_progress
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER(PARTITION BY development_task_id ORDER BY target_year DESC, target_month DESC) as rn
                        FROM development_progress
                    ) WHERE rn = 1
                )
            )
            SELECT t.*, u.user_name as assigned_user_name,
                   COALESCE(tlp.progress_percent, 0) as latest_progress_percent
            FROM development_tasks t
            LEFT JOIN users u ON t.assigned_user_id = u.id
            LEFT JOIN task_latest_progress tlp ON t.id = tlp.development_task_id
            WHERE t.development_id = ?
            ORDER BY t.created_at ASC
        `, [id]);

        development.tasks = tasks;
        res.json(development);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 開発プロジェクト登録
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { development_code, title, description, status, owner_user_id } = req.body;

        if (!development_code || !title) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '必須項目が不足しています。' } });
        }

        const db = await getDB();

        const existing = await db.get('SELECT id FROM developments WHERE development_code = ?', [development_code]);
        if (existing) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'この開発コードは既に使用されています。' } });
        }

        const result = await db.run(`
            INSERT INTO developments (development_code, title, description, status, owner_user_id)
            VALUES (?, ?, ?, ?, ?)
        `, [development_code, title, description, status || 'active', owner_user_id]);

        res.status(201).json({ id: result.lastID, message: '開発プロジェクトを登録しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 開発タスク割当登録
router.post('/:id/tasks', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { assigned_user_id, title, description, priority, due_date } = req.body;

        if (!assigned_user_id || !title) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '担当者とタイトルは必須です。' } });
        }

        const db = await getDB();

        const development = await db.get('SELECT id FROM developments WHERE id = ?', [id]);
        if (!development) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '対象の開発プロジェクトが見つかりません。' } });
        }

        const result = await db.run(`
            INSERT INTO development_tasks (development_id, assigned_user_id, title, description, priority, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [id, assigned_user_id, title, description, priority, due_date]);

        res.status(201).json({ id: result.lastID, message: '開発タスクを登録しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
