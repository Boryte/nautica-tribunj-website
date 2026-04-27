"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const db_1 = require("./db");
const migrationsDir = node_path_1.default.resolve(process.cwd(), 'db', 'migrations');
const runMigrations = () => {
    db_1.db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
    const files = node_fs_1.default.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
        const exists = db_1.db.prepare('SELECT 1 FROM migrations WHERE name = ?').get(file);
        if (exists)
            continue;
        db_1.db.exec(node_fs_1.default.readFileSync(node_path_1.default.join(migrationsDir, file), 'utf8'));
        db_1.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
    }
};
exports.runMigrations = runMigrations;
