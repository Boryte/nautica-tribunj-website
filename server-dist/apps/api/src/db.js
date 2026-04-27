"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInTransaction = exports.db = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const config_1 = require("./config");
const ensureDirectory = (filePath) => {
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(filePath), { recursive: true });
};
const SQLITE_RECOVERY_PATTERNS = [
    'SQLITE_CORRUPT',
    'database disk image is malformed',
    'malformed',
    'not a database',
    'file is not a database',
];
const isRecoverableSqliteError = (error) => {
    const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    return SQLITE_RECOVERY_PATTERNS.some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()));
};
const getSidecarPaths = (databasePath) => [databasePath, `${databasePath}-wal`, `${databasePath}-shm`];
const backupCorruptDatabaseFiles = (databasePath) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    for (const sourcePath of getSidecarPaths(databasePath)) {
        if (!node_fs_1.default.existsSync(sourcePath))
            continue;
        const backupPath = `${sourcePath}.corrupt-${stamp}`;
        node_fs_1.default.renameSync(sourcePath, backupPath);
    }
};
const applyDatabasePragmas = (database) => {
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');
    database.pragma('busy_timeout = 5000');
    database.pragma('synchronous = NORMAL');
    database.prepare('SELECT 1').get();
};
const openDatabase = (databasePath) => {
    ensureDirectory(databasePath);
    let database = new better_sqlite3_1.default(databasePath);
    try {
        applyDatabasePragmas(database);
        return database;
    }
    catch (error) {
        try {
            database.close();
        }
        catch {
            // ignore close failures during recovery
        }
        if (!isRecoverableSqliteError(error)) {
            throw error;
        }
        backupCorruptDatabaseFiles(databasePath);
        database = new better_sqlite3_1.default(databasePath);
        applyDatabasePragmas(database);
        return database;
    }
};
exports.db = openDatabase(config_1.env.DATABASE_PATH);
const runInTransaction = (fn) => exports.db.transaction(fn)();
exports.runInTransaction = runInTransaction;
