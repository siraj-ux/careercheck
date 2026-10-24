import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client';
import path from 'path';

export function runMigrations() {
  console.log('Running database migrations...');
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle/migrations');
  
  migrate(db, { migrationsFolder });
  console.log('Database migrations completed successfully.');
}

if (require.main === module || process.argv[1]?.includes('migrate.ts')) {
  try {
    runMigrations();
    sqlite.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    sqlite.close();
    process.exit(1);
  }
}
