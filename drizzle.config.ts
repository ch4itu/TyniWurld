import { defineConfig } from 'drizzle-kit';

const url = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: 'netlify/database/migrations',
  ...(url ? { dbCredentials: { url } } : {}),
});
