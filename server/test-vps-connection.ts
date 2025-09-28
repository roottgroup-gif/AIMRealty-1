#!/usr/bin/env tsx

console.log("🧪 Testing VPS Database Connection...");

// Direct environment variable check
console.log("\n🔍 Environment Variables Check:");
console.log("MYSQL_URL:", process.env.MYSQL_URL ? "✅ SET" : "❌ NOT SET");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ SET" : "❌ NOT SET");
console.log("MYSQL_HOST:", process.env.MYSQL_HOST ? "✅ SET" : "❌ NOT SET");
console.log("MYSQL_USER:", process.env.MYSQL_USER ? "✅ SET" : "❌ NOT SET");
console.log("MYSQL_DATABASE:", process.env.MYSQL_DATABASE ? "✅ SET" : "❌ NOT SET");
console.log("MYSQL_PORT:", process.env.MYSQL_PORT ? "✅ SET" : "❌ NOT SET");
console.log("MYSQL_PASSWORD:", process.env.MYSQL_PASSWORD ? "✅ SET" : "❌ NOT SET");

// Test connection if environment variables are available
if (process.env.MYSQL_URL || (process.env.MYSQL_HOST && process.env.MYSQL_USER)) {
  console.log("\n🔗 Attempting VPS connection...");
  
  try {
    const mysql = await import('mysql2/promise');
    
    let config;
    if (process.env.MYSQL_URL) {
      const url = new URL(process.env.MYSQL_URL);
      config = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
      };
    } else {
      config = {
        host: process.env.MYSQL_HOST!,
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER!,
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE!,
      };
    }
    
    console.log(`🎯 Connecting to: ${config.user}@${config.host}:${config.port}/${config.database}`);
    
    const connection = await mysql.createConnection({
      ...config,
      connectTimeout: 10000,
    });
    
    await connection.ping();
    console.log("✅ VPS Database connection successful!");
    
    // Test a simple query
    const [result] = await connection.execute('SELECT 1 as test');
    console.log("✅ Query test successful:", result);
    
    await connection.end();
    console.log("🔌 Connection closed properly");
    
  } catch (error) {
    console.error("❌ VPS Database connection failed:");
    console.error("Error:", error);
    
    if ((error as any).code === 'ECONNREFUSED') {
      console.log("\n🚨 Connection refused - possible issues:");
      console.log("   1. VPS MySQL server is not running");
      console.log("   2. MySQL port (3306) is not open on VPS");
      console.log("   3. Firewall blocking connection");
      console.log("   4. Wrong host/port configuration");
    } else if ((error as any).code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("\n🚨 Access denied - authentication issues:");
      console.log("   1. Wrong username/password");
      console.log("   2. User doesn't have remote access permissions");
      console.log("   3. MySQL user not configured for remote connections");
    }
  }
} else {
  console.log("\n⚠️ No VPS database configuration found");
  console.log("💡 Set MYSQL_URL or individual MYSQL_* environment variables");
  console.log("\nExample MYSQL_URL format:");
  console.log("mysql://username:password@72.60.134.44:3306/mapestate");
}

console.log("\n🏁 VPS connection test completed");