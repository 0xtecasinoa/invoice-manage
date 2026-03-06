/**
 * Creates the application database if it does not exist.
 * Connects to the default "postgres" database, then runs CREATE DATABASE.
 * Usage: npx tsx scripts/create-db.ts
 * Requires: DATABASE_URL in .env (e.g. postgresql://postgres:postgres@localhost:5432/invoice_system)
 */
import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Create server/.env from .env.example.");
  process.exit(1);
}

const parsed = new URL(url);
const dbName = parsed.pathname.replace(/^\//, "") || "invoice_system";
parsed.pathname = "/postgres"; // connect to default DB
const adminUrl = parsed.toString();

async function main() {
  const client = new pg.Client({ connectionString: adminUrl });
  try {
    await client.connect();
    if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
      throw new Error("Invalid database name in DATABASE_URL");
    }
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (res.rows.length > 0) {
      console.log(`Database "${dbName}" already exists.`);
      return;
    }
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database "${dbName}" created.`);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
