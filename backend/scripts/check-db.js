const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function check() {
    const db = await open({
        filename: path.resolve(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
    });

    const users = await db.all("SELECT id, user_name, email FROM users");
    console.log("USERS:", users);

    const faqs = await db.all("SELECT id, title, assignee_user_id, created_by FROM faqs");
    console.log("FAQS:", faqs);

    await db.close();
}

check().catch(console.error);
