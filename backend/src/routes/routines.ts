import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// ルーチンタスク一覧取得
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const db = await getDB();
        const routines = await db.all(`
            SELECT * FROM daily_tasks 
            WHERE assigned_user_id = ? 
            ORDER BY task_order ASC, created_at ASC
        `, [req.user?.id]);
        res.json(routines);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// ルーチンタスク登録
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { title, task_detail, estimated_time_minutes, task_order } = req.body;

        if (!title) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'タスク名は必須です。' } });
        }

        const db = await getDB();
        const result = await db.run(`
            INSERT INTO daily_tasks (assigned_user_id, title, task_detail, estimated_time_minutes, task_order)
            VALUES (?, ?, ?, ?, ?)
        `, [req.user?.id, title, task_detail, estimated_time_minutes || 0, task_order || 0]);

        res.status(201).json({ id: result.lastID, message: 'ルーチンタスクを登録しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// ルーチンタスク更新
router.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, task_detail, estimated_time_minutes, task_order, is_active } = req.body;

        const db = await getDB();
        
        // 所有権チェック
        const routine = await db.get('SELECT id FROM daily_tasks WHERE id = ? AND assigned_user_id = ?', [id, req.user?.id]);
        if (!routine) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'タスクが見つかりません。' } });
        }

        await db.run(`
            UPDATE daily_tasks
            SET title = ?, 
                task_detail = ?, 
                estimated_time_minutes = ?, 
                task_order = ?, 
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [title, task_detail, estimated_time_minutes, task_order, is_active === undefined ? 1 : is_active, id]);

        res.json({ message: 'ルーチンタスクを更新しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// ルーチンタスク削除
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDB();

        // 所有権チェック
        const routine = await db.get('SELECT id FROM daily_tasks WHERE id = ? AND assigned_user_id = ?', [id, req.user?.id]);
        if (!routine) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'タスクが見つかりません。' } });
        }

        await db.run('DELETE FROM daily_tasks WHERE id = ?', [id]);
        res.json({ message: 'ルーチンタスクを削除しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});


export default router;
