import { drizzle as drizzleMySQL } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import * as sqliteSchema from "@shared/sqlite-schema";

let client: mysql.Connection | Database;
let db: ReturnType<typeof drizzleMySQL> | ReturnType<typeof drizzleSQLite>;
let dbType: 'mysql' | 'sqlite' = 'sqlite';

async function initializeDb() {
  const databaseUrl = process.env.DATABASE_URL;
  const mysqlUrl = process.env.MYSQL_URL;
  
  // Priority: MySQL_URL > MySQL DATABASE_URL > SQLite fallback
  if (mysqlUrl || (databaseUrl && databaseUrl.includes('mysql://'))) {
    try {
      console.log("Connecting to MySQL database...");
      const url = mysqlUrl || databaseUrl!;
      client = await mysql.createConnection(url);
      db = drizzleMySQL(client, { schema, mode: 'default' });
      dbType = 'mysql';
      console.log("✅ MySQL database connection established");
      return db;
    } catch (error) {
      console.error("❌ Failed to connect to MySQL:", error);
      console.log("🔄 Falling back to SQLite database...");
    }
  }
  
  // SQLite fallback (default) - simplified for development
  console.log("⚠️ MySQL not configured, falling back to memory storage for development");
  console.log("💡 To use MySQL: Set MYSQL_URL=mysql://user:pass@host:port/database");
  throw new Error("Using memory storage fallback");
}

async function initializeSQLiteTables() {
  // Create tables if they don't exist
  (client as Database).exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      avatar TEXT,
      is_verified INTEGER DEFAULT 0,
      wave_balance INTEGER DEFAULT 10,
      expires_at DATETIME,
      is_expired INTEGER DEFAULT 0,
      allowed_languages TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      listing_type TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      bedrooms INTEGER,
      bathrooms INTEGER,
      area INTEGER,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      images TEXT,
      amenities TEXT,
      features TEXT,
      status TEXT DEFAULT 'active',
      language TEXT DEFAULT 'en',
      agent_id TEXT,
      contact_phone TEXT,
      wave_id TEXT,
      views INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      slug TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Insert default admin user
    INSERT OR IGNORE INTO users (id, username, email, password, role, first_name, last_name) 
    VALUES ('admin-001', 'admin', 'admin@mapestate.com', '$2a$10$hash_placeholder', 'super_admin', 'Admin', 'User');
  `);
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDb() first.");
  }
  return db;
}

function getDbType(): 'mysql' | 'sqlite' {
  return dbType;
}

export { getDb as db, initializeDb, getDbType };