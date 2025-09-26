import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";
import { getValidatedDatabaseConfig } from './config/dbConfig';

let client: mysql.Connection;
let db: ReturnType<typeof drizzle>;
const dbType = 'mysql';

async function initializeDb() {
  try {
    const config = getValidatedDatabaseConfig();
    
    console.log("🔄 Connecting to MySQL database...");
    client = await mysql.createConnection(config.connectionUrl);
    db = drizzle(client, { schema, mode: 'default' });
    console.log("✅ MySQL database connection established successfully");
    
    // Test the connection
    await client.ping();
    console.log("💓 Database connection is healthy");
    
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

function getDbType(): 'mysql' {
  return dbType;
}

export { getDb as db, initializeDb, getDbType };