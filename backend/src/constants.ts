/**
 * アプリケーション全体で使用する共通定数
 * セキュリティに関わる値は環境変数から取得し、フォールバックは開発環境専用とする
 */

// JWT秘密鍵 - 本番環境では必ず環境変数で設定すること
export const JWT_SECRET = process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET 環境変数が未設定です。本番環境では必ず設定してください。');
    }
    console.warn('[WARNING] JWT_SECRET が未設定のため開発用デフォルト値を使用しています。');
    return 'dev_only_secret_key_do_not_use_in_production';
})();

// 初期パスワード - ユーザー新規作成・リセット時に使用
export const INITIAL_PASSWORD = process.env.INITIAL_PASSWORD || 'elpa1234';

// bcrypt のソルトラウンド数
export const BCRYPT_SALT_ROUNDS = 10;

// トークン有効期限
export const JWT_EXPIRATION = '24h';
