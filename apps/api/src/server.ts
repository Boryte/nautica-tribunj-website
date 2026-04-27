import { createApp } from './app';
import { env } from './config';
import { logger } from './logger';
import { runMigrations } from './migrate';
import { seedDatabase } from './seed';

runMigrations();
seedDatabase();

createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'nautica_api_started');
});
