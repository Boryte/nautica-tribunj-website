"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = void 0;
const db_1 = require("../db");
const time_1 = require("../utils/time");
const writeAuditLog = (input) => {
    db_1.db.prepare(`INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details_json, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run(input.adminId ?? null, input.action, input.entityType, input.entityId ?? null, input.details ? JSON.stringify(input.details) : null, input.requestId ?? null, (0, time_1.nowIso)());
};
exports.writeAuditLog = writeAuditLog;
