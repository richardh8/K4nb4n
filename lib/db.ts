import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase } from './seed';

let db: ReturnType<typeof Database> | null = null;

if (typeof window === 'undefined') {
  // We are on the server
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(path.join(dataDir, 'k4nb4n.db'), { timeout: 8000 });

  // Enable Write-Ahead Logging for better concurrency
  db.pragma('journal_mode = WAL');
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize Schema
  const initDb = () => {
    db!.exec(`
      CREATE TABLE IF NOT EXISTS boards (
        hash TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_by_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS board_members (
        board_hash TEXT,
        user_id TEXT,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
        PRIMARY KEY (board_hash, user_id),
        FOREIGN KEY(board_hash) REFERENCES boards(hash) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        task_num INTEGER,
        board_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        assignee_id TEXT,
        created_by_id TEXT,
        start_date TEXT,
        end_date TEXT,
        tags TEXT,
        links TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(board_hash) REFERENCES boards(hash) ON DELETE CASCADE,
        FOREIGN KEY(assignee_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY(created_by_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS task_todos (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

        CREATE TABLE IF NOT EXISTS task_comments (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          parent_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY(parent_id) REFERENCES task_comments(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS board_history (
          id TEXT PRIMARY KEY,
          board_hash TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          event_name TEXT NOT NULL,
          details TEXT, -- JSON diffs
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(board_hash) REFERENCES boards(hash) ON DELETE CASCADE,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);
    try {
      db!.exec(`ALTER TABLE boards ADD COLUMN description TEXT DEFAULT '';`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE boards ADD COLUMN created_by_id TEXT;`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE tasks ADD COLUMN task_num INTEGER;`);
      // Update existing tasks with a sequence
      const tasks = db!.prepare('SELECT id FROM tasks WHERE task_num IS NULL ORDER BY ROWID ASC').all();
      const lastNum = db!.prepare('SELECT COALESCE(MAX(task_num), 0) as last FROM tasks').get() as { last: number };
      const updateStmt = db!.prepare('UPDATE tasks SET task_num = ? WHERE id = ?');
      tasks.forEach((t: any, i: number) => {
        updateStmt.run(lastNum.last + i + 1, t.id);
      });
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE tasks ADD COLUMN created_by_id TEXT;`);
    } catch (e) {}
  };

  // Skip initialization during production builds to avoid SQLITE_BUSY 
  // when Next.js tries to pre-render or collect metadata from dynamic routes.
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

  if (!isBuild) {
    try {
      initDb();
      seedDatabase(db);
    } catch (err) {
      console.error('Database initialization warning:', err);
    }
  }
}

export default db;
