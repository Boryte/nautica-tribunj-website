"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migrate_1 = require("../migrate");
const seed_1 = require("../seed");
(0, migrate_1.runMigrations)();
(0, seed_1.seedDatabase)();
