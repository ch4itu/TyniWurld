#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';

const url = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;

if (!url) {
  console.log('→ Skipping database migrations (NETLIFY_DB_URL/DATABASE_URL not set)');
  process.exit(0);
}

const sql = neon(url);

console.log('→ Applying database migrations');

await sql`
  CREATE TABLE IF NOT EXISTS profiles (
    id serial PRIMARY KEY,
    auth0_id text NOT NULL UNIQUE,
    username text NOT NULL,
    about text DEFAULT '',
    image text DEFAULT '',
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )
`;

await sql`
  ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text DEFAULT ''
`;

await sql`
  CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON profiles (username)
`;

await sql`
  CREATE TABLE IF NOT EXISTS builds (
    id serial PRIMARY KEY,
    profile_id integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )
`;

console.log('✓ Database migrations applied');
