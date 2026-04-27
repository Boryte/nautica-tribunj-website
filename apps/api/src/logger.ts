import pino from 'pino';
import { env } from './config';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: {
    service: 'nautica-api',
    env: env.NODE_ENV,
  },
});
