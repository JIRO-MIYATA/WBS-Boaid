import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';
import { JWT_SECRET, JWT_EXPIRATION, BCRYPT_SALT_ROUNDS } from '../constants';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'メールアドレスとパスワードを入力してください。' } });
        }

        const db = await getDB();
        const user = await db.get(`
            SELECT u.*, r.role_code 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ? AND u.is_active = 1
        `, [email]);

        if (!user) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'メールアドレスまたはパスワードが間違っています。' } });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'メールアドレスまたはパスワードが間違っています。' } });
        }

        // 最終ログイン日時更新
        await db.run(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

        const tokenPayload = {
            id: user.id,
            role_code: user.role_code,
            first_login_required: user.first_login_required === 1
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                user_name: user.user_name,
                role_code: user.role_code,
                first_login_required: user.first_login_required === 1
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

router.post('/change-password', authenticate, async (req: Request, res: Response) => {
    try {
        const { current_password, new_password, new_password_confirmation } = req.body;
        const userId = req.user?.id;

        if (!current_password || !new_password || !new_password_confirmation) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '全ての項目を入力してください。' } });
        }

        if (new_password !== new_password_confirmation) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '新しいパスワードが確認用と一致しません。' } });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'パスワードは8文字以上で入力してください。' } });
        }

        const db = await getDB();
        const user = await db.get(`SELECT password_hash FROM users WHERE id = ?`, [userId]);

        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'ユーザーが見つかりません。' } });
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '現在のパスワードが間違っています。' } });
        }

        const newHash = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);

        // パスワード更新と初回フラグの解除
        await db.run(`
            UPDATE users 
            SET password_hash = ?, first_login_required = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [newHash, userId]);

        // ログ記録
        await db.run(`
            INSERT INTO password_reset_logs (user_id, reset_type, reset_by)
            VALUES (?, 'self_change', ?)
        `, [userId, userId]);

        res.json({ message: 'パスワードを変更しました。' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const db = await getDB();
        const user = await db.get(`
            SELECT u.id, u.email, u.user_name, u.department_name, u.first_login_required, u.is_active, r.role_code, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `, [req.user?.id]);

        if (!user) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'ユーザーが見つかりません。' } });
        }

        res.json({
            id: user.id,
            email: user.email,
            user_name: user.user_name,
            department_name: user.department_name,
            role_code: user.role_code,
            role_name: user.role_name,
            first_login_required: user.first_login_required === 1,
            is_active: user.is_active === 1
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました。' } });
    }
});

router.post('/logout', authenticate, (req: Request, res: Response) => {
    // クライアント側でトークンを破棄する想定
    res.json({ message: 'ログアウトしました。' });
});

export default router;
