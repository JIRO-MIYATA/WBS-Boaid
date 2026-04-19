const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function migrate() {
    const dbPath = path.resolve(__dirname, '../database.sqlite');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log('Running migration...');

    await db.exec(`
        -- developments
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

        -- development_tasks
        CREATE TABLE IF NOT EXISTS development_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            development_id INTEGER NOT NULL,
            assigned_user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT, -- low, medium, high
            due_date DATE,
            status TEXT NOT NULL, -- active, completed, on_hold
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (development_id) REFERENCES developments(id),
            FOREIGN KEY (assigned_user_id) REFERENCES users(id)
        );

        -- development_progress
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

        -- faqs
        CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            question_detail TEXT NOT NULL,
            answer_detail TEXT,
            status TEXT NOT NULL, -- new, in_progress, completed
            assignee_user_id INTEGER,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignee_user_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
    `);

    console.log('Migration completed.');
    await db.close();
}

migrate().catch(console.error);
