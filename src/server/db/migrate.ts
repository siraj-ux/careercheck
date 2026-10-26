import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  console.log('Running PostgreSQL database migrations...');
  const rawUrl =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_L9dmsv7kUrOA@ep-misty-frog-b4f6ctwl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  // For DDL statements, use direct host (strip -pooler)
  const directUrl = rawUrl.replace('-pooler', '');

  const pool = new Pool({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);

    // Check if initial tables already exist
    const initialCheck = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';"
    );
    if (initialCheck.rows.length > 0) {
      await client.query(
        'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        ['0000_brave_winter_soldier.sql', Date.now()]
      );
    }

    const migrationsFolder = path.resolve(process.cwd(), 'drizzle/migrations-pg');
    const sqlFiles = fs
      .readdirSync(migrationsFolder)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(migrationsFolder, sqlFile);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Check if migration was already applied
      const existing = await client.query(
        'SELECT id FROM "__drizzle_migrations" WHERE hash = $1',
        [sqlFile]
      );

      if (existing.rows.length > 0) {
        console.log(`Migration ${sqlFile} already applied, skipping.`);
        continue;
      }

      console.log(`Applying migration: ${sqlFile}...`);
      const statements = sqlContent
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);

      await client.query('BEGIN');
      for (const statement of statements) {
        await client.query(statement);
      }
      await client.query(
        'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [sqlFile, Date.now()]
      );
      await client.query('COMMIT');
      console.log(`Migration ${sqlFile} applied successfully.`);
    }

    console.log('All migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module || process.argv[1]?.includes('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('Migration process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration process failed:', err);
      process.exit(1);
    });
}
