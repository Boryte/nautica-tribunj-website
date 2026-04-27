import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from './config';

const ensureDirectory = (filePath: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const SQLITE_RECOVERY_PATTERNS = [
  'SQLITE_CORRUPT',
  'database disk image is malformed',
  'malformed',
  'not a database',
  'file is not a database',
];

const isRecoverableSqliteError = (error: unknown) => {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return SQLITE_RECOVERY_PATTERNS.some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()));
};

const getSidecarPaths = (databasePath: string) => [databasePath, `${databasePath}-wal`, `${databasePath}-shm`];

const backupCorruptDatabaseFiles = (databasePath: string) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const sourcePath of getSidecarPaths(databasePath)) {
    if (!fs.existsSync(sourcePath)) continue;

    const backupPath = `${sourcePath}.corrupt-${stamp}`;
    fs.renameSync(sourcePath, backupPath);
  }
};

const applyDatabasePragmas = (database: Database.Database) => {
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');
  database.pragma('synchronous = NORMAL');
  database.prepare('SELECT 1').get();
};

const openDatabase = (databasePath: string) => {
  ensureDirectory(databasePath);

  let database = new Database(databasePath);

  try {
    applyDatabasePragmas(database);
    return database;
  } catch (error) {
    try {
      database.close();
    } catch {
      // ignore close failures during recovery
    }

    if (!isRecoverableSqliteError(error)) {
      throw error;
    }

    backupCorruptDatabaseFiles(databasePath);
    database = new Database(databasePath);
    applyDatabasePragmas(database);
    return database;
  }
};

export const db = openDatabase(env.DATABASE_PATH);

export const runInTransaction = <T>(fn: () => T) => db.transaction(fn)();
