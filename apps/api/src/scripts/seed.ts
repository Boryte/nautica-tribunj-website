import { runMigrations } from '../migrate';
import { seedDatabase } from '../seed';

runMigrations();
seedDatabase();
