"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = void 0;
const config_1 = require("../config");
const db_1 = require("../db");
const logger_1 = require("../logger");
const time_1 = require("../utils/time");
const notify = async (input) => {
    try {
        logger_1.logger.info({ provider: config_1.env.NOTIFICATION_PROVIDER, channel: input.channel, target: input.target }, 'notification_dispatched');
        db_1.db.prepare(`INSERT INTO notification_logs (channel, event_type, target, status, provider, payload_json, response_json, request_id, created_at)
       VALUES (?, ?, ?, 'sent', ?, ?, ?, ?, ?)`).run(input.channel, input.eventType, input.target, config_1.env.NOTIFICATION_PROVIDER, JSON.stringify(input.payload), JSON.stringify({ accepted: true }), input.requestId ?? null, (0, time_1.nowIso)());
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'notification_failed');
        db_1.db.prepare(`INSERT INTO notification_logs (channel, event_type, target, status, provider, payload_json, error_message, request_id, created_at)
       VALUES (?, ?, ?, 'failed', ?, ?, ?, ?, ?)`).run(input.channel, input.eventType, input.target, config_1.env.NOTIFICATION_PROVIDER, JSON.stringify(input.payload), error instanceof Error ? error.message : 'Unknown error', input.requestId ?? null, (0, time_1.nowIso)());
    }
};
exports.notify = notify;
