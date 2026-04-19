import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// FAQ一覧取得
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const db = await getDB();
        const faqs = await db.all(`
            SELECT f.*, 
                   u1.user_name as assignee_name,
                   u2.user_name as creator_name
            FROM faqs f
            LEFT JOIN users u1 ON f.assignee_user_id = u1.id
            LEFT JOIN users u2 ON f.created_by = u2.id
            ORDER BY f.created_at DESC
        `);
        res.json(faqs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// FAQ登録
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { title, question_detail, answer_detail, status, assignee_user_id, progress_percent } = req.body;

        if (!title || !question_detail) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'タイトルと質問内容は必須です。' } });
        }

        const db = await getDB();

        const result = await db.run(`
            INSERT INTO faqs (title, question_detail, answer_detail, status, progress_percent, assignee_user_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, question_detail, answer_detail || '', status || 'new', progress_percent || 0, assignee_user_id || null, req.user?.id]);

        res.status(201).json({ id: result.lastID, message: 'FAQを登録しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// FAQ更新
router.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, question_detail, answer_detail, status, assignee_user_id, progress_percent } = req.body;

        if (!title || !question_detail) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'タイトルと質問内容は必須です。' } });
        }

        const db = await getDB();

        const faq = await db.get('SELECT id FROM faqs WHERE id = ?', [id]);
        if (!faq) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '対象のFAQが見つかりません。' } });
        }

        await db.run(`
            UPDATE faqs
            SET title = ?,
                question_detail = ?,
                answer_detail = ?,
                status = ?,
                progress_percent = ?,
                assignee_user_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [title, question_detail, answer_detail || '', status, progress_percent || 0, assignee_user_id || null, id]);

        res.json({ message: 'FAQを更新しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// FAQ削除
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDB();

        const faq = await db.get('SELECT created_by FROM faqs WHERE id = ?', [id]);
        
        if (!faq) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: '対象のFAQが見つかりません。' } });
        }

        if (req.user?.role_code !== 'admin' && faq.created_by !== req.user?.id) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'このFAQを削除する権限がありません。' } });
        }

        await db.run('DELETE FROM faqs WHERE id = ?', [id]);
        res.json({ message: 'FAQを削除しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
