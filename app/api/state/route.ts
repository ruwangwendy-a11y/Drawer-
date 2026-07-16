import { env } from "cloudflare:workers";

const DEVICE_PATTERN = /^[a-zA-Z0-9-]{16,80}$/;

function deviceId(request: Request) {
  const value = request.headers.get("x-drawer-device") ?? "";
  return DEVICE_PATTERN.test(value) ? value : null;
}

async function ensureTable() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS drawer_states (
    device_id TEXT PRIMARY KEY NOT NULL,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

export async function GET(request: Request) {
  const id = deviceId(request);
  if (!id) return Response.json({ error: "Missing device identity" }, { status: 400 });
  await ensureTable();
  const row = await env.DB.prepare("SELECT state_json FROM drawer_states WHERE device_id = ?").bind(id).first<{ state_json: string }>();
  return Response.json({ state: row ? JSON.parse(row.state_json) : null });
}

export async function PUT(request: Request) {
  const id = deviceId(request);
  if (!id) return Response.json({ error: "Missing device identity" }, { status: 400 });
  const state = await request.json();
  const stateJson = JSON.stringify(state);
  if (stateJson.length > 1_000_000) return Response.json({ error: "State is too large" }, { status: 413 });
  await ensureTable();
  await env.DB.prepare(`INSERT INTO drawer_states (device_id, state_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(device_id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP`)
    .bind(id, stateJson).run();
  return Response.json({ saved: true });
}
