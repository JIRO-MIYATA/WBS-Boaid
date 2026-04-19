import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getDB } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';
import { INITIAL_PASSWORD, BCRYPT_SALT_ROUNDS } from '../constants';

const router = Router();

// ユーザー一覧取得
router.get('/', authenticate, async (req: Request, res: Response) => {
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

        // 重複チェック (メールアドレス)
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'このメールアドレスは既に登録されています。' } });
        }

        // 重複チェック (社員番号) と 空文字のnull変換
        const finalEmployeeCode = employee_code ? employee_code.trim() : null;
        if (finalEmployeeCode) {
            const existingCode = await db.get('SELECT id FROM users WHERE employee_code = ?', [finalEmployeeCode]);
            if (existingCode) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'この社員番号は既に登録されています。' } });
            }
        }

        const finalDeptName = department_name ? department_name.trim() : null;

        // 初期パスワードハッシュ化
        const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_SALT_ROUNDS);

        const result = await db.run(`
            INSERT INTO users (role_id, employee_code, user_name, email, department_name, password_hash, first_login_required)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [role.id, finalEmployeeCode, user_name, email, finalDeptName, passwordHash]);

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
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
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

        const finalUserName = user_name !== undefined ? user_name : user.user_name;
        const finalEmail = email !== undefined ? email : user.email;
        const finalRoleId = roleId !== null ? roleId : user.role_id;
        const finalDeptName = department_name !== undefined ? (department_name ? department_name.trim() : null) : user.department_name;
        const finalEmployeeCode = employee_code !== undefined ? (employee_code ? employee_code.trim() : null) : user.employee_code;
        const finalIsActive = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;

        // 重複チェック (メールアドレス)
        if (finalEmail !== user.email) {
            const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', [finalEmail]);
            if (existingEmail) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'このメールアドレスは既に登録されています。' } });
            }
        }

        // 重複チェック (社員番号)
        if (finalEmployeeCode && finalEmployeeCode !== user.employee_code) {
            const existingCode = await db.get('SELECT id FROM users WHERE employee_code = ?', [finalEmployeeCode]);
            if (existingCode) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'この社員番号は既に登録されています。' } });
            }
        }

        await db.run(`
            UPDATE users 
            SET user_name = ?,
                email = ?,
                role_id = ?,
                department_name = ?,
                employee_code = ?,
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [finalUserName, finalEmail, finalRoleId, finalDeptName, finalEmployeeCode, finalIsActive, id]);

        res.json({ message: 'ユーザー情報を更新しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

// ユーザー削除 (論理削除)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const db = await getDB();

        // 存在チェック
        const user = await db.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'ユーザーが見つかりません。' } });
        }

        // 自分自身は削除できないようにする
        if (req.user?.id === Number(id)) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '自分自身を削除することはできません。' } });
        }

        await db.run(`
            UPDATE users 
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [id]);

        res.json({ message: 'ユーザーを削除（無効化）しました。' });
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
