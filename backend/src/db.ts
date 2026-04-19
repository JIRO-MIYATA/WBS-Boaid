import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const getDB = async (): Promise<Database> => {
    if (db) return db;
    
    db = await open({
        filename: path.resolve(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
    });

    // SQLiteの外部キー制約を有効化（デフォルトでは無効）
    await db.run('PRAGMA foreign_keys = ON');
    
    return db;
};

