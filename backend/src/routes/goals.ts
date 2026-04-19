import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// 年間目標一覧取得 (年度指定可)
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { fiscal_year } = req.query;
        const db = await getDB();
        
        let query = `
            SELECT g.*, u.user_name as owner_name 
            FROM annual_goals g
            LEFT JOIN users u ON g.owner_user_id = u.id
        `;
        const params: any[] = [];

        if (fiscal_year) {
            query += ' WHERE g.fiscal_year = ?';
            params.push(fiscal_year);
        }

        query += ' ORDER BY g.fiscal_year DESC, g.goal_code ASC';

        const goals = await db.all(query, params);
        res.json(goals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 年間目標新規作成 (管理者専用)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { fiscal_year, goal_code, goal_title, goal_description, start_date, end_date } = req.body;

        if (!fiscal_year || !goal_code || !goal_title) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '必須項目が不足しています。' } });
        }

        const db = await getDB();

        // コード重複チェック
        const existingGoal = await db.get('SELECT id FROM annual_goals WHERE goal_code = ?', [goal_code]);
        if (existingGoal) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'この目標コードは既に登録されています。' } });
        }

        const result = await db.run(`
            INSERT INTO annual_goals (fiscal_year, goal_code, goal_title, goal_description, start_date, end_date, owner_user_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `, [fiscal_year, goal_code, goal_title, goal_description, start_date, end_date, req.user?.id]);

        res.status(201).json({ id: result.lastID, message: '年間目標を作成しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 目標詳細と割当一覧取得
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDB();

        const goal = await db.get(`
            SELECT g.*, u.user_name as owner_name 
            FROM annual_goals g
            LEFT JOIN users u ON g.owner_user_id = u.id
            WHERE g.id = ?
        `, [id]);

        if (!goal) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '目標が見つかりません。' } });
        }

        // 割当一覧
        const assignments = await db.all(`
            SELECT a.*, u.user_name as assigned_user_name
            FROM goal_assignments a
            JOIN users u ON a.assigned_user_id = u.id
            WHERE a.annual_goal_id = ?
        `, [id]);

        res.json({ ...goal, assignments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// 目標への担当者割当 (管理者専用)
router.post('/:id/assignments', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { assigned_user_id, assignment_title, assignment_description, priority, due_date } = req.body;

        if (!assigned_user_id || !assignment_title) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '必須項目が不足しています。' } });
        }

        const db = await getDB();

        // 目標存在チェック
        const goal = await db.get('SELECT id FROM annual_goals WHERE id = ?', [id]);
        if (!goal) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '目標が見つかりません。' } });
        }

        const result = await db.run(`
            INSERT INTO goal_assignments (annual_goal_id, assigned_user_id, assignment_title, assignment_description, priority, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [id, assigned_user_id, assignment_title, assignment_description, priority, due_date]);

        res.status(201).json({ id: result.lastID, message: '担当者を割り当てました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
