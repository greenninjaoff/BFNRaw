import "dotenv/config";
import { Pool, types } from "pg";

// Force pg to interpret TIMESTAMP WITHOUT TIME ZONE as UTC.
// Prisma always stores UTC. Without this, pg may treat the raw timestamp
// string as local server time, causing a double-offset when we apply AT TIME ZONE.
// Type 1114 = TIMESTAMP, type 1184 = TIMESTAMPTZ
types.setTypeParser(1114, (val: string) => {
  // Return ISO string with explicit Z suffix so JS Date always parses as UTC
  return val ? new Date(val + "Z") : null;
});
types.setTypeParser(1184, (val: string) => {
  return val ? new Date(val) : null;
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech") || process.env.DATABASE_URL?.includes("amazonaws")
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// SET timezone = 'UTC' on every new connection so all TIMESTAMP AT TIME ZONE
// operations start from a known UTC base.
pool.on("connect", (client) => {
  client.query("SET timezone = 'UTC'").catch(() => {});
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getPool: () => pool,
};

export default db;
