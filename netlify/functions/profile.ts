import type { Config } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { getAuthUserId, unauthorized, corsHeaders, corsResponse } from './auth.js';

const connectionString = process.env.NETLIFY_DB_URL;
const sql = connectionString ? neon(connectionString) : null;

type ProfileInput = {
  username: string;
  displayName: string;
  about: string;
  image: string;
};

function normalizeProfile(row: any, fallbackDisplayName?: string) {
  if (!row) return null;
  return {
    id: row.id,
    auth0Id: row.auth0Id ?? row.auth0_id,
    username: row.username,
    displayName: row.displayName ?? row.display_name ?? fallbackDisplayName ?? row.username,
    about: row.about ?? '',
    image: row.image ?? '',
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

function isMissingDisplayNameColumn(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('display_name') || message.includes('column') && message.includes('does not exist');
}

async function getProfileByAuthId(auth0Id: string) {
  if (!sql) throw new Error('NETLIFY_DB_URL is not configured');
  try {
    const rows = await sql`
      SELECT id, auth0_id AS "auth0Id", username, display_name AS "displayName", about, image, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM profiles
      WHERE auth0_id = ${auth0Id}
      LIMIT 1
    `;
    return normalizeProfile(rows[0]);
  } catch (err) {
    if (!isMissingDisplayNameColumn(err)) throw err;
    const rows = await sql`
      SELECT id, auth0_id AS "auth0Id", username, about, image, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM profiles
      WHERE auth0_id = ${auth0Id}
      LIMIT 1
    `;
    return normalizeProfile(rows[0]);
  }
}

async function usernameTaken(username: string, auth0Id: string) {
  if (!sql) throw new Error('NETLIFY_DB_URL is not configured');
  const rows = await sql`
    SELECT id
    FROM profiles
    WHERE username = ${username} AND auth0_id <> ${auth0Id}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function saveProfile(auth0Id: string, existing: any, values: ProfileInput) {
  if (!sql) throw new Error('NETLIFY_DB_URL is not configured');
  try {
    const rows = existing
      ? await sql`
          UPDATE profiles
          SET username = ${values.username}, display_name = ${values.displayName}, about = ${values.about}, image = ${values.image}, updated_at = NOW()
          WHERE auth0_id = ${auth0Id}
          RETURNING id, auth0_id AS "auth0Id", username, display_name AS "displayName", about, image, created_at AS "createdAt", updated_at AS "updatedAt"
        `
      : await sql`
          INSERT INTO profiles (auth0_id, username, display_name, about, image)
          VALUES (${auth0Id}, ${values.username}, ${values.displayName}, ${values.about}, ${values.image})
          RETURNING id, auth0_id AS "auth0Id", username, display_name AS "displayName", about, image, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
    return normalizeProfile(rows[0]);
  } catch (err) {
    if (!isMissingDisplayNameColumn(err)) throw err;
    const rows = existing
      ? await sql`
          UPDATE profiles
          SET username = ${values.username}, about = ${values.about}, image = ${values.image}, updated_at = NOW()
          WHERE auth0_id = ${auth0Id}
          RETURNING id, auth0_id AS "auth0Id", username, about, image, created_at AS "createdAt", updated_at AS "updatedAt"
        `
      : await sql`
          INSERT INTO profiles (auth0_id, username, about, image)
          VALUES (${auth0Id}, ${values.username}, ${values.about}, ${values.image})
          RETURNING id, auth0_id AS "auth0Id", username, about, image, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
    return normalizeProfile(rows[0], values.displayName);
  }
}

export default async (req: Request) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    if (req.method === 'OPTIONS') return corsResponse(origin);

    const auth0Id = await getAuthUserId();
    if (!auth0Id) return unauthorized();

    if (req.method === 'GET') {
      const profile = await getProfileByAuthId(auth0Id);
      return Response.json(profile, { headers });
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const username = String(body.username || '').trim().toLowerCase();
      const displayName = String(body.displayName || '').trim();
      const about = String(body.about || '').trim();
      const image = String(body.image || '').trim();

      if (!username) return Response.json({ error: 'username is required' }, { status: 400, headers });
      if (!/^[a-z0-9_]{3,24}$/.test(username)) {
        return Response.json({ error: 'username must be 3-24 chars: lowercase letters, numbers, underscores' }, { status: 400, headers });
      }
      if (!displayName) return Response.json({ error: 'display name is required' }, { status: 400, headers });
      if (image && image.length > 750_000) {
        return Response.json({ error: 'photo is too large; choose a smaller image' }, { status: 400, headers });
      }

      const existing = await getProfileByAuthId(auth0Id);
      if (await usernameTaken(username, auth0Id)) {
        return Response.json({ error: 'username is already taken' }, { status: 409, headers });
      }

      const saved = await saveProfile(auth0Id, existing, { username, displayName, about, image });
      return Response.json(saved, { status: existing ? 200 : 201, headers });
    }

    return new Response('Method not allowed', { status: 405, headers });
  } catch (err) {
    console.error('profile function failed:', err);
    const message = err instanceof Error ? err.message : 'Profile save failed';
    return Response.json({ error: message }, { status: 500, headers });
  }
};

export const config: Config = {
  path: '/api/profile',
};
