import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

let queryClient: postgres.Sql;
let db: ReturnType<typeof drizzle>;
const dbType = 'postgres';

async function initializeDb() {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    console.log("🔄 Connecting to PostgreSQL database...");
    
    // Create connection with proper postgres.js configuration
    queryClient = postgres(connectionString, {
      max: 10,                      // Connection pool size
      idle_timeout: 20,             // Close idle connections after 20s
      connect_timeout: 10,          // Connection timeout in seconds
      prepare: false,               // Disable prepared statements for compatibility
    });
    
    db = drizzle(queryClient, { schema });
    console.log("✅ PostgreSQL connection established successfully");
    
    // Test the connection
    try {
      console.log("🔍 Testing database connection...");
      await queryClient`SELECT 1`;
      console.log("💓 Database connection is healthy");
    } catch (pingError) {
      console.warn("⚠️ Connection test failed:", pingError);
      throw pingError;
    }
    
    return db;
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL database:");
    console.error(`   Error: ${error}`);
    throw new Error(`PostgreSQL connection failed: ${error}`);
  }
}


function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDb() first.");
  }
  return db;
}

// Health check function
async function checkDatabaseHealth() {
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch (error) {
    console.warn("⚠️ Database health check failed:", error);
    return false;
  }
}

// Connection recovery function
async function recoverConnection() {
  try {
    console.log("🔄 Attempting database connection recovery...");
    if (queryClient) {
      await queryClient.end();
    }
    return await initializeDb();
  } catch (error) {
    console.error("❌ Connection recovery failed:", error);
    throw error;
  }
}

function getDbType(): 'postgres' {
  return dbType;
}

export { getDb as db, initializeDb, getDbType, checkDatabaseHealth, recoverConnection };