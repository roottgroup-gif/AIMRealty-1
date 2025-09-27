#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

async function testMySQLConnection() {
  console.log('🔍 Testing MySQL VPS Connection...');
  console.log('');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   MYSQL_URL: ${process.env.MYSQL_URL || 'NOT SET'}`);
  console.log(`   MYSQL_HOST: ${process.env.MYSQL_HOST || 'NOT SET'}`);
  console.log(`   MYSQL_PORT: ${process.env.MYSQL_PORT || 'NOT SET'}`);
  console.log(`   MYSQL_USER: ${process.env.MYSQL_USER || 'NOT SET'}`);
  console.log(`   MYSQL_DATABASE: ${process.env.MYSQL_DATABASE || 'NOT SET'}`);
  console.log(`   MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? '***SET***' : 'NOT SET'}`);
  console.log('');

  try {
    // Test connection with environment variables
    const config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'mapestate',
      connectTimeout: 10000,
    };

    console.log('🔧 Connection Configuration:');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Password: ${config.password ? '***SET***' : 'EMPTY'}`);
    console.log('');

    console.log('🔄 Attempting connection...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Connection successful!');
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test passed:', rows);
    
    // Check database exists
    console.log('🔍 Checking database...');
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [config.database]);
    if ((databases as any[]).length > 0) {
      console.log(`✅ Database '${config.database}' exists`);
      
      // Check tables
      await connection.execute(`USE ${config.database}`);
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`📊 Found ${(tables as any[]).length} tables in database`);
      
      if ((tables as any[]).length > 0) {
        console.log('📋 Tables:');
        (tables as any[]).forEach((table, index) => {
          const tableName = Object.values(table)[0];
          console.log(`   ${index + 1}. ${tableName}`);
        });
      }
    } else {
      console.log(`⚠️ Database '${config.database}' does not exist`);
    }
    
    await connection.end();
    console.log('');
    console.log('🎉 MySQL VPS connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(`   Error: ${error}`);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('   1. Verify VPS MySQL server is running');
    console.log('   2. Check firewall allows connections on MySQL port');
    console.log('   3. Verify MySQL user has remote access permissions');
    console.log('   4. Confirm database exists on the VPS');
    console.log('   5. Check connection credentials are correct');
  }
}

// Run the test
testMySQLConnection().catch(console.error);