/**
 * 管理者パスワードをelpa1234にリセットするスクリプト
 * バックエンド起動中でも実行可能
 */
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';

async function resetPassword() {
    const db = await open({
        filename: path.resolve(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
    });

    const newHash = await bcrypt.hash('elpa1234', 10);

    // 全ユーザーのパスワードを初期化し、初回ログインフラグを立てる
    await db.run(
        `UPDATE users SET password_hash = ?, first_login_required = 1`,
        [newHash]
    );

    const users = await db.all('SELECT id, email, first_login_required FROM users');
    console.log('パスワードを elpa1234 にリセットしました:');
    users.forEach((u: any) => console.log(`  - ${u.email} (first_login_required: ${u.first_login_required})`));

    await db.close();
}

resetPassword().catch(err => {
    console.error('Failed:', err);
    process.exit(1);
});
