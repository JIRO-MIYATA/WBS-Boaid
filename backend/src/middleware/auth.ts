import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../constants';

export interface AuthUser {
    id: number;
    role_code: string;
    first_login_required: boolean;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '認証トークンがありません。' } });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;

        // 初回パスワード変更が必須の場合、一部のAPIしか許可しない制御
        if (req.user.first_login_required) {
            // パスワード変更とログアウト、自分の情報取得のみ許可
            const allowedPaths = ['/api/v1/auth/change-password', '/api/v1/auth/logout', '/api/v1/auth/me'];
            if (!allowedPaths.includes(req.baseUrl + req.path) && !allowedPaths.includes(req.path)) {
                return res.status(403).json({ error: { code: 'FORBIDDEN', message: '初回パスワード変更が必要です。' } });
            }
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '無効なトークンです。' } });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role_code !== 'admin') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: '管理者権限が必要です。' } });
    }
    next();
};
