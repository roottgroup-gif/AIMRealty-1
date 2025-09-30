import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";
import { getValidatedDatabaseConfig } from './config/dbConfig';

let queryClient: mysql.Pool;
let db: ReturnType<typeof drizzle>;
const dbType = 'mysql';

async function initializeDb() {
  try {
    const config = getValidatedDatabaseConfig();
    
    console.log("🔄 Connecting to MySQL VPS database...");
    
    // Create connection pool with proper mysql2 configuration
    queryClient = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
    
    db = drizzle(queryClient, { schema, mode: 'default' });
    console.log("✅ MySQL VPS connection established successfully");
    
    // Test the connection
    try {
      console.log("🔍 Testing database connection...");
      await queryClient.query('SELECT 1');
      console.log("💓 Database connection is healthy");
    } catch (pingError) {
      console.warn("⚠️ Connection test failed:", pingError);
      throw pingError;
    }
    
    return db;
  } catch (error) {
    console.error("❌ Failed to connect to MySQL VPS database:");
    console.error(`   Error: ${error}`);
    throw new Error(`MySQL connection failed: ${error}`);
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
    await queryClient.query('SELECT 1');
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

function getDbType(): 'mysql' {
  return dbType;
}

export { getDb as db, initializeDb, getDbType, checkDatabaseHealth, recoverConnection };