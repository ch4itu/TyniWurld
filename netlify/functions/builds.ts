import type { Config } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { getAuthUserId, unauthorized, corsHeaders, corsResponse } from './auth.js';

const connectionString = process.env.NETLIFY_DB_URL;
const sql = connectionString ? neon(connectionString) : null;

function requireSql() {
  if (!sql) throw new Error('NETLIFY_DB_URL is not configured');
  return sql;
}

function normalizeBuild(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    profileId: row.profileId ?? row.profile_id,
    name: row.name,
    data: row.data,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

async function getProfileId(auth0Id: string): Promise<number | null> {
  const db = requireSql();
  const rows = await db`
    SELECT id
    FROM profiles
    WHERE auth0_id = ${auth0Id}
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export default async (req: Request) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    if (req.method === 'OPTIONS') return corsResponse(origin);

    const auth0Id = await getAuthUserId();
    if (!auth0Id) return unauthorized();

    const db = requireSql();
    const url = new URL(req.url);
    const buildIdRaw = url.searchParams.get('id');
    const buildId = buildIdRaw ? parseInt(buildIdRaw, 10) : null;
    const profileId = await getProfileId(auth0Id);

    if (req.method === 'GET') {
      if (!profileId) return Response.json([], { headers });

      if (buildId) {
        const rows = await db`
          SELECT id, profile_id AS "profileId", name, data, created_at AS "createdAt", updated_at AS "updatedAt"
          FROM builds
          WHERE id = ${buildId} AND profile_id = ${profileId}
          LIMIT 1
        `;
        const build = normalizeBuild(rows[0]);
        if (!build) return Response.json({ error: 'Not found' }, { status: 404, headers });
        return Response.json(build, { headers });
      }

      const rows = await db`
        SELECT id, profile_id AS "profileId", name, data, created_at AS "createdAt", updated_at AS "updatedAt"
        FROM builds
        WHERE profile_id = ${profileId}
        ORDER BY updated_at DESC
      `;
      return Response.json(rows.map(normalizeBuild), { headers });
    }

    if (req.method === 'POST') {
      if (!profileId) {
        return Response.json({ error: 'Profile required before saving builds' }, { status: 400, headers });
      }
      const body = await req.json();
      const name = String(body.name || '').trim();
      const data = body.data;
      if (!name || !data) {
        return Response.json({ error: 'name and data are required' }, { status: 400, headers });
      }
      const rows = await db`
        INSERT INTO builds (profile_id, name, data)
        VALUES (${profileId}, ${name}, ${JSON.stringify(data)}::jsonb)
        RETURNING id, profile_id AS "profileId", name, data, created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      return Response.json(normalizeBuild(rows[0]), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      if (!profileId || !buildId) {
        return Response.json({ error: 'Profile and build id required' }, { status: 400, headers });
      }
      const body = await req.json();
      const name = body.name === undefined ? null : String(body.name || '').trim();
      const data = body.data === undefined ? null : body.data;

      let rows;
      if (name !== null && data !== null) {
        rows = await db`
          UPDATE builds
          SET name = ${name}, data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
          WHERE id = ${buildId} AND profile_id = ${profileId}
          RETURNING id, profile_id AS "profileId", name, data, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
      } else if (name !== null) {
        rows = await db`
          UPDATE builds
          SET name = ${name}, updated_at = NOW()
          WHERE id = ${buildId} AND profile_id = ${profileId}
          RETURNING id, profile_id AS "profileId", name, data, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
      } else if (data !== null) {
        rows = await db`
          UPDATE builds
          SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
          WHERE id = ${buildId} AND profile_id = ${profileId}
          RETURNING id, profile_id AS "profileId", name, data, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
      } else {
        return Response.json({ error: 'name or data required' }, { status: 400, headers });
      }

      const updated = normalizeBuild(rows[0]);
      if (!updated) return Response.json({ error: 'Not found' }, { status: 404, headers });
      return Response.json(updated, { headers });
    }

    if (req.method === 'DELETE') {
      if (!profileId || !buildId) {
        return Response.json({ error: 'Profile and build id required' }, { status: 400, headers });
      }
      const rows = await db`
        DELETE FROM builds
        WHERE id = ${buildId} AND profile_id = ${profileId}
        RETURNING id
      `;
      if (!rows[0]) return Response.json({ error: 'Not found' }, { status: 404, headers });
      return Response.json({ ok: true }, { headers });
    }

    return new Response('Method not allowed', { status: 405, headers });
  } catch (err) {
    console.error('builds function failed:', err);
    const message = err instanceof Error ? err.message : 'Build save failed';
    return Response.json({ error: message }, { status: 500, headers });
  }
};

export const config: Config = {
  path: '/api/builds',
};
