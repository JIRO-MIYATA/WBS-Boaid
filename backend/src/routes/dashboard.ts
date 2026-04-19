import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// ダッシュボード統計情報の取得
router.get('/stats', authenticate, async (req: Request, res: Response) => {
    try {
        const db = await getDB();
        const userId = req.user?.id;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // JST（UTC+9）での日付を取得。toISOString()はUTCを返すため、日本時間の深夜帯でずれる問題を回避
        const jstOffset = 9 * 60 * 60 * 1000;
        const jstDate = new Date(now.getTime() + jstOffset);
        const todayStr = jstDate.toISOString().split('T')[0];

        // 1. 実行中の目標 (自分に割り当てられた active な assignment 数)
        const activeGoals = await db.get(`
            SELECT COUNT(*) as count FROM goal_assignments 
            WHERE assigned_user_id = ? AND status = 'active'
        `, [userId]);

        // 2. 今月の未入力 (今月の progress がまだない assignment 数)
        const pendingMonthly = await db.get(`
            SELECT COUNT(*) as count FROM goal_assignments a
            LEFT JOIN monthly_goal_progress p ON a.id = p.goal_assignment_id AND p.target_year = ? AND p.target_month = ?
            WHERE a.assigned_user_id = ? AND a.status = 'active' AND p.id IS NULL
        `, [year, month, userId]);

        // 3. 日次対応中 (今日のルーチンで 'todo' または 'pending' のもの)
        const dailyTodo = await db.get(`
            SELECT COUNT(*) as count FROM daily_tasks t
            LEFT JOIN daily_task_histories h ON t.id = h.daily_task_id AND h.target_date = ?
            WHERE t.assigned_user_id = ? AND t.is_active = 1 AND (h.status IS NULL OR h.status != 'done')
        `, [todayStr, userId]);

        // 4. 今月完了済 (progress_percent が 100 になったもの)
        const monthlyDone = await db.get(`
            SELECT COUNT(*) as count FROM monthly_goal_progress p
            JOIN goal_assignments a ON p.goal_assignment_id = a.id
            WHERE a.assigned_user_id = ? AND p.target_year = ? AND p.target_month = ? AND p.progress_percent = 100
        `, [userId, year, month]);

        res.json({
            activeGoals: activeGoals.count,
            pendingMonthly: pendingMonthly.count,
            dailyTodo: dailyTodo.count,
            monthlyDone: monthlyDone.count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
