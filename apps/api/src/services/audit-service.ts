import { db } from '../db';
import { nowIso } from '../utils/time';

export const writeAuditLog = (input: {
  adminId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  requestId?: string | null;
}) => {
  db.prepare(
    `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details_json, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.adminId ?? null,
    input.action,
    input.entityType,
    input.entityId ?? null,
    input.details ? JSON.stringify(input.details) : null,
    input.requestId ?? null,
    nowIso()
  );
};
