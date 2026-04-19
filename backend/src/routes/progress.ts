import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// 月次進捗一覧取得
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { goal_assignment_id, target_year, target_month } = req.query;
        const db = await getDB();

        let query = `
            SELECT p.*, u.user_name as submitted_user_name, a.assignment_title
            FROM monthly_goal_progress p
            JOIN goal_assignments a ON p.goal_assignment_id = a.id
            JOIN users u ON p.submitted_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (goal_assignment_id) {
            query += ' AND p.goal_assignment_id = ?';
            params.push(goal_assignment_id);
        }
        if (target_year) {
            query += ' AND p.target_year = ?';
            params.push(target_year);
        }
        if (target_month) {
            query += ' AND p.target_month = ?';
            params.push(target_month);
        }

        // 一般ユーザーの場合は自分の関連分のみ（ただし管理者なら全件見れる想定）
        if (req.user?.role_code !== 'admin') {
            query += ' AND (a.assigned_user_id = ? OR p.submitted_by = ?)';
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
            goal_assignment_id, 
            target_year, 
            target_month, 
            progress_percent, 
            progress_comment, 
            delay_reason, 
            next_month_plan 
        } = req.body;

        if (!goal_assignment_id || !target_year || !target_month || progress_percent === undefined) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '必須項目が不足しています。' } });
        }

        const db = await getDB();

        // 割当存在チェックと権限チェック
        const assignment = await db.get('SELECT assigned_user_id FROM goal_assignments WHERE id = ?', [goal_assignment_id]);
        if (!assignment) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '対象の割当タスクが見つかりません。' } });
        }

        if (req.user?.role_code !== 'admin' && assignment.assigned_user_id !== req.user?.id) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'このタスクの進捗を報告する権限がありません。' } });
        }

        // 重複チェック（既存があれば更新、なければ挿入）
        const existing = await db.get(`
            SELECT id FROM monthly_goal_progress 
            WHERE goal_assignment_id = ? AND target_year = ? AND target_month = ?
        `, [goal_assignment_id, target_year, target_month]);

        if (existing) {
            // 更新
            await db.run(`
                UPDATE monthly_goal_progress
                SET progress_percent = ?, 
                    progress_comment = ?, 
                    delay_reason = ?, 
                    next_month_plan = ?,
                    submitted_by = ?,
                    submitted_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [progress_percent, progress_comment, delay_reason, next_month_plan, req.user?.id, existing.id]);
            
            res.json({ message: '月次進捗を更新しました。' });
        } else {
            // 新規挿入
            await db.run(`
                INSERT INTO monthly_goal_progress (
                    goal_assignment_id, target_year, target_month, progress_percent, 
                    progress_comment, delay_reason, next_month_plan, submitted_by, submitted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [goal_assignment_id, target_year, target_month, progress_percent, progress_comment, delay_reason, next_month_plan, req.user?.id]);
            
            res.status(201).json({ message: '月次進捗を登録しました。' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
