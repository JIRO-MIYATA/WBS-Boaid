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
    try {
        await db.exec(`ALTER TABLE faqs ADD COLUMN progress_percent REAL DEFAULT 0`);
        console.log('Successfully added progress_percent column.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('Column already exists.');
        } else {
            console.error('Migration error:', e);
        }
    }

    await db.close();
}

migrate().catch(console.error);
