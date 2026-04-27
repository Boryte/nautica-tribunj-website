import fs from 'node:fs';
import path from 'node:path';
import { db } from './db';

const migrationsDir = path.resolve(process.cwd(), 'db', 'migrations');

export const runMigrations = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const exists = db.prepare('SELECT 1 FROM migrations WHERE name = ?').get(file);
    if (exists) continue;

    db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
  }
};
