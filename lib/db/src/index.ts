import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import * as schema from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve root directory of the monorepo
const rootDir = path.resolve(__dirname, "..", "..", "..");

// Default DB path is repository root db.sqlite unless DATABASE_URL is set
function resolveDbPath(): string {
  if (process.env.DATABASE_URL) {
    if (path.isAbsolute(process.env.DATABASE_URL)) {
      return process.env.DATABASE_URL;
    }
    const cwdResolved = path.resolve(process.cwd(), process.env.DATABASE_URL);
    if (fs.existsSync(cwdResolved)) {
      return cwdResolved;
    }
    return path.resolve(rootDir, path.basename(process.env.DATABASE_URL));
  }
  return path.join(rootDir, "db.sqlite");
}

export const dbPath = resolveDbPath();

import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Find sql-wasm.wasm dynamically using node module resolution
function resolveWasmPath(): string {
  try {
    const sqlJsMain = require.resolve("sql.js");
    const wasm = path.join(path.dirname(sqlJsMain), "sql-wasm.wasm");
    if (fs.existsSync(wasm)) return wasm;
  } catch {}
  return path.join(rootDir, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
}

const wasmPath = resolveWasmPath();

// Initialize sql.js (WASM) and create/load the database synchronously at module load.
const SQL = await initSqlJs({
  locateFile: () => wasmPath,
});

export let sqlJsDb: InstanceType<typeof SQL.Database>;

if (fs.existsSync(dbPath)) {
  const file = fs.readFileSync(dbPath);
  sqlJsDb = new SQL.Database(new Uint8Array(file));
} else {
  sqlJsDb = new SQL.Database();
}

// Auto-create all required tables if they don't already exist
sqlJsDb.run(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  material TEXT NOT NULL,
  total_qty REAL NOT NULL,
  location TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  dealer_id TEXT NOT NULL,
  price_per_unit REAL NOT NULL,
  available_qty REAL NOT NULL,
  delivery_date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sub_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  dealer_id TEXT NOT NULL,
  allocated_qty REAL NOT NULL,
  price_per_unit REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'allocated',
  created_at INTEGER NOT NULL
);
`);

/**
 * Persists the in-memory SQLite database to disk
 */
export function saveDb(): void {
  try {
    const data = sqlJsDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error("Failed to save database to disk:", err);
  }
}

// Ensure initial schema is persisted
saveDb();

// Persist on process exit
process.on("beforeExit", () => saveDb());
process.on("SIGINT", () => {
  saveDb();
  process.exit(0);
});
process.on("SIGTERM", () => {
  saveDb();
  process.exit(0);
});

export const db = drizzle(sqlJsDb, { schema });

export * from "./schema";
