"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const logger_1 = require("./logger");
const migrate_1 = require("./migrate");
const seed_1 = require("./seed");
(0, migrate_1.runMigrations)();
(0, seed_1.seedDatabase)();
(0, app_1.createApp)().listen(config_1.env.PORT, () => {
    logger_1.logger.info({ port: config_1.env.PORT }, 'nautica_api_started');
});
