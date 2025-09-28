import mysql from 'mysql2/promise';
import { getValidatedDatabaseConfig } from './config/dbConfig';

async function testMySQLConnection() {
  console.log('🔍 Testing MySQL VPS Connection...');
  console.log('=' .repeat(50));
  
  try {
    // Get current configuration
    console.log('📋 Current Configuration:');
    const config = getValidatedDatabaseConfig();
    
    // Test connection with timeout
    console.log('\n🔄 Attempting to connect...');
    const connection = await Promise.race([
      mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectTimeout: 10000,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000)
      )
    ]) as mysql.Connection;

    console.log('✅ Connection established successfully!');

    // Test ping
    console.log('\n💓 Testing ping...');
    await Promise.race([
      connection.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Ping timeout (5s)')), 5000)
      )
    ]);
    console.log('✅ Ping successful!');

    // Test query
    console.log('\n🔍 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows);

    // Check database exists
    console.log('\n📊 Checking database...');
    const [databases] = await connection.execute(`SHOW DATABASES LIKE '${config.database}'`);
    if (Array.isArray(databases) && databases.length > 0) {
      console.log(`✅ Database '${config.database}' exists!`);
    } else {
      console.log(`❌ Database '${config.database}' not found!`);
      
      // Show available databases
      const [allDatabases] = await connection.execute('SHOW DATABASES');
      console.log('📋 Available databases:');
      (allDatabases as any[]).forEach((db: any) => {
        console.log(`   - ${Object.values(db)[0]}`);
      });
    }

    // Check tables
    console.log('\n📝 Checking tables...');
    const [tables] = await connection.execute(`SHOW TABLES FROM ${config.database}`);
    if (Array.isArray(tables) && tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables:`);
      (tables as any[]).forEach((table: any) => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    } else {
      console.log(`⚠️  No tables found in database '${config.database}'`);
      console.log('💡 You may need to run database migrations');
    }

    await connection.end();
    
    console.log('\n🎉 MySQL VPS Connection Test PASSED!');
    console.log('=' .repeat(50));
    return true;

  } catch (error) {
    console.log('\n❌ MySQL VPS Connection Test FAILED!');
    console.log('=' .repeat(50));
    console.error('Error:', error);
    
    console.log('\n🔧 Troubleshooting Tips:');
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('   • MySQL server is not running or not accessible');
        console.log('   • Check if your VPS MySQL service is started');
        console.log('   • Verify the host and port are correct');
        console.log('   • Check firewall settings on your VPS');
      } else if (error.message.includes('Access denied')) {
        console.log('   • Check username and password');
        console.log('   • Verify user has permission to connect from this IP');
        console.log('   • Check MySQL user privileges');
      } else if (error.message.includes('timeout')) {
        console.log('   • Connection is slow or blocked');
        console.log('   • Check network connectivity to VPS');
        console.log('   • Verify VPS is accessible and running');
      } else if (error.message.includes('Unknown database')) {
        console.log('   • Database does not exist on the server');
        console.log('   • Create the database first');
        console.log('   • Check database name spelling');
      }
    }
    
    console.log('\n💡 Environment Variables Needed:');
    console.log('   MYSQL_HOST=your-vps-ip-or-domain');
    console.log('   MYSQL_PORT=3306');
    console.log('   MYSQL_USER=your-mysql-user');
    console.log('   MYSQL_PASSWORD=your-mysql-password');
    console.log('   MYSQL_DATABASE=your-database-name');
    console.log('\n   Or use a single connection URL:');
    console.log('   MYSQL_URL=mysql://user:password@host:port/database');
    
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMySQLConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { testMySQLConnection };