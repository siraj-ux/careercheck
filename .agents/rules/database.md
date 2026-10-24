---
trigger: always_on
---

# Database rules
- SQLite with better-sqlite3 and Drizzle. On every connection run:
  PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;
- Use portable SQL only, so a later move to Postgres stays possible.
- IDs are text (UUID or ULID). Timestamps are ISO text or integer epoch.
- Enums are text with CHECK constraints. Booleans are 0/1.
- JSON is stored as text, validated with Zod, never queried with JSON functions.
- The database file path comes from an env variable and lives on a persistent
  volume, never inside the build output.
- Keep write transactions short. All schema changes go through migration files,
  never manual edits.
- Add indexes for foreign keys and for lookups used by dashboards.