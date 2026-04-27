import { env } from '../config';
import { db } from '../db';
import { logger } from '../logger';
import { nowIso } from '../utils/time';

export const notify = async (input: {
  channel: string;
  eventType: string;
  target: string;
  payload: Record<string, unknown>;
  requestId?: string;
}) => {
  try {
    logger.info({ provider: env.NOTIFICATION_PROVIDER, channel: input.channel, target: input.target }, 'notification_dispatched');
    db.prepare(
      `INSERT INTO notification_logs (channel, event_type, target, status, provider, payload_json, response_json, request_id, created_at)
       VALUES (?, ?, ?, 'sent', ?, ?, ?, ?, ?)`
    ).run(input.channel, input.eventType, input.target, env.NOTIFICATION_PROVIDER, JSON.stringify(input.payload), JSON.stringify({ accepted: true }), input.requestId ?? null, nowIso());
  } catch (error) {
    logger.error({ err: error }, 'notification_failed');
    db.prepare(
      `INSERT INTO notification_logs (channel, event_type, target, status, provider, payload_json, error_message, request_id, created_at)
       VALUES (?, ?, ?, 'failed', ?, ?, ?, ?, ?)`
    ).run(
      input.channel,
      input.eventType,
      input.target,
      env.NOTIFICATION_PROVIDER,
      JSON.stringify(input.payload),
      error instanceof Error ? error.message : 'Unknown error',
      input.requestId ?? null,
      nowIso()
    );
  }
};
