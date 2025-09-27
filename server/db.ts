import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";
import { getValidatedDatabaseConfig } from './config/dbConfig';

let pool: mysql.Pool;
let db: ReturnType<typeof drizzle>;
const dbType = 'mysql';

async function initializeDb() {
  try {
    const config = getValidatedDatabaseConfig();
    
    console.log("🔄 Connecting to MySQL database...");
    
    // Create connection pool with proper mysql2 configuration
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: 10,          // Maximum number of connections in pool
      waitForConnections: true,     // Queue requests when pool is full
      queueLimit: 0,               // No limit on queued requests
      connectTimeout: 60000,        // Initial connection timeout
      enableKeepAlive: true,        // Enable TCP keep-alive
      keepAliveInitialDelay: 10000, // 10 seconds before first keep-alive
    });
    
    db = drizzle(pool, { schema, mode: 'default' });
    console.log("✅ MySQL connection pool established successfully");
    
    // Test the connection pool
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("💓 Database connection pool is healthy");
    
    return db;
  } catch (error) {
    console.error("❌ Failed to connect to MySQL database:");
    console.error(`   Error: ${error}`);
    console.log("");
    console.log("🔧 Troubleshooting tips:");
    console.log("   1. Make sure XAMPP is running and MySQL service is started");
    console.log("   2. Verify database 'mapestate' exists in phpMyAdmin");
    console.log("   3. Check if MySQL is running on port 3306");
    console.log("   4. Create .env file with: MYSQL_URL=mysql://root:@localhost:3306/mapestate");
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
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
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
    if (pool) {
      await pool.end();
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