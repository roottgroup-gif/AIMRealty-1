import mysql from 'mysql2/promise';
import { getValidatedDatabaseConfig } from './config/dbConfig';

async function testMysqlConnection() {
  console.log("🔍 Testing MySQL VPS Connection...\n");
  
  try {
    const config = getValidatedDatabaseConfig();
    
    console.log("📋 Connection Details:");
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Password: ${config.password ? '[SET]' : '[NOT SET]'}\n`);
    
    console.log("🔄 Attempting connection...");
    
    // Test connection with timeout
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 10000,
    });
    
    console.log("✅ Connection established successfully!");
    
    // Test basic query
    console.log("🔍 Testing database query...");
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log("✅ Database query successful!");
    
    // Check if database exists and is accessible
    console.log("🔍 Checking database accessibility...");
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log(`✅ Database access confirmed! Found ${(databases as any[]).length} databases.`);
    
    // Test table creation permission
    console.log("🔍 Testing table creation permissions...");
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS connection_test (
          id INT PRIMARY KEY AUTO_INCREMENT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Table creation permission confirmed!");
      
      // Clean up test table
      await connection.execute('DROP TABLE IF EXISTS connection_test');
      console.log("🧹 Test table cleaned up");
    } catch (permError) {
      console.log("⚠️  Limited permissions - table creation failed:", (permError as Error).message);
    }
    
    await connection.end();
    console.log("\n🎉 VPS MySQL connection test completed successfully!");
    console.log("💡 Your VPS database is ready to use!");
    
  } catch (error) {
    console.error("\n❌ MySQL VPS Connection Failed!");
    console.error(`   Error: ${(error as Error).message}\n`);
    
    console.log("🔧 Troubleshooting Guide:");
    console.log("   1. ✅ Check VPS MySQL service status:");
    console.log("      sudo systemctl status mysql");
    console.log("   2. ✅ Verify MySQL is listening on correct port:");
    console.log("      sudo netstat -tlnp | grep mysql");
    console.log("   3. ✅ Check firewall settings:");
    console.log("      sudo ufw status");
    console.log("   4. ✅ Test connection from VPS locally:");
    console.log("      mysql -h localhost -u [username] -p");
    console.log("   5. ✅ Verify user permissions:");
    console.log("      GRANT ALL PRIVILEGES ON [database].* TO '[user]'@'%';");
    console.log("   6. ✅ Check MySQL bind-address in /etc/mysql/mysql.conf.d/mysqld.cnf");
    console.log("      Should be: bind-address = 0.0.0.0\n");
    
    // Specific error handling
    if ((error as any).code === 'ECONNREFUSED') {
      console.log("🚨 Connection Refused - Common causes:");
      console.log("   • MySQL service not running on VPS");
      console.log("   • Firewall blocking port 3306");
      console.log("   • Wrong host/port configuration");
    } else if ((error as any).code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("🚨 Access Denied - Authentication issue:");
      console.log("   • Wrong username/password");
      console.log("   • User doesn't have permission for remote connections");
    } else if ((error as any).code === 'ENOTFOUND') {
      console.log("🚨 Host Not Found:");
      console.log("   • Check VPS IP address is correct");
      console.log("   • Verify network connectivity to VPS");
    }
    
    process.exit(1);
  }
}

// Run the test
testMysqlConnection();