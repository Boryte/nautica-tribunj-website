# SQLite Backup and Restore

## Backup

Recommended:

1. Stop write-heavy admin activity if possible.
2. Copy all of:
   - `db/nautica.sqlite`
   - `db/nautica.sqlite-wal` if present
   - `db/nautica.sqlite-shm` if present
3. Store backups off-host and encrypt them at rest.

For scheduled backups, snapshot the entire database directory rather than only the main `.sqlite` file.

## Restore

1. Stop the API.
2. Replace the database files with the backup set.
3. Start the API.
4. Run smoke checks:
   - `GET /health`
   - admin login
   - public events listing
   - reservation creation in a test environment if possible

## Retention

- keep daily backups for at least 14 days
- keep weekly backups for at least 8 weeks
- test restore regularly in a staging environment

