import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

function toPgParams(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

let pool: pg.Pool | null = null;

function createPrepare(sql: string) {
  return {
    async get(...params: (string | number)[]) {
      if (!pool) throw new Error("DB not initialized");
      const res = await pool.query(toPgParams(sql), params);
      return res.rows[0] as Record<string, unknown> | undefined;
    },
    async all(...params: (string | number)[]) {
      if (!pool) throw new Error("DB not initialized");
      const res = await pool.query(toPgParams(sql), params);
      return res.rows as Record<string, unknown>[];
    },
    async run(...params: (string | number)[]) {
      if (!pool) throw new Error("DB not initialized");
      let runSql = sql;
      const isInsert = runSql.trim().toUpperCase().startsWith("INSERT");
      if (isInsert && !/RETURNING\s+id\b/i.test(runSql)) {
        runSql = runSql.replace(/;\s*$/, "") + " RETURNING id";
      }
      const res = await pool.query(toPgParams(runSql), params);
      let lastInsertRowid = 0;
      if (isInsert && res.rows[0]) {
        lastInsertRowid = Number((res.rows[0] as Record<string, unknown>).id ?? 0);
      }
      return { lastInsertRowid, changes: res.rowCount ?? 0 };
    },
  };
}

const WORKFLOW_STATUSES = `
  'estimate_draft','estimate_submitted','recording','record_complete',
  'invoice_draft','invoice_ready','submitted','resubmitted','cost_pending','cost_complete'
`;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_number TEXT NOT NULL,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    client_code TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN (${WORKFLOW_STATUSES})),
    estimate_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax_total INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

  CREATE TABLE IF NOT EXISTS project_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_date TEXT NOT NULL,
    description TEXT NOT NULL,
    work_type_name TEXT,
    product_name TEXT,
    spec TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    tax_rate INTEGER NOT NULL,
    tax INTEGER NOT NULL,
    tax_category TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_project_items_project ON project_items(project_id);

  CREATE TABLE IF NOT EXISTS construction_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    record_date TEXT NOT NULL,
    description TEXT NOT NULL,
    work_type_name TEXT,
    product_name TEXT,
    spec TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    remarks TEXT NOT NULL DEFAULT '',
    tax_category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_records_user ON construction_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_records_project ON construction_records(project_id);

  CREATE TABLE IF NOT EXISTS client_formats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_code TEXT NOT NULL,
    format_name TEXT NOT NULL,
    fields_json TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_client_formats_user ON client_formats(user_id);

  CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    project_id INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    client TEXT NOT NULL,
    client_code TEXT NOT NULL,
    format TEXT NOT NULL CHECK(format IN ('自社書式','元請書式')),
    client_format_id INTEGER,
    status TEXT NOT NULL CHECK(status IN ('draft','ready','submitted','resubmitted')),
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax_total INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);

  CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_date TEXT NOT NULL,
    description TEXT NOT NULL,
    work_type_name TEXT,
    product_name TEXT,
    spec TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    tax_rate INTEGER NOT NULL,
    tax INTEGER NOT NULL,
    tax_category TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

  CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    project_name TEXT NOT NULL,
    client TEXT NOT NULL,
    submitted_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','accepted','rejected','resubmit_required')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_invoice ON submissions(invoice_id);

  CREATE TABLE IF NOT EXISTS cost_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_amount INTEGER NOT NULL,
    actual_amount INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_cost_entries_user ON cost_entries(user_id);
  CREATE INDEX IF NOT EXISTS idx_cost_entries_project ON cost_entries(project_id);
`;

export type PrepareReturn = ReturnType<typeof createPrepare>;
export type DbWrapper = {
  prepare: (sql: string) => PrepareReturn;
  exec: (sql: string) => Promise<void>;
};

let _db: DbWrapper | null = null;

export async function initDb(): Promise<DbWrapper> {
  pool = new Pool({ connectionString: config.databaseUrl });
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
  } finally {
    client.release();
  }

  _db = {
    prepare(sql: string) {
      return createPrepare(sql);
    },
    async exec(sql: string) {
      if (pool) await pool.query(sql);
    },
  };
  return _db;
}

function getDb(): DbWrapper {
  if (!_db) throw new Error("Database not initialized. Call await initDb() first.");
  return _db;
}

export const db = new Proxy({} as DbWrapper, {
  get(_, prop) {
    return (getDb() as Record<string, unknown>)[prop as string];
  },
});

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
};
