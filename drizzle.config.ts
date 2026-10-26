import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './drizzle/migrations-pg',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_L9dmsv7kUrOA@ep-misty-frog-b4f6ctwl.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});
