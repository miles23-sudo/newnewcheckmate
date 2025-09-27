import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if we have a DATABASE_URL, if not, use SQLite for local development
if (!process.env.DATABASE_URL) {
  console.log(`
⚠️  DATABASE_URL not set - using SQLite for local development

For production, you should:
1. Create a .env file in the project root
2. Add your Neon Database URL to it:
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require

3. Get a free database from Neon:
   - Go to https://console.neon.tech/
   - Sign up for a free account
   - Create a new project
   - Copy the connection string from the dashboard

For now, using SQLite database: ./dev.db
`);
}

let pool: Pool | undefined;
let db: any;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL (Neon) for production
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Use SQLite for local development
  const sqlite = new Database('./dev.db');
  db = drizzleSQLite(sqlite, { schema });
}

export { pool, db };