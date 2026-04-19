import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '../database.sqlite');

async function initDB() {
    // 古いDBファイルがあれば削除（初期化用）
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log('Creating tables...');

    await db.exec(`
        -- 1. roles
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_code TEXT NOT NULL UNIQUE,
            role_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. users
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_id INTEGER NOT NULL,
            employee_code TEXT UNIQUE,
            user_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            department_name TEXT,
            password_hash TEXT NOT NULL,
            first_login_required INTEGER NOT NULL DEFAULT 1,
            is_active INTEGER NOT NULL DEFAULT 1,
            last_login_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        );

        -- 3. annual_goals
        CREATE TABLE IF NOT EXISTS annual_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fiscal_year INTEGER NOT NULL,
            goal_code TEXT NOT NULL UNIQUE,
            goal_title TEXT NOT NULL,
            goal_description TEXT,
            start_date DATE,
            end_date DATE,
            owner_user_id INTEGER,
            status TEXT NOT NULL, -- draft, active, closed
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_user_id) REFERENCES users(id)
        );

        -- 4. goal_assignments
        CREATE TABLE IF NOT EXISTS goal_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            annual_goal_id INTEGER NOT NULL,
            assigned_user_id INTEGER NOT NULL,
            assignment_title TEXT NOT NULL,
            assignment_description TEXT,
            priority TEXT, -- low, medium, high
            due_date DATE,
            status TEXT NOT NULL, -- active, completed, on_hold
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (annual_goal_id) REFERENCES annual_goals(id),
            FOREIGN KEY (assigned_user_id) REFERENCES users(id)
        );

        -- 5. monthly_goal_progress
        CREATE TABLE IF NOT EXISTS monthly_goal_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_assignment_id INTEGER NOT NULL,
            target_year INTEGER NOT NULL,
            target_month INTEGER NOT NULL,
            progress_percent REAL NOT NULL,
            progress_comment TEXT,
            delay_reason TEXT,
            next_month_plan TEXT,
            submitted_by INTEGER NOT NULL,
            submitted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(goal_assignment_id, target_year, target_month),
            FOREIGN KEY (goal_assignment_id) REFERENCES goal_assignments(id),
            FOREIGN KEY (submitted_by) REFERENCES users(id)
        );

        -- 6. daily_tasks (Routine Master)
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assigned_user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            task_detail TEXT,
            estimated_time_minutes INTEGER DEFAULT 0,
            task_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_user_id) REFERENCES users(id)
        );

        -- 7. daily_task_histories (Daily Execution Records)
        CREATE TABLE IF NOT EXISTS daily_task_histories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            daily_task_id INTEGER NOT NULL,
            target_date DATE NOT NULL,
            status TEXT NOT NULL, -- todo, done, pending
            completion_comment TEXT,
            actual_time_minutes INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(daily_task_id, target_date),
            FOREIGN KEY (daily_task_id) REFERENCES daily_tasks(id)
        );


        -- 8. password_reset_logs
        CREATE TABLE IF NOT EXISTS password_reset_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            reset_type TEXT NOT NULL, -- initial, admin_reset, self_change
            reset_by INTEGER,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (reset_by) REFERENCES users(id)
        );

        -- 9. notifications
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            notification_type TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT,
            is_read INTEGER NOT NULL DEFAULT 0,
            sent_at DATETIME,
            read_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- 10. developments
        CREATE TABLE IF NOT EXISTS developments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            development_code TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL, -- active, completed, on_hold
            owner_user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_user_id) REFERENCES users(id)
        );

        -- 11. development_tasks
        CREATE TABLE IF NOT EXISTS development_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            development_id INTEGER NOT NULL,
            assigned_user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT,
            due_date DATE,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (development_id) REFERENCES developments(id),
            FOREIGN KEY (assigned_user_id) REFERENCES users(id)
        );

        -- 12. development_progress
        CREATE TABLE IF NOT EXISTS development_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            development_task_id INTEGER NOT NULL,
            target_year INTEGER NOT NULL,
            target_month INTEGER NOT NULL,
            progress_percent REAL NOT NULL,
            progress_comment TEXT,
            delay_reason TEXT,
            next_month_plan TEXT,
            submitted_by INTEGER NOT NULL,
            submitted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(development_task_id, target_year, target_month),
            FOREIGN KEY (development_task_id) REFERENCES development_tasks(id),
            FOREIGN KEY (submitted_by) REFERENCES users(id)
        );

        -- 13. faqs
        CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            question_detail TEXT NOT NULL,
            answer_detail TEXT,
            status TEXT NOT NULL, -- new, in_progress, completed
            progress_percent REAL DEFAULT 0,
            assignee_user_id INTEGER,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignee_user_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
    `);

    console.log('Inserting seed data...');

    // ロール登録
    await db.run(`INSERT INTO roles (role_code, role_name) VALUES ('admin', '管理者')`);
    await db.run(`INSERT INTO roles (role_code, role_name) VALUES ('member', '一般部員')`);

    // ロールID取得
    const adminRole = await db.get(`SELECT id FROM roles WHERE role_code = 'admin'`);
    const memberRole = await db.get(`SELECT id FROM roles WHERE role_code = 'member'`);

    // パスワードハッシュ化 ('elpa1234')
    const initialPasswordHash = await bcrypt.hash('elpa1234', 10);

    // 管理者ユーザー登録
    await db.run(`
        INSERT INTO users (role_id, employee_code, user_name, email, department_name, password_hash, first_login_required)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [adminRole.id, 'A0001', 'システム管理者', 'admin@example.com', '情報システム部', initialPasswordHash]);

    // 一般部員ユーザー登録
    await db.run(`
        INSERT INTO users (role_id, employee_code, user_name, email, department_name, password_hash, first_login_required)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [memberRole.id, 'M0001', '山田 太郎', 'yamada@example.com', '情報システム部', initialPasswordHash]);

    await db.run(`
        INSERT INTO users (role_id, employee_code, user_name, email, department_name, password_hash, first_login_required)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [memberRole.id, 'M0002', '佐藤 花子', 'sato@example.com', '情報システム部', initialPasswordHash]);

    // 年間目標サンプル登録
    await db.run(`
        INSERT INTO annual_goals (fiscal_year, goal_code, goal_title, goal_description, owner_user_id, status)
        VALUES (2025, 'G2025-01', '部門DXの推進', '全部署の主要業務プロセスをデジタル化し、効率化を図る。', ?, 'active')
    `, [adminRole.id]);

    const goalId = (await db.get('SELECT id FROM annual_goals WHERE goal_code = ?', ['G2025-01'])).id;

    // 担当者割当サンプル
    await db.run(`
        INSERT INTO goal_assignments (annual_goal_id, assigned_user_id, assignment_title, assignment_description, priority, due_date, status)
        VALUES (?, ?, '電子契約システムの導入', '全社的な電子契約システムの選定および導入完了。', 'high', '2025-09-30', 'active')
    `, [goalId, (await db.get('SELECT id FROM users WHERE email = ?', ['yamada@example.com'])).id]);

    await db.run(`
        INSERT INTO goal_assignments (annual_goal_id, assigned_user_id, assignment_title, assignment_description, priority, due_date, status)
        VALUES (?, ?, '社内ポータルの刷新', 'Next.jsを用いたモダンな社内ポータルの構築。', 'medium', '2025-12-31', 'active')
    `, [goalId, (await db.get('SELECT id FROM users WHERE email = ?', ['sato@example.com'])).id]);

    // ルーチン業務サンプル登録
    const adminUser = await db.get('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
    await db.run(`
        INSERT INTO daily_tasks (assigned_user_id, title, task_detail, estimated_time_minutes, task_order)
        VALUES (?, '朝会・メールチェック', '当日のスケジュール確認と優先度の高いメールへの返信', 30, 1)
    `, [adminUser.id]);
    await db.run(`
        INSERT INTO daily_tasks (assigned_user_id, title, task_detail, estimated_time_minutes, task_order)
        VALUES (?, '日次レポート作成', '進捗管理システムへの入力と上長への報告', 15, 100)
    `, [adminUser.id]);


    console.log('Database initialization completed successfully!');


    await db.close();
}

initDB().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
