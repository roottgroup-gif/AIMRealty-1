import mysql from 'mysql2/promise';
import { getValidatedDatabaseConfig } from './server/config/dbConfig';
import fs from 'fs';
import path from 'path';

async function exportDatabase() {
  let connection: mysql.Connection | null = null;
  
  try {
    const config = getValidatedDatabaseConfig();
    
    console.log("🔗 Connecting to MySQL database...");
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    
    console.log("✅ Connected to MySQL database");
    
    const exportFileName = `database-export-${new Date().toISOString().split('T')[0]}.sql`;
    const exportPath = path.resolve(exportFileName);
    
    console.log(`\n📝 Exporting database to: ${exportPath}`);
    
    let sqlDump = `-- MapEstate Database Export\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${config.database}\n\n`;
    sqlDump += `SET NAMES utf8mb4;\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    // Get all tables
    const [tables] = await connection.query<any[]>('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0] as string);
    
    console.log(`\n📊 Found ${tableNames.length} tables to export:\n`);
    
    for (const tableName of tableNames) {
      console.log(`   Exporting table: ${tableName}...`);
      
      // Get CREATE TABLE statement
      const [createResult] = await connection.query<any[]>(`SHOW CREATE TABLE \`${tableName}\``);
      const createStatement = createResult[0]['Create Table'];
      
      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createStatement};\n\n`;
      
      // Get table data
      const [rows] = await connection.query<any[]>(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        console.log(`      → ${rows.length} rows`);
        
        sqlDump += `-- Data for table: ${tableName}\n`;
        sqlDump += `LOCK TABLES \`${tableName}\` WRITE;\n`;
        
        // Build INSERT statements in batches
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          
          const columns = Object.keys(batch[0]);
          const columnList = columns.map(c => `\`${c}\``).join(', ');
          
          const values = batch.map(row => {
            const vals = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? '1' : '0';
              return val;
            });
            return `(${vals.join(', ')})`;
          }).join(',\n  ');
          
          sqlDump += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n  ${values};\n`;
        }
        
        sqlDump += `UNLOCK TABLES;\n\n`;
      } else {
        console.log(`      → 0 rows (empty table)`);
      }
    }
    
    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    
    // Write to file
    fs.writeFileSync(exportPath, sqlDump, 'utf-8');
    
    console.log(`\n✅ Database exported successfully!`);
    console.log(`📁 Export file: ${exportFileName}`);
    console.log(`📊 File size: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`);
    console.log(`\n📤 Transfer this file to your VPS and import it using:`);
    console.log(`   tsx server/import-sql.ts ${exportFileName}`);
    
  } catch (error: any) {
    console.error("\n❌ Export failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

exportDatabase()
  .then(() => {
    console.log("\n✅ Export completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Export failed:", error);
    process.exit(1);
  });
