#!/usr/bin/env node

// MySQL VPS Connection Test Script
import mysql from 'mysql2/promise';

console.log('🔍 MySQL VPS Connection Test');
console.log('==============================\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   MYSQL_URL: ${process.env.MYSQL_URL ? '[SET]' : '[NOT SET]'}`);
console.log(`   MYSQL_HOST: ${process.env.MYSQL_HOST || '[NOT SET]'}`);
console.log(`   MYSQL_USER: ${process.env.MYSQL_USER || '[NOT SET]'}`);
console.log(`   MYSQL_DATABASE: ${process.env.MYSQL_DATABASE || '[NOT SET]'}`);
console.log(`   MYSQL_PORT: ${process.env.MYSQL_PORT || '[NOT SET]'}`);
console.log(`   MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? '[SET - ' + process.env.MYSQL_PASSWORD.length + ' chars]' : '[NOT SET]'}`);
console.log('');

// Test connection using individual variables
if (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE) {
  console.log('🔗 Testing VPS MySQL connection...');
  console.log(`   Connecting to: ${process.env.MYSQL_USER}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE}`);
  
  const config = {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000,
  };

  try {
    console.log('🔄 Creating connection...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Connection established successfully!');
    
    console.log('🔍 Testing database access...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time, DATABASE() as current_db, USER() as current_user');
    console.log('✅ Database query successful:');
    console.log('   Test value:', rows[0].test);
    console.log('   Current time:', rows[0].current_time);
    console.log('   Current database:', rows[0].current_db);
    console.log('   Current user:', rows[0].current_user);
    
    console.log('🔍 Checking database tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables in database:`);
      tables.slice(0, 10).forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
      if (tables.length > 10) {
        console.log(`   ... and ${tables.length - 10} more tables`);
      }
    } else {
      console.log('⚠️ No tables found in database (empty database)');
    }
    
    await connection.end();
    console.log('🔌 Connection closed successfully');
    console.log('');
    console.log('🎉 VPS MySQL connection is working perfectly!');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    if (error.errno) {
      console.error('   Errno:', error.errno);
    }
    console.log('');
    console.log('🔧 Troubleshooting suggestions:');
    console.log('   1. Check if the VPS MySQL server is running');
    console.log('   2. Verify firewall settings allow connections on MySQL port');
    console.log('   3. Confirm the database user has proper permissions');
    console.log('   4. Check if the database name exists');
    console.log('   5. Verify credentials are correct');
    process.exit(1);
  }
} else {
  console.log('❌ Missing required environment variables for VPS connection');
  console.log('');
  console.log('📝 Required variables:');
  console.log('   MYSQL_HOST - Your VPS IP address or hostname');
  console.log('   MYSQL_USER - Database username');
  console.log('   MYSQL_DATABASE - Database name');
  console.log('   MYSQL_PASSWORD - Database password (optional if no password)');
  console.log('   MYSQL_PORT - MySQL port (optional, defaults to 3306)');
  console.log('');
  console.log('💡 Alternative: Set MYSQL_URL with full connection string:');
  console.log('   mysql://username:password@host:port/database');
  process.exit(1);
}