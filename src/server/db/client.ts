import dns from 'dns';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Force Node.js to prioritize IPv4 DNS lookups to avoid ENOTFOUND on systems without IPv6 routing
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if already set or unsupported in older runtimes
}

const rawConnectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_L9dmsv7kUrOA@ep-misty-frog-b4f6ctwl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Clean libpq-specific parameters not needed by node-postgres
const connectionString = rawConnectionString.replace('&channel_binding=require', '').replace('channel_binding=require&', '');

// Global cached pool for Next.js hot reload in development
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 5000, // Reclaim idle clients after 5s before Neon PgBouncer terminates them
    connectionTimeoutMillis: 30000, // 30s gives Neon serverless compute ample time to wake up from cold start
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
  });

pool.on('error', (err) => {
  // Catch background idle timeouts so they don't crash the process
  console.warn('[DB Pool] Idle client event:', err.message);
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
export type DB = typeof db;
