import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getDB } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';
import { INITIAL_PASSWORD, BCRYPT_SALT_ROUNDS } from '../constants';

const router = Router();

// ユーザー一覧取得 (管理者専用)
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const db = await getDB();
        const users = await db.all(`
            SELECT u.id, u.employee_code, u.user_name, u.email, u.department_name, u.first_login_required, u.is_active, r.role_code, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id DESC
        `);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// ユーザー新規作成 (管理者専用)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { user_name, email, role_code, department_name, employee_code } = req.body;

        if (!user_name || !email || !role_code) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '必須項目が不足しています。' } });
        }

        const db = await getDB();

        // ロールID取得
        const role = await db.get('SELECT id FROM roles WHERE role_code = ?', [role_code]);
        if (!role) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '無効な権限コードです。' } });
        }

        // 重複チェック
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'このメールアドレスは既に登録されています。' } });
        }

        // 初期パスワードハッシュ化
        const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_SALT_ROUNDS);

        const result = await db.run(`
            INSERT INTO users (role_id, employee_code, user_name, email, department_name, password_hash, first_login_required)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [role.id, employee_code, user_name, email, department_name, passwordHash]);

        res.status(201).json({ id: result.lastID, message: `ユーザーを作成しました。初期パスワードは ${INITIAL_PASSWORD} です。` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// ユーザー情報更新 (管理者専用)
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { user_name, email, role_code, department_name, employee_code, is_active } = req.body;

        const db = await getDB();

        // 存在チェック
        const user = await db.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'ユーザーが見つかりません。' } });
        }

        // ロールID取得
        let roleId = null;
        if (role_code) {
            const role = await db.get('SELECT id FROM roles WHERE role_code = ?', [role_code]);
            if (!role) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '無効な権限コードです。' } });
            }
            roleId = role.id;
        }

        await db.run(`
            UPDATE users 
            SET user_name = COALESCE(?, user_name),
                email = COALESCE(?, email),
                role_id = COALESCE(?, role_id),
                department_name = COALESCE(?, department_name),
                employee_code = COALESCE(?, employee_code),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [user_name, email, roleId, department_name, employee_code, is_active, id]);

        res.json({ message: 'ユーザー情報を更新しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// パスワードリセット (管理者専用)
router.post('/:id/reset-password', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDB();

        // 存在チェック
        const user = await db.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'ユーザーが見つかりません。' } });
        }

        const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_SALT_ROUNDS);

        await db.run(`
            UPDATE users 
            SET password_hash = ?, first_login_required = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [passwordHash, id]);

        // ログ記録
        await db.run(`
            INSERT INTO password_reset_logs (user_id, reset_type, reset_by, note)
            VALUES (?, 'admin_reset', ?, '管理者によるリセット')
        `, [id, req.user?.id]);

        res.json({ message: `パスワードを初期状態(${INITIAL_PASSWORD})にリセットしました。` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

export default router;
